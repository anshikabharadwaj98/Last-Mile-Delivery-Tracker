const orderRepository = require('../repositories/orderRepository');
const agentRepository = require('../repositories/agentRepository');
const assignmentStrategy = require('../domain/assignment/AssignmentStrategy');
const zoneRepository = require('../repositories/zoneRepository');

class AssignmentService {
  async autoAssignAgent(orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }
    if (['Delivered', 'Failed'].includes(order.current_status)) {
      throw new Error('This order cannot be assigned in its current status.');
    }

    const agentsList = await agentRepository.findAllAgents();
    const assignableAgents = agentsList.filter(agent => agent.is_active && agent.is_available && agent.current_zone_id);
    const workloadsMap = {};
    for (const agent of assignableAgents) {
      workloadsMap[agent.id] = await orderRepository.countActiveJobsForAgent(agent.id);
    }

    const pickupArea = await zoneRepository.findAreaByPincode(order.pickup_pincode);
    const candidates = assignmentStrategy.rankAgentsForOrder(
      assignableAgents,
      {
        pickupLat: pickupArea ? pickupArea.latitude : null,
        pickupLon: pickupArea ? pickupArea.longitude : null,
        pickupZoneId: order.pickup_zone_id
      },
      workloadsMap
    );

    if (candidates.length === 0) {
      return null;
    }

    const selectedAgent = candidates[0].agent;
    order.assigned_agent_id = selectedAgent.id;
    order.current_status = 'Assigned';
    await orderRepository.save(order);

    return selectedAgent;
  }

  async manualAssignAgent(orderId, agentId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    const agent = await agentRepository.findAgentById(agentId);
    if (!agent) {
      throw new Error('Agent not found.');
    }
    if (!agent.is_active) {
      throw new Error('This delivery agent account is inactive.');
    }
    if (!agent.deliveryAgent || !agent.deliveryAgent.is_available || !agent.deliveryAgent.current_zone_id) {
      throw new Error('This delivery agent is currently offline or unavailable for assignments.');
    }

    order.assigned_agent_id = agent.id;
    order.current_status = 'Assigned';
    await orderRepository.save(order);

    return agent;
  }

  async getAllAgents() {
    return await agentRepository.findAllAgents();
  }

  async getAllCustomers() {
    return await agentRepository.findAllCustomers();
  }
}

module.exports = new AssignmentService();
