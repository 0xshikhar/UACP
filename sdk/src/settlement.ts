import { Contract, Wallet, ethers } from 'ethers'
import { Logger } from './utils/logger.js'
import { NetworkError, UACPError } from './utils/errors.js'
import type {
  PaymentRequirements,
  PaymentPayload,
  VerifyResponse,
  SettleResponse,
} from './types/a2a-x402.js'

const logger = new Logger({ level: 'info', prefix: 'Settlement' })

const UACP_EVENTS_ABI = [
  'function logPayment(string messageId, string transactionHash, string asset, uint256 amount, string from, string to) external',
  'function getPayment(string messageId) external view returns (tuple(string messageId, string transactionHash, string asset, uint256 amount, string from, string to, uint256 timestamp, uint256 blockNumber))',
]

export interface SettlementConfig {
  rpcUrl: string
  uacpEventsAddress: string
  wallet?: Wallet
  privateKey?: string
}

export interface SettleAndRecordParams {
  requirements: PaymentRequirements
  payload: PaymentPayload
  messageId: string
  asset: string
  amount: string
  amountDecimals?: number
  from: string
  to: string
}

export interface SettlementResult {
  success: boolean
  txHash?: string
  verify: VerifyResponse
  settlement?: SettleResponse
}

export class X402SettlementService {
  private provider: ethers.JsonRpcProvider
  private wallet?: Wallet
  private uacpEvents: Contract

  constructor(cfg: SettlementConfig) {
    if (!cfg.rpcUrl) throw new NetworkError('rpcUrl is required')
    if (!cfg.uacpEventsAddress) throw new UACPError('uacpEventsAddress is required', 'CONFIG_ERROR')

    this.provider = new ethers.JsonRpcProvider(cfg.rpcUrl)
    this.wallet = cfg.wallet ?? (cfg.privateKey ? new Wallet(cfg.privateKey, this.provider) : undefined)

    const signerOrProvider = this.wallet ?? this.provider
    this.uacpEvents = new Contract(cfg.uacpEventsAddress, UACP_EVENTS_ABI, signerOrProvider)

    logger.info('Settlement service initialized')
  }

  async settleAndRecord(params: SettleAndRecordParams): Promise<SettlementResult> {
    try {
      logger.info('Verifying X402 payment payload')
      const { verifyPayment, settlePayment } = await import('a2a-x402')

      const verify: VerifyResponse = await verifyPayment(params.payload, params.requirements)
      if (!verify.isValid) {
        logger.warn('Payment verification failed', verify)
        return { success: false, verify }
      }

      logger.info('Settling on-chain via X402 facilitator')
      const settlement: SettleResponse = await settlePayment(params.payload, params.requirements)
      if (!settlement.success || !settlement.transaction) {
        logger.warn('Payment settlement failed', settlement)
        return { success: false, verify, settlement }
      }

      const amountBN = this.parseAmount(params.amount, params.amountDecimals)

      if (!this.wallet) {
        throw new UACPError('Wallet required to record on-chain events', 'MISSING_WALLET')
      }

      logger.info('Recording payment to UACPEvents', {
        messageId: params.messageId,
        tx: settlement.transaction,
      })

      const tx = await (this.uacpEvents.connect(this.wallet) as any).logPayment(
        params.messageId,
        settlement.transaction,
        params.asset,
        amountBN,
        params.from,
        params.to,
      )
      const receipt = await tx.wait()
      logger.info('UACPEvents logged', { txHash: receipt.hash, blockNumber: receipt.blockNumber })

      return { success: true, txHash: receipt.hash, verify, settlement }
    } catch (err) {
      logger.error('Settlement error', err)
      throw err
    }
  }

  async getRecordedPayment(messageId: string) {
    try {
      return await (this.uacpEvents as any).getPayment(messageId)
    } catch (err) {
      logger.error('Failed to fetch recorded payment', err)
      throw err
    }
  }

  private parseAmount(amount: string, decimals?: number) {
    if (decimals === undefined) {
      // Assume amount is already in wei-like integer string
      return BigInt(amount)
    }
    return ethers.parseUnits(amount, decimals)
  }
}
