import { v4 as uuidv4 } from 'uuid';
import {
  A2AMessage,
  A2AMessageSchema,
  A2AResponse,
  CreateMessageParams,
  MessageType,
  MessagePriority,
} from './types/message.js';
import { validate, validateDID } from './utils/validation.js';
import { MessageValidationError } from './utils/errors.js';
import { Logger } from './utils/logger.js';

const logger = new Logger({ level: 'info', prefix: 'A2A' });

/**
 * A2A Protocol implementation
 * Handles message creation, validation, and formatting
 */
export class A2AProtocol {
  private senderId: string;

  constructor(senderId: string) {
    if (!validateDID(senderId)) {
      throw new MessageValidationError(`Invalid sender DID: ${senderId}`);
    }
    this.senderId = senderId;
  }

  /**
   * Create a new A2A message
   */
  createMessage(params: CreateMessageParams): A2AMessage {
    if (!validateDID(params.recipient)) {
      throw new MessageValidationError(`Invalid recipient DID: ${params.recipient}`);
    }

    const priority: MessagePriority = params.priority ?? MessagePriority.MEDIUM;
    
    const message = {
      id: uuidv4(),
      timestamp: Date.now(),
      sender: this.senderId,
      recipient: params.recipient,
      intent: params.intent,
      task: params.task,
      type: MessageType.REQUEST,
      priority,
      ...(params.context && { context: params.context }),
      ...(params.ttl && { ttl: params.ttl }),
      ...(params.correlationId && { correlationId: params.correlationId }),
      ...(params.metadata && { metadata: params.metadata }),
    };

    return this.validateMessage(message);
  }

  /**
   * Create a response message
   */
  createResponse(
    originalMessage: A2AMessage,
    data: unknown,
    success = true
  ): A2AMessage {
    const response = {
      id: uuidv4(),
      timestamp: Date.now(),
      sender: this.senderId,
      recipient: originalMessage.sender,
      intent: `${originalMessage.intent}_response`,
      task: { data, success },
      type: MessageType.RESPONSE,
      priority: originalMessage.priority,
      correlationId: originalMessage.id,
      ...(originalMessage.context && { context: originalMessage.context }),
    };

    return this.validateMessage(response as A2AMessage);
  }

  /**
   * Create an error response message
   */
  createErrorResponse(
    originalMessage: A2AMessage,
    error: string,
    code: string
  ): A2AMessage {
    const response = {
      id: uuidv4(),
      timestamp: Date.now(),
      sender: this.senderId,
      recipient: originalMessage.sender,
      intent: `${originalMessage.intent}_error`,
      task: { error, code, success: false },
      type: MessageType.ERROR,
      priority: originalMessage.priority,
      correlationId: originalMessage.id,
      ...(originalMessage.context && { context: originalMessage.context }),
    };

    return this.validateMessage(response as A2AMessage);
  }

  /**
   * Validate a message against the schema
   */
  validateMessage(message: unknown): A2AMessage {
    try {
      return validate(A2AMessageSchema, message) as A2AMessage;
    } catch (error) {
      logger.error('Message validation failed', error);
      throw error;
    }
  }

  /**
   * Check if message is expired based on TTL
   */
  isMessageExpired(message: A2AMessage): boolean {
    if (!message.ttl) return false;
    const now = Date.now();
    const expiryTime = message.timestamp + message.ttl * 1000;
    return now > expiryTime;
  }

  /**
   * Serialize message to JSON
   */
  serializeMessage(message: A2AMessage): string {
    return JSON.stringify(message);
  }

  /**
   * Deserialize message from JSON
   */
  deserializeMessage(json: string): A2AMessage {
    try {
      const data = JSON.parse(json);
      return this.validateMessage(data);
    } catch (error) {
      logger.error('Failed to deserialize message', error);
      throw new MessageValidationError('Invalid message JSON');
    }
  }

  /**
   * Create a standard A2A response object
   */
  static createA2AResponse(
    messageId: string,
    success: boolean,
    data?: unknown,
    error?: { code: string; message: string; details?: unknown }
  ): A2AResponse {
    return {
      messageId,
      status: success ? 200 : error?.code === 'PAYMENT_REQUIRED' ? 402 : 500,
      success,
      data,
      error,
      timestamp: Date.now(),
    };
  }

  /**
   * Create a payment required response
   */
  static createPaymentRequiredResponse(
    messageId: string,
    paymentRequirements: unknown
  ): A2AResponse {
    return {
      messageId,
      status: 402,
      success: false,
      paymentRequired: true,
      paymentRequirements: paymentRequirements as any,
      error: {
        code: 'PAYMENT_REQUIRED',
        message: 'Payment is required to access this resource',
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Extract correlation ID from message for tracking
   */
  getCorrelationId(message: A2AMessage): string {
    return message.correlationId || message.id;
  }

  /**
   * Check if message requires response
   */
  requiresResponse(message: A2AMessage): boolean {
    return message.type === MessageType.REQUEST;
  }
}
