/**
 * Advanced Orchestration Example
 * 
 * Demonstrates:
 * - Conditional execution
 * - Retry logic
 * - Custom error handlers
 * - Workflow composition
 * - State management
 */

import {
  UACPAgent,
  AgentWorkflow,
  AgentOrchestrator,
  AgentRegistry,
  MessageRouter,
  ContextManager,
  AgentStatus,
  WorkflowEvent,
  WorkflowStepStatus,
} from '../src/index.js';

async function main() {
  console.log('🔥 Advanced Orchestration Example\n');

  const registry = new AgentRegistry({ type: 'memory' });
  const router = new MessageRouter(registry);
  const contextManager = new ContextManager();

  // ===== Create Agents =====

  // Validation Agent
  const validator = new UACPAgent({
    agentCard: {
      id: 'did:somnia:validator',
      name: 'Validator',
      description: 'Validates data',
      endpoint: 'http://localhost:6001',
      capabilities: ['validate'],
      auth: { type: 'none' },
      paymentMethods: [],
      status: AgentStatus.ONLINE,
      version: '1.0.0',
    },
    port: 6001,
  });

  validator.onIntent('validate', async (task) => {
    const { data } = task;
    console.log(`🔍 Validating: ${JSON.stringify(data)}`);
    
    const isValid = data && data.amount > 0;
    
    return {
      success: true,
      data: { 
        valid: isValid, 
        errors: isValid ? [] : ['Invalid amount'],
        validatedAt: Date.now(),
      },
    };
  });

  await validator.initialize();
  await validator.register();
  validator.listen(6001);

  // Processing Agent (with simulated failures for retry demo)
  const processor = new UACPAgent({
    agentCard: {
      id: 'did:somnia:processor',
      name: 'Processor',
      description: 'Processes transactions',
      endpoint: 'http://localhost:6002',
      capabilities: ['process'],
      auth: { type: 'none' },
      paymentMethods: [],
      status: AgentStatus.ONLINE,
      version: '1.0.0',
    },
    port: 6002,
  });

  let processAttempts = 0;

  processor.onIntent('process', async (task) => {
    processAttempts++;
    console.log(`⚙️  Processing (attempt ${processAttempts})...`);
    
    // Simulate failure on first 2 attempts (to test retry)
    if (processAttempts < 3) {
      throw new Error('Simulated processing error');
    }
    
    return {
      success: true,
      data: { 
        processed: true, 
        attempts: processAttempts,
        processedAt: Date.now(),
      },
    };
  });

  await processor.initialize();
  await processor.register();
  processor.listen(6002);

  // Notification Agent
  const notifier = new UACPAgent({
    agentCard: {
      id: 'did:somnia:notifier',
      name: 'Notifier',
      description: 'Sends notifications',
      endpoint: 'http://localhost:6003',
      capabilities: ['notify'],
      auth: { type: 'none' },
      paymentMethods: [],
      status: AgentStatus.ONLINE,
      version: '1.0.0',
    },
    port: 6003,
  });

  notifier.onIntent('notify', async (task) => {
    const { message, channel } = task;
    console.log(`📢 Notification [${channel || 'default'}]: ${message}`);
    
    return {
      success: true,
      data: { sent: true, timestamp: Date.now() },
    };
  });

  await notifier.initialize();
  await notifier.register();
  notifier.listen(6003);

  // Cleanup Agent (for rollback)
  const cleanup = new UACPAgent({
    agentCard: {
      id: 'did:somnia:cleanup',
      name: 'Cleanup',
      description: 'Handles cleanup and rollback',
      endpoint: 'http://localhost:6004',
      capabilities: ['cleanup', 'rollback'],
      auth: { type: 'none' },
      paymentMethods: [],
      status: AgentStatus.ONLINE,
      version: '1.0.0',
    },
    port: 6004,
  });

  cleanup.onIntent('cleanup', async (task) => {
    console.log(`🧹 Cleanup: Reverting changes...`);
    
    return {
      success: true,
      data: { cleanedUp: true, timestamp: Date.now() },
    };
  });

  await cleanup.initialize();
  await cleanup.register();
  cleanup.listen(6004);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // ===== Create Orchestrator =====

  const orchestrator = new AgentOrchestrator(
    'did:somnia:orchestrator',
    registry,
    router
  );

  // Track workflow events
  let stepCount = 0;
  
  orchestrator.on(WorkflowEvent.STEP_STARTED, (data) => {
    stepCount++;
    console.log(`\n[${stepCount}] Starting: ${data.stepId}`);
  });

  orchestrator.on(WorkflowEvent.STEP_COMPLETED, (result) => {
    console.log(`[${stepCount}] ✅ Completed: ${result.stepId} (${result.attempts} attempts, ${result.duration}ms)`);
  });

  orchestrator.on(WorkflowEvent.STEP_FAILED, (result) => {
    console.log(`[${stepCount}] ❌ Failed: ${result.stepId} - ${result.error?.message}`);
  });

  // ===== Example 1: Workflow with Retry Logic =====

  console.log('📝 Example 1: Retry Logic\n');

  const retryWorkflow = new AgentWorkflow('Retry Demo')
    .step('validate', {
      agent: 'did:somnia:validator',
      intent: 'validate',
      task: { data: { amount: 100 } },
    })
    .then('process', {
      agent: 'did:somnia:processor',
      intent: 'process',
      task: {},
      retries: 3, // Will retry up to 3 times
    })
    .then('notify_success', {
      agent: 'did:somnia:notifier',
      intent: 'notify',
      task: { message: 'Processing completed!', channel: 'success' },
    })
    .onError('process', {
      agent: 'did:somnia:cleanup',
      intent: 'cleanup',
      task: { reason: 'process_failed' },
    });

  try {
    processAttempts = 0; // Reset counter
    const result1 = await orchestrator.execute(retryWorkflow.build());
    
    console.log(`\n✅ Workflow completed after retries`);
    console.log(`Total duration: ${result1.duration}ms\n`);
  } catch (error) {
    console.log(`❌ Workflow failed:`, (error as Error).message);
  }

  // ===== Example 2: Workflow with Custom Callbacks =====

  console.log('\n📝 Example 2: Custom Step Callbacks\n');

  const callbackWorkflow = new AgentWorkflow('Callback Demo')
    .step('step1', {
      agent: 'did:somnia:validator',
      intent: 'validate',
      task: { data: { amount: 500 } },
      onSuccess: async (result) => {
        console.log(`   📊 Custom callback: Validation result =`, result);
      },
    })
    .then('step2', {
      agent: 'did:somnia:notifier',
      intent: 'notify',
      task: { message: 'Step 1 completed!' },
      onSuccess: async (result) => {
        console.log(`   📊 Custom callback: Notification sent =`, result);
      },
    });

  const result2 = await orchestrator.execute(callbackWorkflow.build(), {
    onStepComplete: (result) => {
      console.log(`   ⚡ Global callback: Step '${result.stepId}' completed`);
    },
  });

  console.log(`\n✅ Workflow with callbacks completed\n`);

  // ===== Example 3: Workflow with State Management =====

  console.log('📝 Example 3: State Management Across Steps\n');

  const sessionId = await contextManager.createSession({
    userId: 'user_789',
    workflow: 'advanced_demo',
  });

  const stateWorkflow = new AgentWorkflow('State Demo')
    .step('validate', {
      agent: 'did:somnia:validator',
      intent: 'validate',
      task: { data: { amount: 1000 } },
    })
    .then('process', {
      agent: 'did:somnia:processor',
      intent: 'process',
      task: {
        // This task will receive 'validate_result' from previous step
      },
      retries: 1,
    });

  processAttempts = 10; // Skip failures for this example

  const result3 = await orchestrator.execute(stateWorkflow.build(), {
    sessionId,
    initialState: {
      userId: 'user_789',
      operation: 'transfer',
    },
    onStepComplete: (result) => {
      console.log(`   📦 Step data:`, result.data);
    },
  });

  console.log(`\n📊 Final Workflow State:`);
  result3.context.state.forEach((value, key) => {
    console.log(`   ${key}:`, value);
  });

  console.log(`\n✅ State management demo completed\n`);

  // ===== Example 4: Complex Multi-Stage Workflow =====

  console.log('📝 Example 4: Complex Multi-Stage Workflow\n');

  const complexWorkflow = new AgentWorkflow('Complex Pipeline')
    .description('Multi-stage validation and processing')
    .timeout(60000)
    
    // Stage 1: Validation
    .step('validate_input', {
      agent: 'did:somnia:validator',
      intent: 'validate',
      task: { data: { amount: 2500 } },
    })
    
    // Stage 2: Processing
    .then('process_transaction', {
      agent: 'did:somnia:processor',
      intent: 'process',
      task: {},
      retries: 2,
    })
    
    // Stage 3: Parallel notifications
    .parallel([
      {
        agent: 'did:somnia:notifier',
        intent: 'notify',
        task: { message: 'Transaction processed', channel: 'email' },
      },
      {
        agent: 'did:somnia:notifier',
        intent: 'notify',
        task: { message: 'Transaction processed', channel: 'sms' },
      },
      {
        agent: 'did:somnia:notifier',
        intent: 'notify',
        task: { message: 'Transaction processed', channel: 'webhook' },
      },
    ])
    
    // Global error handler
    .onAnyError({
      agent: 'did:somnia:cleanup',
      intent: 'cleanup',
      task: { fullRollback: true },
    });

  processAttempts = 10; // Ensure success

  const result4 = await orchestrator.execute(complexWorkflow.build());

  console.log(`\n✅ Complex workflow completed`);
  console.log(`   Steps: ${result4.steps.length}`);
  console.log(`   Completed: ${result4.steps.filter(s => s.status === WorkflowStepStatus.COMPLETED).length}`);
  console.log(`   Duration: ${result4.duration}ms\n`);

  // ===== Cleanup =====

  console.log('🧹 Cleaning up...\n');

  await validator.shutdown();
  await processor.shutdown();
  await notifier.shutdown();
  await cleanup.shutdown();

  console.log('✨ Advanced example complete!\n');
  process.exit(0);
}

main().catch(console.error);
