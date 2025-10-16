import amqp, { Channel, Connection } from 'amqplib';
import { env } from './env';

export const QUEUES = {
  STOCK_CHECK: 'stock.check.queue',
  ORDER_PROCESS: 'order.process.queue',
  ORDER_ARRIVAL: 'order.arrival.queue',
  CAPACITY_ALERT: 'capacity.alert.queue',
};

export const EXCHANGES = {
  INVENTORY: 'inventory.exchange',
};

class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnecting: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.connection = await amqp.connect(env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('❌ RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        console.warn('⚠️ RabbitMQ connection closed, attempting to reconnect...');
        this.connection = null;
        this.channel = null;
        this.isConnecting = false;
        setTimeout(() => this.connect(), 5000);
      });

      // Handle channel errors
      this.channel.on('error', (err) => {
        console.error('❌ RabbitMQ channel error:', err);
      });

      this.channel.on('close', () => {
        console.warn('⚠️ RabbitMQ channel closed');
        this.channel = null;
      });

      // Setup exchanges
      await this.channel.assertExchange(EXCHANGES.INVENTORY, 'topic', {
        durable: true,
      });

      // Setup queues
      for (const queue of Object.values(QUEUES)) {
        await this.channel.assertQueue(queue, {
          durable: true,
          arguments: {
            'x-max-priority': 10, // Support priority messages
          },
        });
      }

      // Bind queues to exchange
      await this.channel.bindQueue(
        QUEUES.STOCK_CHECK,
        EXCHANGES.INVENTORY,
        'stock.check'
      );
      await this.channel.bindQueue(
        QUEUES.ORDER_PROCESS,
        EXCHANGES.INVENTORY,
        'order.process'
      );
      await this.channel.bindQueue(
        QUEUES.ORDER_ARRIVAL,
        EXCHANGES.INVENTORY,
        'order.arrival'
      );
      await this.channel.bindQueue(
        QUEUES.CAPACITY_ALERT,
        EXCHANGES.INVENTORY,
        'capacity.alert'
      );

      // Set prefetch for fair dispatch
      await this.channel.prefetch(env.MAX_CONCURRENT_ORDERS);

      this.isConnecting = false;
      console.log('✅ RabbitMQ connected successfully');
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ RabbitMQ connection failed:', error);
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publish(
    routingKey: string,
    message: any,
    priority: number = 0
  ): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const content = Buffer.from(JSON.stringify(message));
    return this.channel.publish(EXCHANGES.INVENTORY, routingKey, content, {
      persistent: true,
      priority,
      contentType: 'application/json',
      timestamp: Date.now(),
    });
  }

  async consume(
    queue: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    await this.channel.consume(
      queue,
      async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel?.ack(msg);
        } catch (error) {
          console.error(`Error processing message from ${queue}:`, error);
          // Reject and requeue with delay
          this.channel?.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel;
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      console.log('RabbitMQ disconnected');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}

export const rabbitmq = new RabbitMQService();

// Graceful shutdown
process.on('beforeExit', async () => {
  await rabbitmq.close();
});
