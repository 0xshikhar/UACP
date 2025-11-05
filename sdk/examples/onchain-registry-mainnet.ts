import { Wallet } from 'ethers'
import { OnChainAgentRegistry, AgentStatus } from '../src/index.js'

/**
 * Example: Register an agent on Somnia mainnet on-chain registry
 *
 * Required env:
 * - SOMNIA_RPC_URL
 * - SOMNIA_AGENT_REGISTRY (address of deployed AgentRegistry)
 * - PRIVATE_KEY (owner wallet with funds)
 */
async function main() {
  const rpcUrl = process.env.SOMNIA_RPC_URL || ''
  const registryAddress = process.env.SOMNIA_AGENT_REGISTRY || ''
  const pk = process.env.PRIVATE_KEY

  if (!rpcUrl || !registryAddress || !pk) {
    console.error('Missing env. Set SOMNIA_RPC_URL, SOMNIA_AGENT_REGISTRY, PRIVATE_KEY')
    process.exit(1)
  }

  const wallet = new Wallet(pk)

  const registry = new OnChainAgentRegistry(
    {
      type: 'onchain',
      contractAddress: registryAddress,
      rpcUrl,
    },
    wallet,
  )

  const agentId = `did:somnia:echo-${Date.now()}`

  // Register
  await registry.registerAgent({
    id: agentId,
    name: 'Echo Agent',
    description: 'Simple echo service',
    endpoint: 'https://agents.example.com/echo',
    capabilities: ['echo', 'health'],
    paymentMethods: ['x402:USDC'],
    status: AgentStatus.ONLINE,
    auth: { type: 'none' },
    version: '1.0.0',
  })

  console.log('Registered agent:', agentId)

  // Query back
  const fetched = await registry.getAgent(agentId)
  console.log('Fetched agent:', fetched)

  // Update status
  await registry.updateAgentStatus(agentId, AgentStatus.BUSY)
  console.log('Updated status to BUSY')

  // Unregister (optional)
  // await registry.unregisterAgent(agentId)
  // console.log('Unregistered agent')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
