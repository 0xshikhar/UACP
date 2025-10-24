/**
 * Type definitions for a2a-x402 payment module
 */

export type SupportedNetworks = "base" | "base-sepolia" | "ethereum" | "polygon" | "polygon-amoy";

export interface PaymentRequirements {
  scheme: string;
  network: SupportedNetworks;
  asset: string;
  payTo: string;
  maxAmountRequired: string;
  minAmountRequired?: string;
  resource: string;
  description: string;
  mimeType: string;
  maxTimeoutSeconds: number;
  outputSchema?: any;
  extra?: Record<string, any>;
}

export interface EIP3009Authorization {
  from: string;
  to: string;
  value: string;
  validAfter: number;
  validBefore: number;
  nonce: string;
}

export interface ExactPaymentPayload {
  signature: string;
  authorization: EIP3009Authorization;
}

export interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: ExactPaymentPayload;
}

export interface VerifyResponse {
  isValid: boolean;
  payer?: string;
  invalidReason?: string;
}

export interface SettleResponse {
  success: boolean;
  transaction?: string;
  network: string;
  payer?: string;
  errorReason?: string;
}

export interface Price {
  value: string;
  asset: string;
}

export interface CreatePaymentRequirementsOptions {
  price: Price | string | number;
  payToAddress: string;
  resource: string;
  network?: string;
  description?: string;
  mimeType?: string;
  scheme?: string;
  maxTimeoutSeconds?: number;
  outputSchema?: any;
  extra?: Record<string, any>;
}

export interface Task {
  [key: string]: unknown;
}
