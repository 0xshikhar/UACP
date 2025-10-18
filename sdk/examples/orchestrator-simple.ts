/**
 * Simple Orchestration Example
 * 
 * This example shows basic workflow usage with context management
 */

import {
  UACPAgent,
  AgentWorkflow,
  AgentOrchestrator,
  AgentRegistry,
  MessageRouter,
  ContextManager,
  ConversationContext,
  AgentStatus,
} from '../src/index.js';

async function main() {
  console.log('🎯 Simple Orchestration Example\n');

  // Setup
  const registry = new AgentRegistry({ type: 'memory' });
  const router = new MessageRouter(registry);
  const contextManager = new ContextManager();

  // Create a simple processing agent
  const processor = new UACPAgent({
    agentCard: {
      id: 'did:somnia:processor',
      name: 'Data Processor',
      description: 'Processes data',
      endpoint: 'http://localhost:5001',
      capabilities: ['process', 'transform'],
      auth: { type: 'none' },
      paymentMethods: [],
      status: AgentStatus.ONLINE,
      version: '1.0.0',
    },
    port: 5001,
  });

  processor.onIntent('process', async (task) => {
    const { data } = task;
    console.log(`⚙️  Processing: ${data}`);
    
    return {
      success: true,
      data: { processed: data.toUpperCase(), timestamp: Date.now() },
    };
  });

  processor.onIntent('transform', async (task) => {
    const { value } = task;
    console.log(`🔄 Transforming: ${value}`);
    
    return {
      success: true,
      data: { transformed: value * 2, timestamp: Date.now() },
    };
  });

  await processor.initialize();
  await processor.register();
  processor.listen(5001);

  // Wait for agent
  await new Promise(resolve => setTimeout(resolve, 500));

  // Create orchestrator
  const orchestrator = new AgentOrchestrator(
    'did:somnia:main',
    registry,
    router
  );

  // ===== Example 1: Simple Sequential Workflow =====
  
  console.log('📝 Example 1: Sequential Workflow\n');

  const simpleWorkflow = new AgentWorkflow('Simple Pipeline')
    .step('step1', {
      agent: 'did:somnia:processor',
      intent: 'process',
      task: { data: 'hello' },
    })
    .step('step2', {
      agent: 'did:somnia:processor',
      intent: 'transform',
      task: { value: 42 },
      dependsOn: ['step1'],
    });

  const result1 = await orchestrator.execute(simpleWorkflow.build());
  
  console.log(`\n✅ Result:`, result1.status);
  console.log(`Duration: ${result1.duration}ms\n`);

  // ===== Example 2: Workflow with Context =====
  
  console.log('📝 Example 2: Workflow with Session Context\n');

  const sessionId = await contextManager.createSession({
    userId: 'user_456',
    plan: 'premium',
  });

  const conversation = new ConversationContext(sessionId, contextManager);
  
  // Set context variables
  await conversation.setVariable('userName', 'Alice');
  await conversation.addMessage('user', 'Process my data');

  const contextWorkflow = new AgentWorkflow('Context Demo')
    .step('greet', {
      agent: 'did:somnia:processor',
      intent: 'process',
      task: { data: 'greeting' },
    })
    .then('respond', {
      agent: 'did:somnia:processor',
      intent: 'process',
      task: { data: 'response' },
    });

  const result2 = await orchestrator.execute(contextWorkflow.build(), {
    sessionId,
    initialState: {
      userName: await conversation.getVariable('userName'),
    },
  });

  await conversation.addMessage('agent', 'Data processed successfully');

  console.log(`\n✅ Session ID: ${sessionId}`);
  console.log(`History:`, await conversation.getHistory());
  console.log(`\n`);

  // ===== Example 3: Parallel Execution =====
  
  console.log('📝 Example 3: Parallel Execution\n');

  const parallelWorkflow = new AgentWorkflow('Parallel Tasks')
    .parallel([
      {
        agent: 'did:somnia:processor',
        intent: 'process',
        task: { data: 'task1' },
      },
      {
        agent: 'did:somnia:processor',
        intent: 'process',
        task: { data: 'task2' },
      },
      {
        agent: 'did:somnia:processor',
        intent: 'transform',
        task: { value: 100 },
      },
    ]);

  const result3 = await orchestrator.execute(parallelWorkflow.build());
  
  console.log(`\n✅ Parallel tasks completed in ${result3.duration}ms`);
  console.log(`Steps executed: ${result3.steps.length}\n`);

  // ===== Example 4: Error Handling =====
  
  console.log('📝 Example 4: Error Handling (Optional Steps)\n');

  const errorWorkflow = new AgentWorkflow('Error Demo')
    .step('required', {
      agent: 'did:somnia:processor',
      intent: 'process',
      task: { data: 'important' },
    })
    .step('optional', {
      agent: 'did:somnia:non-existent', // This will fail
      intent: 'process',
      task: { data: 'optional' },
      optional: true, // Mark as optional
    })
    .step('final', {
      agent: 'did:somnia:processor',
      intent: 'process',
      task: { data: 'final' },
      dependsOn: ['required'], // Only depends on required step
    });

  try {
    const result4 = await orchestrator.execute(errorWorkflow.build());
    console.log(`\n✅ Workflow completed despite optional step failure`);
    console.log(`Completed steps: ${result4.steps.filter(s => s.status === 'completed').length}`);
    console.log(`Failed steps: ${result4.steps.filter(s => s.status === 'failed').length}\n`);
  } catch (error) {
    console.log(`❌ Workflow failed:`, (error as Error).message);
  }

  // ===== Cleanup =====
  
  console.log('🧹 Cleaning up...\n');
  await processor.shutdown();
  console.log('✨ Example complete!\n');
  
  process.exit(0);
}

main().catch(console.error);
