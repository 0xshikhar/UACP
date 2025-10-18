import express, { Express, Request, Response } from 'express';
import EventEmitter from 'eventemitter3';
import {
  AgentConfig,
  AgentCard,
  AgentEvent,
  AgentStatus,
  IntentHandler,
  IntentResponse,
} from './types/agent.js';
import { A2AMessage, CreateMessageParams, A2AResponse } from './types/message.js';
import { A2AProtocol } from './a2a.js';
import { AgentRegistry } from './registry.js';
import { MessageRouter } from './router.js';
import { Logger } from './utils/logger.js';
import { AgentInitializationError, IntentHandlerError } from './utils/errors.js';
import { validateDID } from './utils/validation.js';

const logger = new Logger({ level: 'info', prefix: 'Agent' });

/**
 * UACPAgent - Core agent implementation
 */
export class UACPAgent {
  private config: AgentConfig;
  private agentCard: AgentCard;
  private protocol: A2AProtocol;
  private registry: AgentRegistry;
  private router: MessageRouter;
  private eventEmitter: EventEmitter;
  private intentHandlers: Map<string, IntentHandler> = new Map();
  private app: Express;
  private server: any;
  private isInitialized = false;

  constructor(config: AgentConfig) {
    this.config = config;
    this.eventEmitter = new EventEmitter();

    // Initialize agent card
    this.agentCard = {
      ...config.agentCard,
      status: AgentStatus.OFFLINE,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Validate agent ID
    if (!validateDID(this.agentCard.id)) {
      throw new AgentInitializationError(`Invalid agent DID: ${this.agentCard.id}`);
    }

    // Initialize components
    this.protocol = new A2AProtocol(this.agentCard.id);
    this.registry = new AgentRegistry({
      type: 'memory',
      url: config.registryUrl,
    });
    this.router = new MessageRouter(this.registry);

    // Initialize Express app
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();

    // Set up logger
    if (config.logLevel) {
      logger.setLevel(config.logLevel);
    }

    logger.info(`Agent created: ${this.agentCard.name} (${this.agentCard.id})`);
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing agent...');

      // Update status
      this.agentCard.status = AgentStatus.ONLINE;
      this.agentCard.updatedAt = Date.now();

      this.isInitialized = true;
      this.emit(AgentEvent.INITIALIZED, { agentId: this.agentCard.id });

      logger.info('Agent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize agent', error);
      throw new AgentInitializationError(
        `Initialization failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Register agent with registry
   */
  async register(): Promise<void> {
    try {
      logger.info('Registering agent with registry...');

      await this.registry.registerAgent(this.agentCard);

      this.emit(AgentEvent.REGISTERED, { agentId: this.agentCard.id });
      logger.info('Agent registered successfully');
    } catch (error) {
      logger.error('Failed to register agent', error);
      throw error;
    }
  }

  /**
   * Start listening for incoming messages
   */
  async listen(port?: number): Promise<void> {
    const listenPort = port || this.config.port || 3000;

    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(listenPort, () => {
          logger.info(`Agent listening on port ${listenPort}`);
          logger.info(`A2A endpoint: http://localhost:${listenPort}/a2a`);
          resolve();
        });

        this.server.on('error', (error: Error) => {
          logger.error('Server error', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Set up Express routes
   */
  private setupRoutes(): void {
    // A2A message endpoint
    this.app.post('/a2a', async (req: Request, res: Response): Promise<void> => {
      try {
        const message = req.body as A2AMessage;

        logger.debug('Received A2A message', {
          messageId: message.id,
          sender: message.sender,
          intent: message.intent,
        });

        this.emit(AgentEvent.MESSAGE_RECEIVED, message);

        // Validate message
        this.protocol.validateMessage(message);

        // Check if message is expired
        if (this.protocol.isMessageExpired(message)) {
          res.status(408).json(
            A2AProtocol.createA2AResponse(message.id, false, undefined, {
              code: 'MESSAGE_EXPIRED',
              message: 'Message has expired',
            })
          );
          return;
        }

        // Handle the message
        const response = await this.handleMessage(message);

        res.status(response.status).json(response);
      } catch (error) {
        logger.error('Error handling A2A message', error);
        res.status(500).json(
          A2AProtocol.createA2AResponse(
            req.body?.id || 'unknown',
            false,
            undefined,
            {
              code: 'INTERNAL_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error',
            }
          )
        );
      }
    });

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: this.agentCard.status,
        agentId: this.agentCard.id,
        name: this.agentCard.name,
        timestamp: Date.now(),
      });
    });

    // Agent card endpoint
    this.app.get('/card', (_req: Request, res: Response) => {
      res.json(this.agentCard);
    });
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: A2AMessage): Promise<A2AResponse> {
    const handler = this.intentHandlers.get(message.intent);

    if (!handler) {
      logger.warn(`No handler found for intent: ${message.intent}`);
      return A2AProtocol.createA2AResponse(message.id, false, undefined, {
        code: 'INTENT_NOT_FOUND',
        message: `No handler registered for intent: ${message.intent}`,
      });
    }

    try {
      const context = {
        messageId: message.id,
        sender: message.sender,
        recipient: message.recipient,
        timestamp: message.timestamp,
        correlationId: message.correlationId,
      };

      const result: IntentResponse = await handler(message.task, context);

      // Handle payment required
      if (result.requiresPayment && result.paymentRequirements) {
        this.emit(AgentEvent.PAYMENT_REQUIRED, {
          messageId: message.id,
          paymentRequirements: result.paymentRequirements,
        });

        return A2AProtocol.createPaymentRequiredResponse(
          message.id,
          result.paymentRequirements
        );
      }

      // Handle error
      if (!result.success) {
        return A2AProtocol.createA2AResponse(message.id, false, undefined, {
          code: 'HANDLER_ERROR',
          message: result.error || 'Handler execution failed',
        });
      }

      // Success response
      return A2AProtocol.createA2AResponse(message.id, true, result.data);
    } catch (error) {
      logger.error(`Error executing handler for intent: ${message.intent}`, error);
      this.emit(AgentEvent.ERROR, { error, messageId: message.id });

      throw new IntentHandlerError(
        message.intent,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Register an intent handler
   */
  onIntent(intent: string, handler: IntentHandler): void {
    this.intentHandlers.set(intent, handler);
    logger.debug(`Intent handler registered: ${intent}`);
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(params: CreateMessageParams): Promise<A2AResponse> {
    const message = this.protocol.createMessage(params);

    logger.debug('Sending message', {
      messageId: message.id,
      recipient: message.recipient,
      intent: message.intent,
    });

    this.emit(AgentEvent.MESSAGE_SENT, message);

    const response = await this.router.sendMessage(message);

    return response;
  }

  /**
   * Shutdown the agent
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down agent...');

    // Update status
    this.agentCard.status = AgentStatus.OFFLINE;

    // Close server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          logger.info('Server closed');
          resolve();
        });
      });
    }

    // Unregister from registry
    try {
      await this.registry.unregisterAgent(this.agentCard.id);
    } catch (error) {
      logger.warn('Failed to unregister agent', error);
    }

    this.emit(AgentEvent.SHUTDOWN, { agentId: this.agentCard.id });
    logger.info('Agent shutdown complete');
  }

  /**
   * Event emitter methods
   */
  on(event: string, handler: (...args: any[]) => void): void {
    this.eventEmitter.on(event, handler);
  }

  once(event: string, handler: (...args: any[]) => void): void {
    this.eventEmitter.once(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.eventEmitter.off(event, handler);
  }

  emit(event: string, data?: any): void {
    this.eventEmitter.emit(event, data);
  }

  /**
   * Get agent card
   */
  getAgentCard(): AgentCard {
    return { ...this.agentCard };
  }

  /**
   * Get registry instance
   */
  getRegistry(): AgentRegistry {
    return this.registry;
  }

  /**
   * Get router instance
   */
  getRouter(): MessageRouter {
    return this.router;
  }

  /**
   * Check if agent is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.agentCard.status === AgentStatus.ONLINE;
  }
}
