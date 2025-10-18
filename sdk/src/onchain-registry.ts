import { ethers, Contract, Wallet, Provider } from 'ethers';
import { AgentCard, AgentStatus } from './types/agent.js';
import {
  RegistryConfig,
  AgentQuery,
  RegistrationResult,
  DiscoveryResult,
} from './types/registry.js';
import { AgentNotFoundError, RegistryError } from './utils/errors.js';
import { Logger } from './utils/logger.js';

const logger = new Logger({ level: 'info', prefix: 'OnChainRegistry' });

/**
 * Agent Registry Contract ABI (minimal interface)
 */
const AGENT_REGISTRY_ABI = [
  'function registerAgent(string id, string name, string description, string endpoint, string[] capabilities, string[] paymentMethods, string version) external',
  'function updateAgent(string id, string description, string endpoint, string[] capabilities, string[] paymentMethods) external',
  'function updateAgentStatus(string id, uint8 status) external',
  'function unregisterAgent(string id) external',
  'function getAgent(string id) external view returns (tuple(string id, string name, string description, string endpoint, string[] capabilities, string[] paymentMethods, uint8 status, string version, address owner, uint256 createdAt, uint256 updatedAt, bool exists))',
  'function getAgentsByCapability(string capability) external view returns (string[] memory)',
  'function getAgentsByOwner(address owner) external view returns (string[] memory)',
  'function getAllAgentIds() external view returns (string[] memory)',
  'function getAgentCount() external view returns (uint256)',
  'function agentExistsCheck(string id) external view returns (bool)',
  'function getAgentStatus(string id) external view returns (uint8)',
  'event AgentRegistered(string indexed id, string name, address indexed owner, uint256 timestamp)',
  'event AgentUpdated(string indexed id, uint8 status, uint256 timestamp)',
  'event AgentUnregistered(string indexed id, address indexed owner, uint256 timestamp)',
];

/**
 * On-chain Agent Registry using Somnia smart contract
 */
export class OnChainAgentRegistry {
  private contract: Contract;
  private provider: Provider;
  private wallet?: Wallet;

  constructor(config: RegistryConfig, wallet?: Wallet) {
    if (!config.contractAddress) {
      throw new RegistryError('Contract address is required for on-chain registry');
    }

    if (!config.rpcUrl) {
      throw new RegistryError('RPC URL is required for on-chain registry');
    }
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    if (wallet) {
      this.wallet = wallet.connect(this.provider);
      this.contract = new Contract(config.contractAddress, AGENT_REGISTRY_ABI, this.wallet);
    } else {
      this.contract = new Contract(config.contractAddress, AGENT_REGISTRY_ABI, this.provider);
    }

    logger.info('On-chain registry initialized', {
      contractAddress: config.contractAddress,
      chainId: config.chainId,
    });
  }

  /**
   * Register a new agent on-chain
   */
  async registerAgent(card: AgentCard): Promise<RegistrationResult> {
    if (!this.wallet) {
      throw new RegistryError('Wallet required for registration');
    }

    try {
      logger.info(`Registering agent on-chain: ${card.id}`);

      const tx = await this.contract.registerAgent(
        card.id,
        card.name,
        card.description,
        card.endpoint,
        card.capabilities,
        card.paymentMethods || [],
        card.version || '1.0.0'
      );

      const receipt = await tx.wait();
      logger.info(`Agent registered on-chain: ${card.id}`, {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return {
        success: true,
        agentId: card.id,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Failed to register agent on-chain', error);
      throw new RegistryError(
        `On-chain registration failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update an existing agent on-chain
   */
  async updateAgent(id: string, updates: Partial<AgentCard>): Promise<void> {
    if (!this.wallet) {
      throw new RegistryError('Wallet required for updates');
    }

    try {
      const agent = await this.getAgent(id);

      const tx = await this.contract.updateAgent(
        id,
        updates.description || agent.description,
        updates.endpoint || agent.endpoint,
        updates.capabilities || agent.capabilities,
        updates.paymentMethods || agent.paymentMethods || []
      );

      await tx.wait();
      logger.info(`Agent updated on-chain: ${id}`);
    } catch (error) {
      logger.error('Failed to update agent on-chain', error);
      throw error;
    }
  }

  /**
   * Update agent status on-chain
   */
  async updateAgentStatus(id: string, status: AgentStatus): Promise<void> {
    if (!this.wallet) {
      throw new RegistryError('Wallet required for status updates');
    }

    try {
      const statusCode = this.mapStatusToContract(status);
      const tx = await this.contract.updateAgentStatus(id, statusCode);
      await tx.wait();
      logger.info(`Agent status updated on-chain: ${id} -> ${status}`);
    } catch (error) {
      logger.error('Failed to update agent status on-chain', error);
      throw error;
    }
  }

  /**
   * Get agent by ID from on-chain registry
   */
  async getAgent(id: string): Promise<AgentCard> {
    try {
      const result = await this.contract.getAgent(id);

      if (!result.exists) {
        throw new AgentNotFoundError(id);
      }

      return this.mapContractToAgentCard(result);
    } catch (error) {
      if (error instanceof AgentNotFoundError) {
        throw error;
      }
      logger.error('Failed to get agent from on-chain registry', error);
      throw new RegistryError(`Failed to get agent: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find agents by query
   */
  async findAgents(query: AgentQuery): Promise<DiscoveryResult> {
    try {
      let agentIds: string[] = [];

      if (query.capabilities && query.capabilities.length > 0) {
        // Get agents by first capability
        agentIds = await this.contract.getAgentsByCapability(query.capabilities[0]);
      } else {
        // Get all agents
        agentIds = await this.contract.getAllAgentIds();
      }

      // Fetch full agent cards
      const agents: AgentCard[] = [];
      for (const id of agentIds) {
        try {
          const agent = await this.getAgent(id);

          // Apply filters
          if (query.name && !agent.name.toLowerCase().includes(query.name.toLowerCase())) {
            continue;
          }

          if (query.status && agent.status !== query.status) {
            continue;
          }

          if (
            query.capabilities &&
            query.capabilities.length > 0 &&
            !query.capabilities.some((cap) => agent.capabilities.includes(cap))
          ) {
            continue;
          }

          agents.push(agent);
        } catch (error) {
          logger.warn(`Failed to fetch agent ${id}`, error);
        }
      }

      return {
        agents,
        total: agents.length,
        query,
      };
    } catch (error) {
      logger.error('Failed to find agents on-chain', error);
      throw new RegistryError(`Failed to find agents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capability: string): Promise<AgentCard[]> {
    const result = await this.findAgents({ capabilities: [capability] });
    return result.agents;
  }

  /**
   * Unregister an agent from on-chain registry
   */
  async unregisterAgent(id: string): Promise<void> {
    if (!this.wallet) {
      throw new RegistryError('Wallet required for unregistration');
    }

    try {
      const tx = await this.contract.unregisterAgent(id);
      await tx.wait();
      logger.info(`Agent unregistered from on-chain: ${id}`);
    } catch (error) {
      logger.error('Failed to unregister agent on-chain', error);
      throw error;
    }
  }

  /**
   * List all registered agents
   */
  async listAgents(): Promise<AgentCard[]> {
    const result = await this.findAgents({});
    return result.agents;
  }

  /**
   * Get total number of registered agents
   */
  async getAgentCount(): Promise<number> {
    try {
      const count = await this.contract.getAgentCount();
      return Number(count);
    } catch (error) {
      logger.error('Failed to get agent count', error);
      throw error;
    }
  }

  /**
   * Check if agent exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      return await this.contract.agentExistsCheck(id);
    } catch (error) {
      logger.error('Failed to check agent existence', error);
      return false;
    }
  }

  /**
   * Listen to registry events
   */
  onAgentRegistered(callback: (id: string, name: string, owner: string) => void): void {
    this.contract.on('AgentRegistered', (id, name, owner) => {
      logger.debug('Agent registered event', { id, name, owner });
      callback(id, name, owner);
    });
  }

  onAgentUpdated(callback: (id: string, status: number) => void): void {
    this.contract.on('AgentUpdated', (id, status) => {
      logger.debug('Agent updated event', { id, status });
      callback(id, status);
    });
  }

  onAgentUnregistered(callback: (id: string, owner: string) => void): void {
    this.contract.on('AgentUnregistered', (id, owner) => {
      logger.debug('Agent unregistered event', { id, owner });
      callback(id, owner);
    });
  }

  // Helper methods

  private mapContractToAgentCard(result: any): AgentCard {
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      endpoint: result.endpoint,
      capabilities: result.capabilities,
      paymentMethods: result.paymentMethods,
      status: this.mapContractToStatus(result.status),
      version: result.version,
      auth: { type: 'none' },
      createdAt: Number(result.createdAt) * 1000,
      updatedAt: Number(result.updatedAt) * 1000,
    };
  }

  private mapContractToStatus(statusCode: number): AgentStatus {
    const statusMap: Record<number, AgentStatus> = {
      0: AgentStatus.OFFLINE,
      1: AgentStatus.ONLINE,
      2: AgentStatus.BUSY,
      3: AgentStatus.ERROR,
    };
    return statusMap[statusCode] || AgentStatus.OFFLINE;
  }

  private mapStatusToContract(status: AgentStatus): number {
    const statusMap: Record<AgentStatus, number> = {
      [AgentStatus.OFFLINE]: 0,
      [AgentStatus.ONLINE]: 1,
      [AgentStatus.BUSY]: 2,
      [AgentStatus.ERROR]: 3,
    };
    return statusMap[status];
  }
}
