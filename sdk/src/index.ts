/**
 * UACP SDK - Universal Agent Communication Protocol for Somnia
 * @module @uacp/somnia-sdk
 */

// Core exports
export { UACPAgent } from './agent.js';
export { A2AProtocol } from './a2a.js';
export { AgentRegistry } from './registry.js';
export { MessageRouter } from './router.js';
export { OnChainAgentRegistry } from './onchain-registry.js';

// Payment exports
export {
  UACPPaymentServer,
  UACPPaymentClient,
  createUACPPaymentRequirements,
  isPaymentRequiredError,
} from './x402.js';

export type {
  X402Config,
  UACPPaymentRequirements,
} from './x402.js';

// Type exports
export * from './types/index.js';

// Utility exports
export * from './utils/index.js';

// Re-export commonly used types for convenience
export type {
  AgentConfig,
  AgentCard,
  IntentHandler,
  IntentResponse,
} from './types/agent.js';

export type {
  A2AMessage,
  A2AResponse,
  CreateMessageParams,
  SendMessageOptions,
} from './types/message.js';

export type {
  RegistryConfig,
  AgentQuery,
  DiscoveryResult,
} from './types/registry.js';
