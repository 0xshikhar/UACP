import { AgentCard } from './agent.js';

/**
 * Registry configuration
 */
export interface RegistryConfig {
  type: 'memory' | 'redis' | 'onchain';
  url?: string;
  contractAddress?: string;
  rpcUrl?: string;
  chainId?: number;
}

/**
 * Agent query parameters
 */
export interface AgentQuery {
  id?: string;
  name?: string;
  capabilities?: string[];
  status?: string;
  paymentMethods?: string[];
}

/**
 * Registry response
 */
export interface RegistryResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Agent registration result
 */
export interface RegistrationResult {
  success: boolean;
  agentId: string;
  timestamp: number;
  error?: string;
}

/**
 * Agent discovery result
 */
export interface DiscoveryResult {
  agents: AgentCard[];
  total: number;
  query: AgentQuery;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  agentId: string;
  status: string;
  timestamp: number;
  latency?: number;
}
