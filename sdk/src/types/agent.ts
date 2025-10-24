import { z } from 'zod';

/**
 * Authentication configuration for agents
 */
export const AuthConfigSchema = z.object({
  type: z.enum(['none', 'bearer', 'oauth', 'jwt']),
  token: z.string().optional(),
  credentials: z.record(z.string()).optional(),
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;

/**
 * Agent status enum
 */
export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  ERROR = 'error',
}

/**
 * AgentCard - Core identity and capability descriptor for agents
 */
export const AgentCardSchema = z.object({
  id: z.string().describe('DID format: did:somnia:agent-name'),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  endpoint: z.string().url().describe('HTTP endpoint for A2A communication'),
  capabilities: z.array(z.string()).min(1),
  auth: AuthConfigSchema,
  paymentMethods: z.array(z.string()).optional(),
  status: z.nativeEnum(AgentStatus),
  metadata: z.record(z.unknown()).optional(),
  version: z.string().default('1.0.0'),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export type AgentCard = z.infer<typeof AgentCardSchema>;

/**
 * Agent configuration for initialization
 */
export interface AgentConfig {
  agentCard: Omit<AgentCard, 'status' | 'createdAt' | 'updatedAt'>;
  registryUrl?: string;
  registry?: any; // Optional shared registry instance
  port?: number;
  enablePayments?: boolean;
  walletPrivateKey?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  retryConfig?: RetryConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Agent event types
 */
export enum AgentEvent {
  INITIALIZED = 'initialized',
  REGISTERED = 'registered',
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_SENT = 'message:sent',
  PAYMENT_REQUIRED = 'payment:required',
  PAYMENT_COMPLETED = 'payment:completed',
  ERROR = 'error',
  SHUTDOWN = 'shutdown',
}

/**
 * Intent handler function type
 */
export type IntentHandler = (
  task: Record<string, unknown>,
  context: MessageContext
) => Promise<IntentResponse>;

/**
 * Message context passed to intent handlers
 */
export interface MessageContext {
  messageId: string;
  sender: string;
  recipient: string;
  timestamp: number;
  correlationId?: string;
}

/**
 * Intent response from handlers
 */
export interface IntentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  requiresPayment?: boolean;
  paymentRequirements?: PaymentRequirements;
}

/**
 * Payment requirements for X402
 */
export interface PaymentRequirements {
  scheme: 'exact' | 'range' | 'subscription';
  network: string;
  asset: string;
  payTo: string;
  maxAmountRequired: string;
  minAmountRequired?: string;
  resource: string;
  description: string;
  mimeType?: string;
  maxTimeoutSeconds?: number;
}
