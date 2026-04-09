import { ExpressHandler } from '../../shared/types/express.type';
import * as ordersService from './orders.service';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { UserType } from '../auth/types/auth.types';

export const createOrder: ExpressHandler = async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (user?.role !== UserType.USER) {
      res.status(403).json({ message: 'Only users can create orders' });
      return;
    }

    const order = await ordersService.createOrder(user.id, req.body);
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    const err = error as Error;
    console.error('Error creating order:', err);
    res.status(400).json({ message: err.message || 'Failed to create order' });
  }
};

export const getMyOrders: ExpressHandler = async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { page, limit } = req.query;

    const pagination = page && limit ? { page: Number(page), limit: Number(limit) } : undefined;

    if (user?.role === UserType.USER) {
      const { orders, total } = await ordersService.getUserOrders(user.id, pagination);
      if (pagination) {
        res.status(200).json({
          orders,
          meta: {
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit),
          },
        });
      } else {
        res.status(200).json({ orders });
      }
    } else if (user?.role === UserType.ESTABLISHMENT) {
      const { orders, total } = await ordersService.getEstablishmentOrders(user.id, pagination);
      if (pagination) {
        res.status(200).json({
          orders,
          meta: {
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit),
          },
        });
      } else {
        res.status(200).json({ orders });
      }
    } else {
      res.status(403).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOrder: ExpressHandler = async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const order = await ordersService.getOrderById({
      orderId: id!,
      userOrEstablishmentId: user.id,
      role: user.role,
    });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.status(200).json({ order });
  } catch (error) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      res.status(403).json({ message: 'Forbidden' });
    } else {
      console.error('Error getting order:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateStatus: ExpressHandler = async (req, res) => {
  try {
    const establishment = (req as AuthenticatedRequest).establishment!;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ message: 'Status is required' });
      return;
    }

    const order = await ordersService.updateOrderStatus({
      orderId: id!,
      status,
      establishmentId: establishment.id,
    });
    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    const err = error as Error;
    console.error('Error updating order status:', err);
    res.status(400).json({ message: err.message || 'Failed to update status' });
  }
};

export const cancelOrder: ExpressHandler = async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { id } = req.params;

    if (user?.role !== UserType.USER) {
      res.status(403).json({ message: 'Only users can cancel their orders' });
      return;
    }

    const order = await ordersService.cancelOrder(id!, user.id);
    res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    const err = error as Error;
    console.error('Error cancelling order:', err);
    res.status(400).json({ message: err.message || 'Failed to cancel order' });
  }
};
