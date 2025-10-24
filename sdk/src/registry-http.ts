import axios from 'axios';
import { AgentCard } from './types/agent.js';
import {
  RegistrationResult,
  DiscoveryResult,
  AgentQuery,
} from './types/registry.js';
import { AgentNotFoundError, RegistryError } from './utils/errors.js';
import { Logger } from './utils/logger.js';

const logger = new Logger({ level: 'info', prefix: 'HTTPRegistry' });

/**
 * HTTP Registry Client
 * Communicates with a remote HTTP registry server
 */
export class HTTPRegistryClient {
  private baseUrl: string;
  private timeout: number = 5000;

  constructor(registryUrl: string) {
    this.baseUrl = registryUrl.replace(/\/$/, ''); // Remove trailing slash
    logger.info(`HTTP Registry client initialized: ${this.baseUrl}`);
  }

  /**
   * Register an agent with the registry server
   */
  async registerAgent(card: AgentCard): Promise<RegistrationResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/registry/agents`,
        card,
        { timeout: this.timeout }
      );
      logger.info(`Agent registered: ${card.id}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to register agent', error);
      throw new RegistryError(
        `Failed to register agent: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get agent by ID from registry server
   */
  async getAgent(id: string): Promise<AgentCard> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/registry/agents/${encodeURIComponent(id)}`,
        { timeout: this.timeout }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new AgentNotFoundError(id);
      }
      logger.error(`Failed to get agent: ${id}`, error);
      throw new RegistryError(
        `Failed to get agent: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List all agents from registry server
   */
  async listAgents(): Promise<AgentCard[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/registry/agents`,
        { timeout: this.timeout }
      );
      return response.data.agents || [];
    } catch (error) {
      logger.error('Failed to list agents', error);
      throw new RegistryError(
        `Failed to list agents: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update agent in registry server
   */
  async updateAgent(id: string, updates: Partial<AgentCard>): Promise<void> {
    try {
      await axios.put(
        `${this.baseUrl}/registry/agents/${encodeURIComponent(id)}`,
        updates,
        { timeout: this.timeout }
      );
      logger.info(`Agent updated: ${id}`);
    } catch (error) {
      logger.error(`Failed to update agent: ${id}`, error);
      throw new RegistryError(
        `Failed to update agent: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Unregister agent from registry server
   */
  async unregisterAgent(id: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/registry/agents/${encodeURIComponent(id)}`,
        { timeout: this.timeout }
      );
      logger.info(`Agent unregistered: ${id}`);
    } catch (error) {
      logger.error(`Failed to unregister agent: ${id}`, error);
      throw new RegistryError(
        `Failed to unregister agent: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check registry server health
   */
  async healthCheck(): Promise<{ healthy: boolean; timestamp: number; error?: string }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/health`,
        { timeout: this.timeout }
      );
      return {
        healthy: response.data.status === 'healthy',
        timestamp: response.data.timestamp,
      };
    } catch (error) {
      return {
        healthy: false,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Find agents by query (if registry server supports it)
   */
  async findAgents(query: AgentQuery): Promise<DiscoveryResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/registry/search`,
        query,
        { timeout: this.timeout }
      );
      return response.data;
    } catch (error) {
      // Fallback to listing all and filtering locally
      const all = await this.listAgents();
      let results = all;

      if (query.capabilities && query.capabilities.length > 0) {
        results = results.filter(agent =>
          query.capabilities!.some(cap => agent.capabilities.includes(cap))
        );
      }

      if (query.status) {
        results = results.filter(agent => agent.status === query.status);
      }

      return {
        agents: results,
        total: results.length,
        query,
      };
    }
  }

  /**
   * Set request timeout
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }
}
