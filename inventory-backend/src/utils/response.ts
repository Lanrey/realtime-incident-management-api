import { FastifyReply } from 'fastify';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ResponseHandler {
  static success<T>(reply: FastifyReply, data: T, statusCode: number = 200): FastifyReply {
    return reply.code(statusCode).send({
      success: true,
      data,
    } as ApiResponse<T>);
  }

  static successWithMeta<T>(
    reply: FastifyReply,
    data: T,
    meta: ApiResponse['meta'],
    statusCode: number = 200
  ): FastifyReply {
    return reply.code(statusCode).send({
      success: true,
      data,
      meta,
    } as ApiResponse<T>);
  }

  static error(
    reply: FastifyReply,
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ): FastifyReply {
    return reply.code(statusCode).send({
      success: false,
      error: {
        message,
        code,
        details,
      },
    } as ApiResponse);
  }

  static badRequest(reply: FastifyReply, message: string, details?: any): FastifyReply {
    return this.error(reply, message, 400, 'BAD_REQUEST', details);
  }

  static notFound(reply: FastifyReply, message: string = 'Resource not found'): FastifyReply {
    return this.error(reply, message, 404, 'NOT_FOUND');
  }

  static serverError(reply: FastifyReply, error: any): FastifyReply {
    const message = error?.message || 'Internal server error';
    return this.error(reply, message, 500, 'INTERNAL_ERROR', error);
  }
}
