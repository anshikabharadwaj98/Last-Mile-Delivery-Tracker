const orderRepository = require('../repositories/orderRepository');
const identityRepository = require('../repositories/identityRepository');
const orderStateMachine = require('../domain/order/OrderStateMachine');
const pricingService = require('./pricingService');
const assignmentService = require('./assignmentService');
const trackingService = require('./trackingService');
const notificationService = require('./notificationService');

class OrderService {
  async createOrder({
    customer_id,
    pickup_address,
    pickup_pincode,
    pickup_postal_code,
    drop_address,
    drop_pincode,
    drop_postal_code,
    length,
    length_cm,
    breadth,
    width_cm,
    height,
    height_cm,
    actual_weight,
    actual_weight_kg,
    order_type,
    payment_type
  }, actor) {
    let targetCustomerId = actor.id;
    if (actor.role === 'admin' && customer_id) {
      targetCustomerId = String(customer_id);
    }

    const customerUser = await identityRepository.findById(targetCustomerId);
    if (!customerUser) {
      throw new Error('Customer with ID ' + targetCustomerId + ' not found.');
    }

    let finalOrderType = order_type;
    if (actor.role !== 'admin' || customerUser.role === 'customer') {
      finalOrderType = customerUser.customer_type || 'B2C';
    }

    const targetPickupPincode = (pickup_pincode || pickup_postal_code || '').trim();
    const targetDropPincode = (drop_pincode || drop_postal_code || '').trim();
    const targetLength = parseFloat(length || length_cm || 0);
    const targetBreadth = parseFloat(breadth || width_cm || 0);
    const targetHeight = parseFloat(height || height_cm || 0);
    const targetActualWeight = parseFloat(actual_weight || actual_weight_kg || 0);

    const pricing = await pricingService.calculateCharges({
      pickup_pincode: targetPickupPincode,
      drop_pincode: targetDropPincode,
      length: targetLength,
      breadth: targetBreadth,
      height: targetHeight,
      actual_weight: targetActualWeight,
      order_type: finalOrderType,
      payment_type
    });

    const order = await orderRepository.create({
      customer_id: targetCustomerId,
      creator_id: actor.id,
      pickup_address,
      drop_address,
      pickup_pincode: targetPickupPincode,
      drop_pincode: targetDropPincode,
      pickup_zone_id: pricing.pickup_zone_id,
      drop_zone_id: pricing.drop_zone_id,
      rate_type: pricing.rate_type,
      length: targetLength,
      breadth: targetBreadth,
      height: targetHeight,
      raw_actual_weight: targetActualWeight,
      raw_volumetric_weight: pricing.raw_volumetric_weight,
      ceil_actual_weight: pricing.ceil_actual_weight,
      ceil_volumetric_weight: pricing.ceil_volumetric_weight,
      final_billable_weight: pricing.final_billable_weight,
      calculated_distance: pricing.calculated_distance || null,
      order_type: finalOrderType,
      payment_type,
      cod_surcharge: pricing.cod_surcharge,
      delivery_charge: pricing.delivery_charge,
      final_calculated_charge: pricing.total_charge,
      current_status: 'Pending'
    });

    await trackingService.logEvent(
      order.id,
      'Pending',
      actor.id,
      'Order placed by ' + actor.name + '. Total cost: $' + pricing.total_charge.toFixed(2)
    );

    let assignedAgent = null;
    try {
      assignedAgent = await assignmentService.autoAssignAgent(order.id);
      if (assignedAgent) {
        await trackingService.logEvent(
          order.id,
          'Assigned',
          actor.id,
          'Auto-assigned to nearest available delivery agent: ' + assignedAgent.name + ' (ID: ' + assignedAgent.id + ')'
        );
        await order.reload();
      }
    } catch (assignErr) {
      console.error('Auto-assignment during creation skipped:', assignErr.message);
    }

    const customer = await identityRepository.findById(targetCustomerId);
    const orderNotificationObj = {
      ...order.get({ plain: true }),
      status: order.current_status
    };
    notificationService.notifyOrderStatusChange(orderNotificationObj, customer, actor.name)
      .catch(err => console.error('Notification workflow failed:', err));

    return {
      order,
      assigned_agent: assignedAgent ? { id: assignedAgent.id, name: assignedAgent.name } : null
    };
  }

  async getOrdersList(user, filters = {}) {
    const where = {};

    if (user.role === 'customer') {
      where.customer_id = user.id;
    } else if (user.role === 'delivery_agent') {
      where.assigned_agent_id = user.id;
    } else if (user.role === 'admin') {
      if (filters.status) where.current_status = filters.status;
      if (filters.agent_id) where.assigned_agent_id = filters.agent_id;
      if (filters.zone_id) where.pickup_zone_id = filters.zone_id;
    }

    return await orderRepository.findAll({ where });
  }

  async getOrderDetails(orderId, user) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    if (user.role === 'customer' && order.customer_id !== user.id) {
      throw new Error('Access denied to view this shipment.');
    }
    if (user.role === 'delivery_agent' && order.assigned_agent_id !== user.id) {
      throw new Error('Access denied. This shipment is not assigned to you.');
    }

    const timeline = await trackingService.getFormattedTimeline(order.id);
    return { order, timeline };
  }

  async updateOrderStatus(orderId, nextStatus, failedReason, actor) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    if (actor.role === 'delivery_agent' && order.assigned_agent_id !== actor.id) {
      throw new Error('Access denied. You are not assigned to this order.');
    }

    orderStateMachine.validateTransition(order.current_status, nextStatus);

    order.current_status = nextStatus;
    let eventNote = 'Status updated to "' + nextStatus + '" by ' + actor.name + '.';

    if (nextStatus === 'Failed') {
      if (!failedReason) {
        throw new Error('A failed reason is required when marking order as Failed.');
      }
      order.failed_reason = failedReason;
      order.assigned_agent_id = null;
      eventNote = 'Delivery failed: "' + failedReason + '".';
    } else {
      order.failed_reason = null;
    }

    await orderRepository.save(order);
    await trackingService.logEvent(order.id, nextStatus, actor.id, eventNote);

    const customer = await identityRepository.findById(order.customer_id);
    const orderNotificationObj = {
      ...order.get({ plain: true }),
      status: order.current_status
    };
    notificationService.notifyOrderStatusChange(orderNotificationObj, customer, actor.name)
      .catch(err => console.error('Notification status update failed:', err));

    return order;
  }

  async rescheduleOrder(orderId, rescheduledDate, customerActor) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.customer_id !== customerActor.id) {
      throw new Error('Access denied. You do not own this order.');
    }
    if (order.current_status !== 'Failed') {
      throw new Error('Only shipments in Failed state can be rescheduled.');
    }

    order.current_status = 'Pending';
    order.failed_reason = null;
    order.assigned_agent_id = null;
    order.rescheduled_date = new Date(rescheduledDate);
    await orderRepository.save(order);

    await trackingService.logEvent(
      order.id,
      'Pending',
      customerActor.id,
      'Rescheduled by customer for date: ' + new Date(rescheduledDate).toLocaleDateString() + '.'
    );

    let newAgent = null;
    try {
      newAgent = await assignmentService.autoAssignAgent(order.id);
      if (newAgent) {
        await trackingService.logEvent(
          order.id,
          'Assigned',
          customerActor.id,
          'Auto-reassigned to delivery agent: ' + newAgent.name + ' (ID: ' + newAgent.id + ') for the rescheduled attempt.'
        );
        await order.reload();
      }
    } catch (assignErr) {
      console.error('Failed auto-reassignment on reschedule:', assignErr.message);
    }

    const customer = await identityRepository.findById(order.customer_id);
    const orderNotificationObj = {
      ...order.get({ plain: true }),
      status: order.current_status
    };
    notificationService.notifyOrderStatusChange(orderNotificationObj, customer, customerActor.name)
      .catch(err => console.error('Notification rescheduling failed:', err));

    return {
      order,
      assigned_agent: newAgent ? { id: newAgent.id, name: newAgent.name } : null
    };
  }

  async assignAgent(orderId, agentId, auto, adminActor) {
    let assignedAgent = null;

    if (auto === true || auto === 'true') {
      assignedAgent = await assignmentService.autoAssignAgent(orderId);
      if (!assignedAgent) {
        throw new Error('Auto-assignment failed. No active agents found.');
      }
    } else {
      if (!agentId) {
        throw new Error('Agent ID is required for manual assignment.');
      }
      assignedAgent = await assignmentService.manualAssignAgent(orderId, agentId);
    }

    await trackingService.logEvent(
      orderId,
      'Assigned',
      adminActor.id,
      'Agent assigned: ' + assignedAgent.name + ' (ID: ' + assignedAgent.id + ') by administrator ' + adminActor.name + '.'
    );

    const order = await orderRepository.findById(orderId);
    const customer = await identityRepository.findById(order.customer_id);
    const orderNotificationObj = {
      ...order.get({ plain: true }),
      status: order.current_status
    };
    notificationService.notifyOrderStatusChange(orderNotificationObj, customer, adminActor.name)
      .catch(err => console.error('Notification manual assignment failed:', err));

    return {
      order,
      agent: { id: assignedAgent.id, name: assignedAgent.name }
    };
  }
}

module.exports = new OrderService();
