import { Wallet } from 'ethers';
import type {
  PaymentRequirements,
  PaymentPayload,
  VerifyResponse,
  SettleResponse,
  Task,
} from './types/a2a-x402.js';
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
 * UACP Payment Server - Wrapper for merchant/service provider agents
 */
export class UACPPaymentServer {
  private network: string;

  constructor(config: X402Config = {}) {
    this.network = config.network || 'somnia';
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

      // Dynamic import to handle optional dependency
      // @ts-expect-error - a2a-x402 is an optional peer dependency
      const { verifyPayment } = await import('a2a-x402');
      const result = await verifyPayment(payload, requirements);

      if (result.success) {
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
  async settlePayment(payload: PaymentPayload): Promise<SettleResponse> {
    try {
      logger.debug('Settling payment', { payload });

      // Dynamic import to handle optional dependency
      // @ts-expect-error - a2a-x402 is an optional peer dependency
      const { settlePayment } = await import('a2a-x402');
      const result = await settlePayment(payload);

      if (result.success) {
        logger.info('Payment settled successfully');
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
  async createPaymentRequirements(params: {
    amount: string;
    scheme?: string;
    network?: string;
    asset: string;
    payTo: string;
    resource: string;
    description: string;
  }): Promise<PaymentRequirements> {
    // @ts-expect-error - a2a-x402 is an optional peer dependency
    const { createPaymentRequirements } = await import('a2a-x402');
    
    return createPaymentRequirements({
      scheme: params.scheme || 'exact',
      network: params.network || this.network,
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
  async requirePayment(requirements: PaymentRequirements): Promise<never> {
    // @ts-expect-error - a2a-x402 is an optional peer dependency
    const { x402PaymentRequiredException } = await import('a2a-x402');
    throw new x402PaymentRequiredException(requirements);
  }
}

/**
 * UACP Payment Client - Wrapper for client/orchestrator agents
 */
export class UACPPaymentClient {
  private wallet?: Wallet;

  constructor(config: X402Config = {}) {
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
    requirements: PaymentRequirements,
    _task?: Task
  ): Promise<PaymentPayload> {
    if (!this.wallet) {
      throw new PaymentRequiredError(
        'Wallet not configured for payment processing',
        requirements
      );
    }

    logger.info('Processing payment required', {
      amount: requirements.maxAmountRequired,
    });

    return await this.processPayment(requirements);
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

      // Dynamic import to handle optional dependency
      // @ts-expect-error - a2a-x402 is an optional peer dependency
      const { processPayment } = await import('a2a-x402');
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
}

/**
 * Helper function to create payment requirements
 */
export async function createUACPPaymentRequirements(
  params: UACPPaymentRequirements
): Promise<PaymentRequirements> {
  // @ts-expect-error - a2a-x402 is an optional peer dependency
  const { createPaymentRequirements } = await import('a2a-x402');
  return createPaymentRequirements(params);
}

/**
 * Helper to check if error is payment required
 */
export async function isPaymentRequiredError(error: unknown): Promise<boolean> {
  try {
    // @ts-expect-error - a2a-x402 is an optional peer dependency
    const { x402PaymentRequiredException } = await import('a2a-x402');
    return error instanceof x402PaymentRequiredException;
  } catch {
    return false;
  }
}

/**
 * Re-export types
 */
export type {
  PaymentRequirements,
  PaymentPayload,
  VerifyResponse,
  SettleResponse,
  Task,
} from './types/a2a-x402.js';
