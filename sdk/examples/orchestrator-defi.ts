/**
 * DeFi Orchestration Example
 * 
 * This example demonstrates a complex multi-agent workflow for DeFi operations:
 * 1. Fetch prices from multiple oracles
 * 2. Execute a swap if price is favorable
 * 3. Send notifications and log results in parallel
 * 4. Handle errors with rollback
 */

import {
  UACPAgent,
  AgentWorkflow,
  AgentOrchestrator,
  AgentRegistry,
  MessageRouter,
  AgentStatus,
  WorkflowEvent,
  ContextManager,
} from '../src/index.js';

async function main() {
  console.log('🚀 Starting DeFi Orchestration Example\n');

  // Initialize registry and router
  const registry = new AgentRegistry({ type: 'memory' });
  const router = new MessageRouter(registry);

  // Initialize context manager for session management
  const contextManager = new ContextManager({ ttl: 3600 });

  // ===== Mock Agents =====

  // 1. Price Oracle Agent
  const priceOracle = new UACPAgent({
    agentCard: {
      id: 'did:somnia:price-oracle',
      name: 'Price Oracle',
      description: 'Fetches token prices from multiple sources',
      endpoint: 'http://localhost:4001',
      capabilities: ['get_price', 'price_feed'],
      auth: { type: 'none' },
      paymentMethods: [],
      status: AgentStatus.ONLINE,
      version: '1.0.0',
    },
    port: 4001,
    logLevel: 'info',
  });

  priceOracle.onIntent('get_price', async (task) => {
    const { token } = task;
    console.log(`📊 Price Oracle: Fetching price for ${token}`);
    
    // Simulate price fetch
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const price = token === 'ETH' ? 2500 : 1.0; // Mock prices
    
    return {
      success: true,
      data: { token, price, timestamp: Date.now() },
    };
  });

  await priceOracle.initialize();
  await priceOracle.register();
  priceOracle.listen(4001);

  // 2. Swap Executor Agent
  const swapExecutor = new UACPAgent({
    agentCard: {
      id: 'did:somnia:swap-executor',
      name: 'Swap Executor',
      description: 'Executes token swaps on DEX',
      endpoint: 'http://localhost:4002',
      capabilities: ['swap', 'estimate_gas'],
      auth: { type: 'none' },
      paymentMethods: [],
      status: AgentStatus.ONLINE,
      version: '1.0.0',
    },
    port: 4002,
    logLevel: 'info',
  });

  swapExecutor.onIntent('swap', async (task) => {
    const { tokenIn, tokenOut, amount, priceResult } = task;
    console.log(`💱 Swap Executor: Swapping ${amount} ${tokenIn} for ${tokenOut}`);
    
    // Get price from previous step
    const price = (priceResult as any)?.price || 0;
    
    // Simulate swap
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const outputAmount = amount * price * 0.997; // 0.3% slippage
    
    return {
      success: true,
      data: {
        txHash: '0xabc123...',
        tokenIn,
        tokenOut,
        amountIn: amount,
        amountOut: outputAmount,
        executedAt: Date.now(),
      },
    };
  });

  await swapExecutor.initialize();
  await swapExecutor.register();
  swapExecutor.listen(4002);

  // 3. Notification Agent
  const notifier = new UACPAgent({
    agentCard: {
      id: 'did:somnia:notifier',
      name: 'Notifier',
      description: 'Sends notifications',
      endpoint: 'http://localhost:4003',
      capabilities: ['notify', 'email', 'webhook'],
      auth: { type: 'none' },
      paymentMethods: [],
      status: AgentStatus.ONLINE,
      version: '1.0.0',
    },
    port: 4003,
    logLevel: 'info',
  });

  notifier.onIntent('notify', async (task) => {
    const { message } = task;
    console.log(`📧 Notifier: ${message}`);
    
    return {
      success: true,
      data: { notified: true, timestamp: Date.now() },
    };
  });

  await notifier.initialize();
  await notifier.register();
  notifier.listen(4003);

  // 4. Logger Agent
  const logger = new UACPAgent({
    agentCard: {
      id: 'did:somnia:logger',
      name: 'Logger',
      description: 'Logs transactions on-chain',
      endpoint: 'http://localhost:4004',
      capabilities: ['log', 'store'],
      auth: { type: 'none' },
      paymentMethods: [],
      status: AgentStatus.ONLINE,
      version: '1.0.0',
    },
    port: 4004,
    logLevel: 'info',
  });

  logger.onIntent('log', async (task) => {
    console.log(`📝 Logger: Logging transaction data`);
    
    return {
      success: true,
      data: { logged: true, logId: 'log_' + Date.now() },
    };
  });

  await logger.initialize();
  await logger.register();
  logger.listen(4004);

  // 5. Treasury Agent (for rollback)
  const treasury = new UACPAgent({
    agentCard: {
      id: 'did:somnia:treasury',
      name: 'Treasury',
      description: 'Manages funds and refunds',
      endpoint: 'http://localhost:4005',
      capabilities: ['refund', 'transfer'],
      auth: { type: 'none' },
      paymentMethods: [],
      status: AgentStatus.ONLINE,
      version: '1.0.0',
    },
    port: 4005,
    logLevel: 'info',
  });

  treasury.onIntent('refund', async (task) => {
    console.log(`💰 Treasury: Processing refund`);
    
    return {
      success: true,
      data: { refunded: true, txHash: '0xrefund123...' },
    };
  });

  await treasury.initialize();
  await treasury.register();
  treasury.listen(4005);

  // Wait for all agents to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  // ===== Create Orchestrator Agent =====

  const orchestratorAgent = new UACPAgent({
    agentCard: {
      id: 'did:somnia:orchestrator',
      name: 'DeFi Orchestrator',
      description: 'Orchestrates complex DeFi workflows',
      endpoint: 'http://localhost:4000',
      capabilities: ['orchestrate', 'workflow'],
      auth: { type: 'none' },
      paymentMethods: [],
      status: AgentStatus.ONLINE,
      version: '1.0.0',
    },
    port: 4000,
    logLevel: 'info',
  });

  await orchestratorAgent.initialize();
  await orchestratorAgent.register();

  // Create orchestrator
  const orchestrator = new AgentOrchestrator(
    'did:somnia:orchestrator',
    registry,
    router
  );

  // Listen to workflow events
  orchestrator.on(WorkflowEvent.STARTED, (data) => {
    console.log(`\n✨ Workflow started: ${data.workflowId}\n`);
  });

  orchestrator.on(WorkflowEvent.STEP_COMPLETED, (result) => {
    console.log(`✅ Step completed: ${result.stepId} (${result.duration}ms)\n`);
  });

  orchestrator.on(WorkflowEvent.PARALLEL_GROUP_COMPLETED, (data) => {
    console.log(`⚡ Parallel group completed: ${data.results.length} steps\n`);
  });

  orchestrator.on(WorkflowEvent.COMPLETED, (result) => {
    console.log(`\n🎉 Workflow completed successfully!`);
    console.log(`Total duration: ${result.duration}ms\n`);
  });

  orchestrator.on(WorkflowEvent.FAILED, (result) => {
    console.log(`\n❌ Workflow failed: ${result.error?.message}\n`);
  });

  // ===== Build DeFi Workflow =====

  const workflow = new AgentWorkflow('DeFi Swap Workflow')
    .description('Fetch price, execute swap, and notify')
    .timeout(30000)
    
    // Step 1: Fetch ETH price
    .step('fetch_eth_price', {
      agent: 'did:somnia:price-oracle',
      intent: 'get_price',
      task: { token: 'ETH' },
      retries: 2,
    })
    
    // Step 2: Execute swap (depends on price)
    .then('execute_swap', {
      agent: 'did:somnia:swap-executor',
      intent: 'swap',
      task: {
        tokenIn: 'ETH',
        tokenOut: 'USDC',
        amount: 1.0,
      },
      retries: 1,
    })
    
    // Step 3 & 4: Parallel notifications and logging
    .parallel([
      {
        agent: 'did:somnia:notifier',
        intent: 'notify',
        task: { message: 'Swap executed successfully!' },
      },
      {
        agent: 'did:somnia:logger',
        intent: 'log',
        task: { type: 'swap', action: 'executed' },
      },
    ])
    
    // Add error handler for swap step
    .onError('execute_swap', {
      agent: 'did:somnia:treasury',
      intent: 'refund',
      task: { reason: 'swap_failed' },
    });

  // Build the workflow definition
  const workflowDef = workflow.build();

  console.log(`📋 Workflow Definition:`);
  console.log(`   Name: ${workflowDef.name}`);
  console.log(`   Steps: ${workflowDef.steps.length}`);
  console.log(`   Parallel Groups: ${workflowDef.parallelGroups?.length || 0}\n`);

  // ===== Execute Workflow =====

  try {
    // Create session
    const sessionId = await contextManager.createSession({
      userId: 'user_123',
      workflowType: 'defi_swap',
    });

    console.log(`🔐 Session created: ${sessionId}\n`);

    // Execute workflow
    const result = await orchestrator.execute(workflowDef, {
      sessionId,
      initialState: {
        userId: 'user_123',
        walletAddress: '0x123...',
      },
      onStepComplete: (stepResult) => {
        console.log(`   Step Result: ${JSON.stringify(stepResult.data)}`);
      },
    });

    // Display results
    console.log(`\n📊 Workflow Results:`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Total Steps: ${result.steps.length}`);
    console.log(`   Duration: ${result.duration}ms`);
    
    // Access state data
    console.log(`\n💾 Final State:`);
    result.context.state.forEach((value, key) => {
      console.log(`   ${key}:`, value);
    });

  } catch (error) {
    console.error('Workflow execution failed:', error);
  }

  // ===== Cleanup =====
  
  console.log('\n🧹 Cleaning up...');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await priceOracle.shutdown();
  await swapExecutor.shutdown();
  await notifier.shutdown();
  await logger.shutdown();
  await treasury.shutdown();
  await orchestratorAgent.shutdown();
  
  console.log('✨ Example complete!\n');
  process.exit(0);
}

main().catch(console.error);
