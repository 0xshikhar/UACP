/**
 * Base error class for UACP SDK
 */
export class UACPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'UACPError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Agent not found error
 */
export class AgentNotFoundError extends UACPError {
  constructor(agentId: string) {
    super(`Agent not found: ${agentId}`, 'AGENT_NOT_FOUND', { agentId });
    this.name = 'AgentNotFoundError';
  }
}

/**
 * Message validation error
 */
export class MessageValidationError extends UACPError {
  constructor(message: string, errors?: string[]) {
    super(message, 'MESSAGE_VALIDATION_ERROR', { errors });
    this.name = 'MessageValidationError';
  }
}

/**
 * Payment required error
 */
export class PaymentRequiredError extends UACPError {
  constructor(
    message: string,
    public paymentRequirements: unknown
  ) {
    super(message, 'PAYMENT_REQUIRED', { paymentRequirements });
    this.name = 'PaymentRequiredError';
  }
}

/**
 * Registry error
 */
export class RegistryError extends UACPError {
  constructor(message: string, details?: unknown) {
    super(message, 'REGISTRY_ERROR', details);
    this.name = 'RegistryError';
  }
}

/**
 * Network error
 */
export class NetworkError extends UACPError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends UACPError {
  constructor(message: string, timeout: number) {
    super(message, 'TIMEOUT_ERROR', { timeout });
    this.name = 'TimeoutError';
  }
}

/**
 * Agent initialization error
 */
export class AgentInitializationError extends UACPError {
  constructor(message: string, details?: unknown) {
    super(message, 'AGENT_INITIALIZATION_ERROR', details);
    this.name = 'AgentInitializationError';
  }
}

/**
 * Intent handler error
 */
export class IntentHandlerError extends UACPError {
  constructor(intent: string, message: string, details?: unknown) {
    super(message, 'INTENT_HANDLER_ERROR', { intent, ...details });
    this.name = 'IntentHandlerError';
  }
}
