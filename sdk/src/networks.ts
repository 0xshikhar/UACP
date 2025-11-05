import { Wallet, ethers } from 'ethers'

export interface ContractAddresses {
  agentRegistry?: string
  uacpEvents?: string
}

export interface NetworkConfig {
  name: string
  chainId: number
  rpcUrl: string
  contracts: ContractAddresses
}

// Somnia mainnet configuration via env overrides. Provide sensible defaults to force explicit config.
export const somniaMainnet: NetworkConfig = {
  name: 'somnia-mainnet',
  chainId: Number(process.env.SOMNIA_CHAIN_ID || 0),
  rpcUrl: process.env.SOMNIA_RPC_URL || '',
  contracts: {
    agentRegistry: process.env.SOMNIA_AGENT_REGISTRY || '',
    uacpEvents: process.env.SOMNIA_UACP_EVENTS || '',
  },
}

export function getProvider(rpcUrl: string) {
  if (!rpcUrl) throw new Error('RPC URL is required')
  return new ethers.JsonRpcProvider(rpcUrl)
}

export function getWallet(privateKey: string | undefined, rpcUrl: string) {
  const provider = getProvider(rpcUrl)
  if (!privateKey) return undefined
  return new Wallet(privateKey, provider)
}
