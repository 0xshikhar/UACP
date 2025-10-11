import { Wallet } from 'ethers';
import { UACPAgent, UACPPaymentClient, isPaymentRequiredError } from '../src/index.js';

/**
 * Payment client agent that can process X402 payments
 */
async function main() {
  // Create wallet for payment processing (use test wallet in production)
  const wallet = Wallet.createRandom();
  console.log('💼 Wallet created:', wallet.address);
  console.log('⚠️  Note: This is a test wallet. Fund it before making real payments.\n');

  // Initialize payment client
  const paymentClient = new UACPPaymentClient({
    wallet,
    network: 'somnia',
  });

  // Create client agent
  const clientAgent = new UACPAgent({
    agentCard: {
      id: 'did:somnia:payment-client-001',
      name: 'Payment Client',
      description: 'Client agent with payment capabilities',
      endpoint: 'http://localhost:4003',
      capabilities: ['send_message', 'process_payment'],
      auth: { type: 'none' },
      version: '1.0.0',
    },
    port: 4003,
    logLevel: 'info',
  });

  // Initialize the client agent
  await clientAgent.initialize();
  await clientAgent.register();
  await clientAgent.listen();

  console.log('🚀 Payment Client is running on port 4003\n');

  // Wait for payment agent to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    // Test 1: Call free service (no payment required)
    console.log('📤 Test 1: Calling free service...');
    const freeResponse = await clientAgent.sendMessage({
      recipient: 'did:somnia:payment-agent-001',
      intent: 'free_service',
      task: {},
    });

    console.log('📥 Free service response:', JSON.stringify(freeResponse, null, 2));

    // Test 2: Call premium service (payment required)
    console.log('\n📤 Test 2: Calling premium service (will require payment)...');
    
    try {
      const premiumResponse = await clientAgent.sendMessage({
        recipient: 'did:somnia:payment-agent-001',
        intent: 'premium_service',
        task: {},
      });

      // Check if payment is required
      if (premiumResponse.paymentRequired && premiumResponse.paymentRequirements) {
        console.log('💰 Payment required!');
        console.log('Payment details:', {
          amount: premiumResponse.paymentRequirements.maxAmountRequired,
          asset: premiumResponse.paymentRequirements.asset,
          description: premiumResponse.paymentRequirements.description,
        });

        // In a real implementation, process the payment
        console.log('\n💳 Processing payment...');
        console.log('⚠️  Note: Payment processing requires funded wallet and deployed contracts');
        
        // Simulate payment processing
        // const paymentPayload = await paymentClient.processPayment(
        //   premiumResponse.paymentRequirements
        // );

        // Retry the request with payment
        // const retryResponse = await clientAgent.sendMessage({
        //   recipient: 'did:somnia:payment-agent-001',
        //   intent: 'premium_service',
        //   task: {},
        // }, {
        //   payment: paymentPayload
        // });

        console.log('✅ Payment would be processed here in production');
      } else {
        console.log('📥 Premium service response:', JSON.stringify(premiumResponse, null, 2));
      }
    } catch (error) {
      if (isPaymentRequiredError(error)) {
        console.log('💰 Payment required exception caught');
        console.log('Payment requirements:', error.paymentRequirements);
        
        // Handle payment
        console.log('💳 Would process payment here...');
      } else {
        throw error;
      }
    }

    // Test 3: Demonstrate payment flow
    console.log('\n📤 Test 3: Payment processing flow...');
    console.log('💡 In production, this would:');
    console.log('  1. Detect payment required (402 response)');
    console.log('  2. Create payment payload with wallet signature');
    console.log('  3. Retry request with X-Payment header');
    console.log('  4. Receive premium service after payment verification');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Keep the agent running
  console.log('\n✅ Payment client will keep running. Press Ctrl+C to exit.\n');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    await clientAgent.shutdown();
    process.exit(0);
  });
}

main();
