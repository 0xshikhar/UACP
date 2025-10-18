import { z } from 'zod';

/**
 * Message type enum
 */
export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  EVENT = 'event',
  ERROR = 'error',
}

/**
 * Message priority enum
 */
export enum MessagePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * A2A Message Schema - Core communication format
 */
export const A2AMessageSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number(),
  sender: z.string().describe('DID of sender agent'),
  recipient: z.string().describe('DID of recipient agent'),
  intent: z.string().min(1),
  task: z.record(z.unknown()),
  context: z.string().optional().describe('Workflow or conversation context'),
  type: z.nativeEnum(MessageType),
  priority: z.nativeEnum(MessagePriority),
  ttl: z.number().optional().describe('Time to live in seconds'),
  signature: z.string().optional(),
  correlationId: z.string().optional().describe('For request-response correlation'),
  metadata: z.record(z.unknown()).optional(),
});

export type A2AMessage = z.infer<typeof A2AMessageSchema>;

/**
 * Message response structure
 */
export const A2AResponseSchema = z.object({
  messageId: z.string().uuid(),
  correlationId: z.string().optional(),
  status: z.number(),
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    })
    .optional(),
  paymentRequired: z.boolean().optional(),
  paymentRequirements: z
    .object({
      scheme: z.string(),
      network: z.string(),
      asset: z.string(),
      payTo: z.string(),
      maxAmountRequired: z.string(),
      minAmountRequired: z.string().optional(),
      resource: z.string(),
      description: z.string(),
      mimeType: z.string().optional(),
      maxTimeoutSeconds: z.number().optional(),
    })
    .optional(),
  timestamp: z.number(),
});

export type A2AResponse = z.infer<typeof A2AResponseSchema>;

/**
 * Message creation parameters
 */
export interface CreateMessageParams {
  recipient: string;
  intent: string;
  task: Record<string, unknown>;
  context?: string;
  priority?: MessagePriority;
  ttl?: number;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Message send options
 */
export interface SendMessageOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  payment?: PaymentPayload;
}

/**
 * Payment payload for X402
 */
export interface PaymentPayload {
  transactionHash: string;
  amount: string;
  asset: string;
  from: string;
  to: string;
  network: string;
  timestamp: number;
  signature: string;
}

/**
 * Message validation result
 */
export interface MessageValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Message filter for querying
 */
export interface MessageFilter {
  sender?: string;
  recipient?: string;
  intent?: string;
  type?: MessageType;
  priority?: MessagePriority;
  fromTimestamp?: number;
  toTimestamp?: number;
}
