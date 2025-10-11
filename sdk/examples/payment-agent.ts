import { Wallet } from 'ethers';
import { UACPAgent, AgentEvent, UACPPaymentServer } from '../src/index.js';

/**
 * Payment-enabled agent demonstrating X402 integration
 * This agent requires payment for premium features
 */
async function main() {
  // Initialize payment server (merchant side)
  const paymentServer = new UACPPaymentServer({
    network: 'somnia',
  });

  // Create payment-enabled agent
  const paymentAgent = new UACPAgent({
    agentCard: {
      id: 'did:somnia:payment-agent-001',
      name: 'Payment Agent',
      description: 'Agent with payment-enabled premium features',
      endpoint: 'http://localhost:4002',
      capabilities: ['free_service', 'premium_service', 'process_payment'],
      paymentMethods: ['x402'],
      auth: { type: 'none' },
      version: '1.0.0',
    },
    port: 4002,
    logLevel: 'info',
    enablePayments: true,
  });

  // Free service - no payment required
  paymentAgent.onIntent('free_service', async (task, context) => {
    console.log('🆓 Free service requested from:', context.sender);
    
    return {
      success: true,
      data: {
        message: 'This is a free service',
        timestamp: Date.now(),
      },
    };
  });

  // Premium service - payment required
  paymentAgent.onIntent('premium_service', async (task, context) => {
    console.log('💎 Premium service requested from:', context.sender);

    // Check if payment was provided in the request
    // In a real implementation, you'd check the X-Payment header
    const paymentProvided = false; // Simplified for example

    if (!paymentProvided) {
      // Create payment requirements
      const paymentRequirements = paymentServer.createPaymentRequirements({
        amount: '1000000', // 1 USDC (6 decimals)
        asset: '0x...', // USDC contract address on Somnia
        payTo: '0x...', // Your wallet address
        resource: '/premium_service',
        description: 'Access to premium service',
        network: 'somnia',
        scheme: 'exact',
      });

      console.log('💰 Payment required:', {
        amount: '1 USDC',
        resource: paymentRequirements.resource,
      });

      return {
        success: false,
        requiresPayment: true,
        paymentRequirements,
      };
    }

    // Payment verified - provide premium service
    return {
      success: true,
      data: {
        message: 'Premium service delivered!',
        features: ['advanced_analytics', 'priority_support', 'custom_reports'],
        timestamp: Date.now(),
      },
    };
  });

  // Process payment intent
  paymentAgent.onIntent('process_payment', async (task, context) => {
    console.log('💳 Processing payment from:', context.sender);

    try {
      // In a real implementation, verify and settle payment
      // const verified = await paymentServer.verifyPayment(payload, requirements);
      // const settled = await paymentServer.settlePayment(payload, requirements);

      return {
        success: true,
        data: {
          paymentId: 'payment-' + Date.now(),
          status: 'completed',
          message: 'Payment processed successfully',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  });

  // Listen to payment events
  paymentAgent.on(AgentEvent.PAYMENT_REQUIRED, (data) => {
    console.log('💰 Payment required event:', {
      messageId: data.messageId,
      amount: data.paymentRequirements.maxAmountRequired,
    });
  });

  paymentAgent.on(AgentEvent.MESSAGE_RECEIVED, (message) => {
    console.log('📨 Message received:', {
      id: message.id,
      intent: message.intent,
      sender: message.sender,
    });
  });

  // Initialize and start the agent
  try {
    await paymentAgent.initialize();
    await paymentAgent.register();
    await paymentAgent.listen();

    console.log('\n🚀 Payment Agent is running!');
    console.log('📍 Endpoint: http://localhost:4002/a2a');
    console.log('💚 Health: http://localhost:4002/health');
    console.log('🎴 Card: http://localhost:4002/card');
    console.log('\n💡 Features:');
    console.log('  - free_service: No payment required');
    console.log('  - premium_service: Requires 1 USDC payment');
    console.log('  - process_payment: Payment processing\n');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down...');
      await paymentAgent.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start payment agent:', error);
    process.exit(1);
  }
}

main();
