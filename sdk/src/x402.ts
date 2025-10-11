import { Wallet } from 'ethers';
import {
  x402PaymentRequiredException,
  x402ServerExecutor,
  x402ClientExecutor,
  PaymentRequirements,
  PaymentPayload,
  processPayment,
  verifyPayment,
  settlePayment,
  createPaymentRequirements,
  x402Utils,
  VerifyResponse,
  SettleResponse,
  Task,
} from 'a2a-x402';
import { PaymentRequiredError } from './utils/errors.js';
import { Logger } from './utils/logger.js';

const logger = new Logger({ level: 'info', prefix: 'X402' });

/**
 * X402 Payment configuration
 */
export interface X402Config {
  wallet?: Wallet;
  network?: string;
  rpcUrl?: string;
  facilitatorUrl?: string;
}

/**
 * Payment requirements for UACP
 */
export interface UACPPaymentRequirements {
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

/**
 * UACP Payment Server - Extends x402ServerExecutor for merchant/service provider agents
 */
export class UACPPaymentServer extends x402ServerExecutor {
  private config: X402Config;

  constructor(config: X402Config = {}) {
    super();
    this.config = config;
    logger.info('Payment server initialized');
  }

  /**
   * Verify payment from client
   */
  async verifyPayment(
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<VerifyResponse> {
    try {
      logger.debug('Verifying payment', { payload, requirements });

      const result = await verifyPayment(payload, requirements);

      if (result.verified) {
        logger.info('Payment verified successfully', {
          transactionHash: payload.transactionHash,
          amount: payload.amount,
        });
      } else {
        logger.warn('Payment verification failed', result);
      }

      return result;
    } catch (error) {
      logger.error('Payment verification error', error);
      throw error;
    }
  }

  /**
   * Settle payment on-chain
   */
  async settlePayment(
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<SettleResponse> {
    try {
      logger.debug('Settling payment', { payload, requirements });

      const result = await settlePayment(payload, requirements);

      if (result.settled) {
        logger.info('Payment settled successfully', {
          transactionHash: result.transactionHash,
        });
      } else {
        logger.warn('Payment settlement failed', result);
      }

      return result;
    } catch (error) {
      logger.error('Payment settlement error', error);
      throw error;
    }
  }

  /**
   * Create payment requirements for a resource
   */
  createPaymentRequirements(params: {
    amount: string;
    asset: string;
    payTo: string;
    resource: string;
    description: string;
    network?: string;
    scheme?: 'exact' | 'range' | 'subscription';
  }): PaymentRequirements {
    return createPaymentRequirements({
      scheme: params.scheme || 'exact',
      network: params.network || this.config.network || 'somnia',
      asset: params.asset,
      payTo: params.payTo,
      maxAmountRequired: params.amount,
      resource: params.resource,
      description: params.description,
      mimeType: 'application/json',
      maxTimeoutSeconds: 1200,
    });
  }

  /**
   * Throw payment required exception
   */
  requirePayment(description: string, requirements: PaymentRequirements): never {
    throw new x402PaymentRequiredException(description, requirements);
  }
}

/**
 * UACP Payment Client - Extends x402ClientExecutor for client/orchestrator agents
 */
export class UACPPaymentClient extends x402ClientExecutor {
  private config: X402Config;
  private wallet?: Wallet;

  constructor(config: X402Config = {}) {
    super();
    this.config = config;
    this.wallet = config.wallet;
    logger.info('Payment client initialized');
  }

  /**
   * Set wallet for payment processing
   */
  setWallet(wallet: Wallet): void {
    this.wallet = wallet;
    logger.info('Wallet configured', { address: wallet.address });
  }

  /**
   * Handle payment required response
   */
  async handlePaymentRequired(
    error: x402PaymentRequiredException,
    task: Task
  ): Promise<PaymentPayload> {
    if (!this.wallet) {
      throw new PaymentRequiredError(
        'Wallet not configured for payment processing',
        error.paymentRequirements
      );
    }

    logger.info('Processing payment required', {
      description: error.message,
      amount: error.paymentRequirements.maxAmountRequired,
    });

    return await this.processPayment(error.paymentRequirements);
  }

  /**
   * Process payment for given requirements
   */
  async processPayment(requirements: PaymentRequirements): Promise<PaymentPayload> {
    if (!this.wallet) {
      throw new PaymentRequiredError('Wallet not configured', requirements);
    }

    try {
      logger.debug('Processing payment', { requirements });

      const payload = await processPayment(requirements, this.wallet);

      logger.info('Payment processed successfully', {
        transactionHash: payload.transactionHash,
        amount: payload.amount,
      });

      return payload;
    } catch (error) {
      logger.error('Payment processing error', error);
      throw error;
    }
  }

  /**
   * Check if payment is required from task
   */
  isPaymentRequired(task: Task): boolean {
    return x402Utils.isPaymentRequired(task);
  }

  /**
   * Extract payment requirements from task
   */
  getPaymentRequirements(task: Task): PaymentRequirements | null {
    return x402Utils.getPaymentRequirements(task);
  }

  /**
   * Check if payment was successful
   */
  isPaymentSuccessful(task: Task): boolean {
    return x402Utils.isPaymentSuccessful(task);
  }
}

/**
 * Helper function to create payment requirements
 */
export function createUACPPaymentRequirements(
  params: UACPPaymentRequirements
): PaymentRequirements {
  return createPaymentRequirements(params);
}

/**
 * Helper to check if error is payment required
 */
export function isPaymentRequiredError(error: unknown): error is x402PaymentRequiredException {
  return error instanceof x402PaymentRequiredException;
}

/**
 * Export x402 types and utilities
 */
export type {
  PaymentRequirements,
  PaymentPayload,
  VerifyResponse,
  SettleResponse,
  Task,
} from 'a2a-x402';

export { x402PaymentRequiredException, x402Utils } from 'a2a-x402';
