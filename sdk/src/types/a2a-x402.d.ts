/**
 * Type definitions for a2a-x402 payment module
 */

export interface PaymentRequirements {
  scheme: string;
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

export interface VerifyResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface SettleResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface Task {
  [key: string]: unknown;
}
