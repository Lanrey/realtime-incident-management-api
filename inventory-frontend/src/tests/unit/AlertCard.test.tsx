import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../testUtils';
import { AlertCard } from '../../components/Alerts/AlertCard';
import { Alert } from '../../types';

describe('AlertCard', () => {
  const mockAlert: Alert = {
    id: '1',
    type: 'LOW_STOCK',
    severity: 'WARNING',
    message: 'Product running low on stock',
    metadata: {
      productName: 'Test Product',
      productSku: 'SKU001',
      warehouseName: 'Main Warehouse',
      currentQuantity: 5,
      reorderThreshold: 20,
    },
    isResolved: false,
    createdAt: new Date().toISOString(),
  };

  it('should render alert with correct information', () => {
    render(<AlertCard alert={mockAlert} />);

    expect(screen.getByText('WARNING')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('Product running low on stock')).toBeInTheDocument();
    expect(screen.getByText(/Test Product/)).toBeInTheDocument();
    expect(screen.getByText(/SKU001/)).toBeInTheDocument();
    expect(screen.getByText(/Main Warehouse/)).toBeInTheDocument();
  });

  it('should display correct severity styles for CRITICAL', () => {
    const criticalAlert: Alert = { ...mockAlert, severity: 'CRITICAL' };
    const { container } = render(<AlertCard alert={criticalAlert} />);

    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
  });

  it('should display correct severity styles for ERROR', () => {
    const errorAlert: Alert = { ...mockAlert, severity: 'ERROR' };
    const { container } = render(<AlertCard alert={errorAlert} />);

    expect(screen.getByText('ERROR')).toBeInTheDocument();
    expect(container.querySelector('.bg-orange-50')).toBeInTheDocument();
  });

  it('should display correct severity styles for INFO', () => {
    const infoAlert: Alert = { ...mockAlert, severity: 'INFO' };
    const { container } = render(<AlertCard alert={infoAlert} />);

    expect(screen.getByText('INFO')).toBeInTheDocument();
    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
  });

  it('should display resolved badge when alert is resolved', () => {
    const resolvedAlert: Alert = {
      ...mockAlert,
      isResolved: true,
      resolvedAt: new Date().toISOString(),
    };

    render(<AlertCard alert={resolvedAlert} />);

    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('should call onResolve when resolve button is clicked', () => {
    const onResolve = vi.fn();
    render(<AlertCard alert={mockAlert} onResolve={onResolve} />);

    const resolveButton = screen.getByTitle('Mark as Resolved');
    fireEvent.click(resolveButton);

    expect(onResolve).toHaveBeenCalledWith('1');
  });

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<AlertCard alert={mockAlert} onDelete={onDelete} />);

    const deleteButton = screen.getByTitle('Delete Alert');
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('should not show action buttons when showActions is false', () => {
    render(<AlertCard alert={mockAlert} showActions={false} />);

    expect(screen.queryByTitle('Mark as Resolved')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete Alert')).not.toBeInTheDocument();
  });

  it('should not show action buttons when alert is resolved', () => {
    const resolvedAlert: Alert = { ...mockAlert, isResolved: true };
    render(<AlertCard alert={resolvedAlert} onResolve={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.queryByTitle('Mark as Resolved')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete Alert')).not.toBeInTheDocument();
  });

  it('should display stock level information correctly', () => {
    render(<AlertCard alert={mockAlert} />);

    expect(screen.getByText(/Stock Level:/)).toBeInTheDocument();
    expect(screen.getByText(/5 \/ 20/)).toBeInTheDocument();
  });

  it('should display capacity information for capacity alerts', () => {
    const capacityAlert: Alert = {
      ...mockAlert,
      type: 'CAPACITY_WARNING',
      metadata: {
        warehouseName: 'Main Warehouse',
        currentStock: 900,
        capacity: 1000,
      },
    };

    render(<AlertCard alert={capacityAlert} />);

    expect(screen.getByText(/Capacity:/)).toBeInTheDocument();
    expect(screen.getByText(/900 \/ 1,000/)).toBeInTheDocument();
    expect(screen.getByText(/90%/)).toBeInTheDocument();
  });

  it('should display order number for order delayed alerts', () => {
    const orderAlert: Alert = {
      ...mockAlert,
      type: 'ORDER_DELAYED',
      metadata: {
        orderNumber: 'PO-20231201-123456',
      },
    };

    render(<AlertCard alert={orderAlert} />);

    expect(screen.getByText(/Order:/)).toBeInTheDocument();
    expect(screen.getByText(/PO-20231201-123456/)).toBeInTheDocument();
  });

  it('should format recent timestamps correctly', () => {
    const recentAlert: Alert = {
      ...mockAlert,
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
    };

    render(<AlertCard alert={recentAlert} />);

    expect(screen.getByText(/30m ago/)).toBeInTheDocument();
  });

  it('should show "Just now" for very recent alerts', () => {
    const justNowAlert: Alert = {
      ...mockAlert,
      createdAt: new Date().toISOString(),
    };

    render(<AlertCard alert={justNowAlert} />);

    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('should display correct type labels', () => {
    const types: Array<{ type: Alert['type']; label: string }> = [
      { type: 'LOW_STOCK', label: 'Low Stock' },
      { type: 'CAPACITY_WARNING', label: 'Capacity Warning' },
      { type: 'CAPACITY_EXCEEDED', label: 'Capacity Exceeded' },
      { type: 'ORDER_DELAYED', label: 'Order Delayed' },
      { type: 'SYSTEM_ERROR', label: 'System Error' },
    ];

    types.forEach(({ type, label }) => {
      const alert: Alert = { ...mockAlert, type };
      const { unmount } = render(<AlertCard alert={alert} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });

  it('should apply opacity when alert is resolved', () => {
    const resolvedAlert: Alert = { ...mockAlert, isResolved: true };
    const { container } = render(<AlertCard alert={resolvedAlert} />);

    const alertCard = container.querySelector('.opacity-60');
    expect(alertCard).toBeInTheDocument();
  });

  it('should handle missing metadata gracefully', () => {
    const minimalAlert: Alert = {
      id: '1',
      type: 'SYSTEM_ERROR',
      severity: 'ERROR',
      message: 'System error occurred',
      metadata: undefined,
      isResolved: false,
      createdAt: new Date().toISOString(),
    };

    render(<AlertCard alert={minimalAlert} />);

    expect(screen.getByText('System error occurred')).toBeInTheDocument();
    expect(screen.queryByText(/Product:/)).not.toBeInTheDocument();
  });

  it('should handle null metadata gracefully', () => {
    const nullMetadataAlert: Alert = {
      id: '1',
      type: 'SYSTEM_ERROR',
      severity: 'ERROR',
      message: 'System error occurred',
      metadata: null as any,
      isResolved: false,
      createdAt: new Date().toISOString(),
    };

    render(<AlertCard alert={nullMetadataAlert} />);

    expect(screen.getByText('System error occurred')).toBeInTheDocument();
  });

  it('should calculate capacity percentage correctly', () => {
    const capacityAlert: Alert = {
      ...mockAlert,
      type: 'CAPACITY_WARNING',
      metadata: {
        warehouseName: 'Main Warehouse',
        currentStock: 750,
        capacity: 1000,
      },
    };

    render(<AlertCard alert={capacityAlert} />);

    expect(screen.getByText(/75%/)).toBeInTheDocument();
  });

  it('should display both resolve and delete buttons when callbacks provided', () => {
    render(
      <AlertCard alert={mockAlert} onResolve={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByTitle('Mark as Resolved')).toBeInTheDocument();
    expect(screen.getByTitle('Delete Alert')).toBeInTheDocument();
  });

  it('should format old dates correctly', () => {
    const oldAlert: Alert = {
      ...mockAlert,
      createdAt: new Date('2023-01-01').toISOString(),
    };

    render(<AlertCard alert={oldAlert} />);

    // Should show full date for old alerts
    expect(screen.getByText(/1\/1\/2023|01\/01\/2023/)).toBeInTheDocument();
  });
});
