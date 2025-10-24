import axios, { AxiosError } from 'axios';
import { A2AMessage, A2AResponse, SendMessageOptions } from './types/message.js';
import { AgentRegistry } from './registry.js';
import { Logger } from './utils/logger.js';
import { NetworkError, TimeoutError, PaymentRequiredError } from './utils/errors.js';
import { retry, CircuitBreaker } from './utils/retry.js';

const logger = new Logger({ level: 'info', prefix: 'Router' });

/**
 * Message Router - Handles message delivery and routing
 */
export class MessageRouter {
  private registry: AgentRegistry;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private defaultTimeout = 30000; // 30 seconds

  constructor(registry: AgentRegistry) {
    this.registry = registry;
  }

  /**
   * Send a message to a recipient agent
   */
  async sendMessage(
    message: A2AMessage,
    options: SendMessageOptions = {}
  ): Promise<A2AResponse> {
    const { timeout = this.defaultTimeout, retries = 3, headers = {}, payment } = options;

    try {
      // Get recipient agent details
      logger.info(`🔍 Looking up agent in registry: ${message.recipient}`);
      const recipient = await this.registry.getAgent(message.recipient);
      logger.info(`✅ Found agent: ${recipient.name} at ${recipient.endpoint}`);

      logger.debug(`Routing message to ${recipient.name}`, {
        messageId: message.id,
        intent: message.intent,
        endpoint: recipient.endpoint,
      });

      // Get or create circuit breaker for this agent
      const circuitBreaker = this.getCircuitBreaker(recipient.id);

      // Prepare headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Message-ID': message.id,
        'X-Sender-ID': message.sender,
        ...headers,
      };

      // Add payment header if provided
      if (payment) {
        requestHeaders['X-Payment'] = JSON.stringify(payment);
      }

      // Send message with retry logic
      const response = await retry(
        async () => {
          return await circuitBreaker.execute(async () => {
            return await this.sendHTTPRequest(recipient.endpoint, message, requestHeaders, timeout);
          });
        },
        { maxRetries: retries },
        `sendMessage:${message.intent}`
      );

      return response;
    } catch (error) {
      logger.error('Failed to send message', error);
      throw this.handleError(error);
    }
  }

  /**
   * Send HTTP request to agent endpoint
   */
  private async sendHTTPRequest(
    endpoint: string,
    message: A2AMessage,
    headers: Record<string, string>,
    timeout: number
  ): Promise<A2AResponse> {
    try {
      const response = await axios.post(`${endpoint}/a2a`, message, {
        headers,
        timeout,
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      // Handle payment required (402)
      if (response.status === 402) {
        const a2aResponse = response.data as A2AResponse;
        throw new PaymentRequiredError(
          'Payment required for this resource',
          a2aResponse.paymentRequirements
        );
      }

      return response.data as A2AResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new TimeoutError(`Request timeout after ${timeout}ms`, timeout);
        }
        if (error.response?.status === 402) {
          throw new PaymentRequiredError(
            'Payment required for this resource',
            error.response.data?.paymentRequirements
          );
        }
      }
      throw error;
    }
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcastMessage(
    message: A2AMessage,
    recipientIds: string[],
    options: SendMessageOptions = {}
  ): Promise<Map<string, A2AResponse | Error>> {
    const results = new Map<string, A2AResponse | Error>();

    const promises = recipientIds.map(async (recipientId) => {
      try {
        const modifiedMessage = { ...message, recipient: recipientId };
        const response = await this.sendMessage(modifiedMessage, options);
        results.set(recipientId, response);
      } catch (error) {
        results.set(recipientId, error as Error);
      }
    });

    await Promise.allSettled(promises);

    logger.info(`Broadcast completed: ${recipientIds.length} recipients`, {
      successful: Array.from(results.values()).filter((r) => !(r instanceof Error)).length,
      failed: Array.from(results.values()).filter((r) => r instanceof Error).length,
    });

    return results;
  }

  /**
   * Get or create circuit breaker for an agent
   */
  private getCircuitBreaker(agentId: string): CircuitBreaker {
    if (!this.circuitBreakers.has(agentId)) {
      const breaker = new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        halfOpenMaxAttempts: 3,
      });
      this.circuitBreakers.set(agentId, breaker);
    }
    return this.circuitBreakers.get(agentId)!;
  }

  /**
   * Reset circuit breaker for an agent
   */
  resetCircuitBreaker(agentId: string): void {
    const breaker = this.circuitBreakers.get(agentId);
    if (breaker) {
      breaker.reset();
      logger.info(`Circuit breaker reset for agent: ${agentId}`);
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return new NetworkError(
        `Network error: ${axiosError.message}`,
        {
          code: axiosError.code,
          status: axiosError.response?.status,
        }
      );
    }

    return new Error(`Unknown error: ${String(error)}`);
  }

  /**
   * Set default timeout for requests
   */
  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
    logger.info(`Default timeout set to ${timeout}ms`);
  }

  /**
   * Get circuit breaker status for an agent
   */
  getCircuitBreakerStatus(agentId: string): string | null {
    const breaker = this.circuitBreakers.get(agentId);
    return breaker ? breaker.getState() : null;
  }
}
