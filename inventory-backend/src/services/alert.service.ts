import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { appEvents } from '../utils/eventEmitter';
import { Prisma } from '@prisma/client';

export interface QueryAlertsInput {
  page?: number;
  limit?: number;
  type?: string;
  severity?: string;
  isResolved?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AlertService {
  async getAlerts(query: QueryAlertsInput) {
    const {
      page = 1,
      limit = 20,
      type,
      severity,
      isResolved,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.AlertWhereInput = {
      ...(type && { type: type as any }),
      ...(severity && { severity: severity as any }),
      ...(isResolved !== undefined && { isResolved }),
    };

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.alert.count({ where }),
    ]);

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAlertById(id: string) {
    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    return alert;
  }

  async getAlertStatistics() {
    const [
      totalAlerts,
      unresolvedAlerts,
      criticalAlerts,
      alertsByType,
      alertsBySeverity,
      recentAlerts,
    ] = await Promise.all([
      prisma.alert.count(),
      prisma.alert.count({ where: { isResolved: false } }),
      prisma.alert.count({
        where: { isResolved: false, severity: 'CRITICAL' },
      }),
      prisma.alert.groupBy({
        by: ['type'],
        _count: { id: true },
        where: { isResolved: false },
      }),
      prisma.alert.groupBy({
        by: ['severity'],
        _count: { id: true },
        where: { isResolved: false },
      }),
      prisma.alert.findMany({
        where: { isResolved: false },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      total: totalAlerts,
      unresolved: unresolvedAlerts,
      critical: criticalAlerts,
      byType: alertsByType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: alertsBySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      recent: recentAlerts,
    };
  }

  async resolveAlert(id: string) {
    const alert = await prisma.alert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });

    logger.info({ alertId: id }, 'Alert resolved');

    // Emit alert resolved event for real-time updates
    appEvents.emitAlertResolved({
      id: alert.id,
      type: alert.type,
    });

    return alert;
  }

  async resolveAlertsByType(type: string, metadata?: any) {
    const where: Prisma.AlertWhereInput = {
      type: type as any,
      isResolved: false,
      ...(metadata && { metadata: { path: Object.keys(metadata), equals: metadata } }),
    };

    const result = await prisma.alert.updateMany({
      where,
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });

    logger.info({ type, count: result.count }, 'Alerts resolved by type');
    return result;
  }

  async deleteAlert(id: string) {
    await prisma.alert.delete({
      where: { id },
    });

    logger.info({ alertId: id }, 'Alert deleted');
  }

  async getAlertsByProduct(productId: string) {
    const alerts = await prisma.alert.findMany({
      where: {
        OR: [
          { metadata: { path: ['productId'], equals: productId } },
        ],
        isResolved: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts;
  }

  async getAlertsByWarehouse(warehouseId: string) {
    const alerts = await prisma.alert.findMany({
      where: {
        OR: [
          { metadata: { path: ['warehouseId'], equals: warehouseId } },
        ],
        isResolved: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts;
  }
}

export const alertService = new AlertService();
