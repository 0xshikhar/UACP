import { Wallet } from 'ethers'
import {
  X402SettlementService,
  UACPPaymentClient,
  createUACPPaymentRequirements,
} from '../src/index.js'

/**
 * Demo of end-to-end X402 on-chain settlement + event logging to UACPEvents
 *
 * Required env:
 * - SOMNIA_RPC_URL
 * - SOMNIA_UACP_EVENTS (address of deployed UACPEvents)
 * - PRIVATE_KEY (payer wallet with funds)
 */
async function main() {
  const rpcUrl = process.env.SOMNIA_RPC_URL || ''
  const uacpEvents = process.env.SOMNIA_UACP_EVENTS || ''
  const pk = process.env.PRIVATE_KEY

  if (!rpcUrl || !uacpEvents || !pk) {
    console.error('Missing env. Set SOMNIA_RPC_URL, SOMNIA_UACP_EVENTS, PRIVATE_KEY')
    process.exit(1)
  }

  const wallet = new Wallet(pk)

  // Prepare payment client to create payloads from requirements
  const client = new UACPPaymentClient({ wallet })

  // Create demo payment requirements (in production, the merchant/agent generates this)
  const requirements = await createUACPPaymentRequirements({
    amount: '0.01',
    asset: 'USDC',
    payTo: wallet.address,
    resource: 'uacp://demo/settlement',
    network: 'base',
    description: 'Demo premium service',
    scheme: 'exact',
  })

  // Create a payment payload as payer
  const payload = await client.processPayment(requirements)

  // Initialize settlement service to verify + settle + log on-chain
  const settlement = new X402SettlementService({
    rpcUrl,
    uacpEventsAddress: uacpEvents,
    privateKey: pk,
  })

  const messageId = `msg-${Date.now()}`

  const result = await settlement.settleAndRecord({
    requirements,
    payload,
    messageId,
    asset: requirements.asset,
    amount: requirements.maxAmountRequired,
    amountDecimals: 6,
    from: wallet.address,
    to: requirements.payTo,
  })

  console.log('Settlement result:', result)

  const recorded = await settlement.getRecordedPayment(messageId)
  console.log('Recorded on-chain payment:', recorded)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
