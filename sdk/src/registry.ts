import { AgentCard, AgentStatus } from './types/agent.js';
import {
  RegistryConfig,
  AgentQuery,
  RegistrationResult,
  DiscoveryResult,
  HealthCheckResult,
} from './types/registry.js';
import { AgentNotFoundError, RegistryError } from './utils/errors.js';
import { Logger } from './utils/logger.js';
import { validateDID } from './utils/validation.js';

const logger = new Logger({ level: 'info', prefix: 'Registry' });

/**
 * Agent Registry - Manages agent discovery and registration
 */
export class AgentRegistry {
  private agents: Map<string, AgentCard> = new Map();
  private config: RegistryConfig;

  constructor(config: Partial<RegistryConfig> = {}) {
    this.config = {
      type: config.type || 'memory',
      url: config.url,
      contractAddress: config.contractAddress,
      rpcUrl: config.rpcUrl,
      chainId: config.chainId,
    };

    logger.info('Registry initialized', { type: this.config.type });
  }

  /**
   * Register a new agent
   */
  async registerAgent(card: AgentCard): Promise<RegistrationResult> {
    try {
      if (!validateDID(card.id)) {
        throw new RegistryError(`Invalid agent DID: ${card.id}`);
      }

      const now = Date.now();
      const agentCard: AgentCard = {
        ...card,
        status: AgentStatus.ONLINE,
        createdAt: card.createdAt || now,
        updatedAt: now,
      };

      this.agents.set(card.id, agentCard);

      logger.info(`Agent registered: ${card.id}`, { name: card.name });

      return {
        success: true,
        agentId: card.id,
        timestamp: now,
      };
    } catch (error) {
      logger.error('Failed to register agent', error);
      throw new RegistryError(
        `Failed to register agent: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update an existing agent
   */
  async updateAgent(id: string, updates: Partial<AgentCard>): Promise<void> {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new AgentNotFoundError(id);
    }

    const updatedAgent: AgentCard = {
      ...agent,
      ...updates,
      id: agent.id, // Prevent ID changes
      updatedAt: Date.now(),
    };

    this.agents.set(id, updatedAgent);
    logger.info(`Agent updated: ${id}`);
  }

  /**
   * Get agent by ID
   */
  async getAgent(id: string): Promise<AgentCard> {
    logger.debug(`Looking for agent: ${id}`);
    logger.debug(`Registry has ${this.agents.size} agents:`, 
      Array.from(this.agents.keys()));
    
    const agent = this.agents.get(id);
    if (!agent) {
      logger.error(`Agent not found: ${id}`);
      logger.error(`Available agents: ${Array.from(this.agents.keys()).join(', ') || 'NONE'}`);
      throw new AgentNotFoundError(id);
    }
    return agent;
  }

  /**
   * Find agents by query
   */
  async findAgents(query: AgentQuery): Promise<DiscoveryResult> {
    let results = Array.from(this.agents.values());

    // Filter by ID
    if (query.id) {
      results = results.filter((agent) => agent.id === query.id);
    }

    // Filter by name
    if (query.name) {
      results = results.filter((agent) =>
        agent.name.toLowerCase().includes(query.name!.toLowerCase())
      );
    }

    // Filter by capabilities
    if (query.capabilities && query.capabilities.length > 0) {
      results = results.filter((agent) =>
        query.capabilities!.some((cap) => agent.capabilities.includes(cap))
      );
    }

    // Filter by status
    if (query.status) {
      results = results.filter((agent) => agent.status === query.status);
    }

    // Filter by payment methods
    if (query.paymentMethods && query.paymentMethods.length > 0) {
      results = results.filter(
        (agent) =>
          agent.paymentMethods &&
          query.paymentMethods!.some((method) => agent.paymentMethods!.includes(method))
      );
    }

    logger.debug(`Found ${results.length} agents matching query`, query);

    return {
      agents: results,
      total: results.length,
      query,
    };
  }

  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capability: string): Promise<AgentCard[]> {
    const result = await this.findAgents({ capabilities: [capability] });
    return result.agents;
  }

  /**
   * Find agents by type (using name pattern)
   */
  async findAgentsByType(type: string): Promise<AgentCard[]> {
    const result = await this.findAgents({ name: type });
    return result.agents;
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(id: string): Promise<void> {
    if (!this.agents.has(id)) {
      throw new AgentNotFoundError(id);
    }

    this.agents.delete(id);
    logger.info(`Agent unregistered: ${id}`);
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(id: string, status: AgentStatus): Promise<void> {
    await this.updateAgent(id, { status });
  }

  /**
   * Perform health check on an agent
   */
  async healthCheck(id: string): Promise<HealthCheckResult> {
    const agent = await this.getAgent(id);
    const startTime = Date.now();

    try {
      // In a real implementation, this would ping the agent's endpoint
      // For now, we just check if it exists and is online
      const latency = Date.now() - startTime;

      return {
        agentId: id,
        status: agent.status,
        timestamp: Date.now(),
        latency,
      };
    } catch (error) {
      logger.error(`Health check failed for agent ${id}`, error);
      await this.updateAgentStatus(id, AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * List all registered agents
   */
  async listAgents(): Promise<AgentCard[]> {
    return Array.from(this.agents.values());
  }

  /**
   * Get total number of registered agents
   */
  async getAgentCount(): Promise<number> {
    return this.agents.size;
  }

  /**
   * Clear all agents (for testing)
   */
  async clear(): Promise<void> {
    this.agents.clear();
    logger.info('Registry cleared');
  }

  /**
   * Check if agent exists
   */
  async exists(id: string): Promise<boolean> {
    return this.agents.has(id);
  }
}
