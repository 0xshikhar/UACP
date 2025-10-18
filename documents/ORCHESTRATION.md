# Agent Orchestration System

The UACP SDK now includes a powerful **AgentOrchestrator** for building complex multi-agent workflows with declarative syntax, dependency management, parallel execution, and state persistence.

## 🎯 Key Features

### ✅ Declarative Workflow Builder
Define complex workflows using a fluent, chainable API

### ✅ Dependency Resolution (DAG)
Automatic topological sorting and execution ordering

### ✅ Parallel Execution
Execute independent steps concurrently for better performance

### ✅ State Management
Maintain context and session data across workflow steps

### ✅ Error Handling & Rollback
Automatic rollback on failures with custom error handlers

### ✅ Retry Logic
Built-in retry mechanism with exponential backoff

### ✅ Event System
Subscribe to workflow events for monitoring and debugging

### ✅ Context Passing
Automatically pass results between dependent steps

---

## 📖 Quick Start

### Basic Workflow

```typescript
import {
  AgentWorkflow,
  AgentOrchestrator,
  AgentRegistry,
  MessageRouter,
} from '@uacp/somnia-sdk';

// Setup
const registry = new AgentRegistry({ type: 'memory' });
const router = new MessageRouter(registry);
const orchestrator = new AgentOrchestrator(
  'did:somnia:orchestrator',
  registry,
  router
);

// Define workflow
const workflow = new AgentWorkflow('My First Workflow')
  .step('fetch_data', {
    agent: 'did:somnia:data-agent',
    intent: 'fetch',
    task: { source: 'api' },
  })
  .then('process_data', {
    agent: 'did:somnia:processor',
    intent: 'process',
    task: {},
  })
  .then('notify', {
    agent: 'did:somnia:notifier',
    intent: 'notify',
    task: { message: 'Done!' },
  });

// Execute
const result = await orchestrator.execute(workflow.build());
console.log('Status:', result.status);
console.log('Duration:', result.duration);
```

---

## 🔧 API Reference

### AgentWorkflow

Declarative workflow builder with fluent API.

#### Methods

##### `step(stepId, config)`
Add a step to the workflow

```typescript
workflow.step('step1', {
  agent: 'did:somnia:agent-id',
  intent: 'intent_name',
  task: { /* task data */ },
  dependsOn: ['other_step'], // Optional
  timeout: 30000, // Optional
  retries: 3, // Optional
  optional: false, // Optional
});
```

##### `then(stepId, config)`
Chain a step that depends on the previous step

```typescript
workflow
  .step('step1', { agent: 'agent1', intent: 'action1' })
  .then('step2', { agent: 'agent2', intent: 'action2' }); // Depends on step1
```

##### `parallel(steps, options?)`
Execute multiple steps in parallel

```typescript
workflow.parallel([
  { agent: 'agent1', intent: 'action1', task: {} },
  { agent: 'agent2', intent: 'action2', task: {} },
  { agent: 'agent3', intent: 'action3', task: {} },
], {
  waitForAll: true, // Wait for all (default) or first to complete
  continueOnError: false, // Continue if a parallel step fails
});
```

##### `onError(stepId, rollbackConfig)`
Add error handler for a specific step

```typescript
workflow
  .step('risky_operation', { /* ... */ })
  .onError('risky_operation', {
    agent: 'did:somnia:cleanup',
    intent: 'rollback',
    task: { reason: 'operation_failed' },
  });
```

##### `onAnyError(rollbackConfig)`
Add global error handler for all steps

```typescript
workflow.onAnyError({
  agent: 'did:somnia:error-handler',
  intent: 'handle_error',
  task: { notify: true },
});
```

##### `timeout(milliseconds)`
Set workflow timeout

```typescript
workflow.timeout(60000); // 1 minute
```

##### `retry(maxRetries)`
Set retry count for current step

```typescript
workflow
  .step('flaky_step', { /* ... */ })
  .retry(5); // Retry up to 5 times
```

##### `optional()`
Mark current step as optional (won't fail workflow)

```typescript
workflow
  .step('optional_step', { /* ... */ })
  .optional();
```

##### `build()`
Build and validate the workflow definition

```typescript
const workflowDef = workflow.build();
```

---

### AgentOrchestrator

Executes workflows with dependency resolution and state management.

#### Constructor

```typescript
const orchestrator = new AgentOrchestrator(
  senderId: string,
  registry: AgentRegistry,
  router: MessageRouter
);
```

#### Methods

##### `execute(workflow, options?)`
Execute a workflow

```typescript
const result = await orchestrator.execute(workflowDef, {
  sessionId: 'session_123',
  initialState: { userId: 'user_456' },
  timeout: 300000,
  metadata: { source: 'api' },
  onStepComplete: (result) => {
    console.log('Step completed:', result.stepId);
  },
  onStepError: (stepId, error) => {
    console.error('Step failed:', stepId, error);
  },
  continueOnError: false,
});
```

#### Event Listeners

```typescript
orchestrator.on(WorkflowEvent.STARTED, (data) => {
  console.log('Workflow started:', data.workflowId);
});

orchestrator.on(WorkflowEvent.STEP_COMPLETED, (result) => {
  console.log('Step completed:', result.stepId);
});

orchestrator.on(WorkflowEvent.COMPLETED, (result) => {
  console.log('Workflow completed:', result.status);
});

orchestrator.on(WorkflowEvent.FAILED, (result) => {
  console.error('Workflow failed:', result.error);
});
```

#### Available Events

- `WorkflowEvent.STARTED` - Workflow execution started
- `WorkflowEvent.STEP_STARTED` - Step execution started
- `WorkflowEvent.STEP_COMPLETED` - Step completed successfully
- `WorkflowEvent.STEP_FAILED` - Step failed
- `WorkflowEvent.PARALLEL_GROUP_STARTED` - Parallel group started
- `WorkflowEvent.PARALLEL_GROUP_COMPLETED` - Parallel group completed
- `WorkflowEvent.COMPLETED` - Workflow completed
- `WorkflowEvent.FAILED` - Workflow failed
- `WorkflowEvent.ROLLED_BACK` - Workflow rolled back

---

### ContextManager

Manages session state across agent interactions.

#### Constructor

```typescript
const contextManager = new ContextManager({
  type: 'memory', // or 'redis'
  ttl: 3600, // Session TTL in seconds
  maxSessions: 1000,
  redisUrl: 'redis://localhost:6379', // If using Redis
});
```

#### Methods

##### `createSession(metadata?)`
Create a new session

```typescript
const sessionId = await contextManager.createSession({
  userId: 'user_123',
  plan: 'premium',
});
```

##### `getSession(sessionId)`
Get session data

```typescript
const session = await contextManager.getSession(sessionId);
```

##### `get(sessionId, key)` / `set(sessionId, key, value)`
Get/set session state variables

```typescript
await contextManager.set(sessionId, 'userName', 'Alice');
const name = await contextManager.get(sessionId, 'userName');
```

##### `deleteSession(sessionId)`
Delete a session

```typescript
await contextManager.deleteSession(sessionId);
```

---

### ConversationContext

Maintains conversation history for multi-turn interactions.

#### Constructor

```typescript
const conversation = new ConversationContext(sessionId, contextManager);
```

#### Methods

##### `addMessage(role, message)`
Add message to conversation history

```typescript
await conversation.addMessage('user', 'Hello, agent!');
await conversation.addMessage('agent', 'Hi! How can I help?');
```

##### `getHistory()`
Get conversation history

```typescript
const history = await conversation.getHistory();
```

##### `setVariable(key, value)` / `getVariable(key)`
Set/get context variables

```typescript
await conversation.setVariable('language', 'en');
const lang = await conversation.getVariable('language');
```

---

## 💡 Common Patterns

### Pattern 1: DeFi Workflow

```typescript
const defiWorkflow = new AgentWorkflow('DeFi Operations')
  .step('check_balance', {
    agent: 'did:somnia:wallet',
    intent: 'get_balance',
    task: { token: 'ETH' },
  })
  .then('fetch_price', {
    agent: 'did:somnia:oracle',
    intent: 'get_price',
    task: { pair: 'ETH/USDC' },
  })
  .then('execute_swap', {
    agent: 'did:somnia:dex',
    intent: 'swap',
    task: { amount: 1.0 },
    retries: 2,
  })
  .parallel([
    { agent: 'did:somnia:notifier', intent: 'notify' },
    { agent: 'did:somnia:logger', intent: 'log' },
  ])
  .onError('execute_swap', {
    agent: 'did:somnia:treasury',
    intent: 'refund',
  });
```

### Pattern 2: Data Pipeline

```typescript
const pipeline = new AgentWorkflow('ETL Pipeline')
  .step('extract', {
    agent: 'did:somnia:extractor',
    intent: 'extract',
    task: { source: 'database' },
  })
  .then('transform', {
    agent: 'did:somnia:transformer',
    intent: 'transform',
    task: { rules: ['normalize', 'validate'] },
  })
  .then('load', {
    agent: 'did:somnia:loader',
    intent: 'load',
    task: { destination: 'warehouse' },
  });
```

### Pattern 3: Multi-Stage Approval

```typescript
const approval = new AgentWorkflow('Approval Flow')
  .step('validate', {
    agent: 'did:somnia:validator',
    intent: 'validate',
    task: { document: 'contract.pdf' },
  })
  .parallel([
    { agent: 'did:somnia:legal', intent: 'review' },
    { agent: 'did:somnia:finance', intent: 'review' },
    { agent: 'did:somnia:technical', intent: 'review' },
  ], { waitForAll: true })
  .then('final_approval', {
    agent: 'did:somnia:manager',
    intent: 'approve',
    task: {},
  });
```

### Pattern 4: Fan-Out/Fan-In

```typescript
const fanOut = new AgentWorkflow('Fan-Out Pattern')
  .step('prepare', {
    agent: 'did:somnia:prep',
    intent: 'prepare',
    task: { items: ['a', 'b', 'c'] },
  })
  .parallel([
    { agent: 'did:somnia:worker1', intent: 'process' },
    { agent: 'did:somnia:worker2', intent: 'process' },
    { agent: 'did:somnia:worker3', intent: 'process' },
  ])
  .then('aggregate', {
    agent: 'did:somnia:aggregator',
    intent: 'aggregate',
    task: {},
  });
```

---

## 🔍 Debugging

### Enable Verbose Logging

```typescript
const orchestrator = new AgentOrchestrator(/* ... */);

orchestrator.on(WorkflowEvent.STEP_STARTED, (data) => {
  console.log(`[DEBUG] Step started: ${data.stepId}`);
});

orchestrator.on(WorkflowEvent.STEP_COMPLETED, (result) => {
  console.log(`[DEBUG] Step completed: ${result.stepId}`);
  console.log(`[DEBUG] Result:`, result.data);
  console.log(`[DEBUG] Duration: ${result.duration}ms`);
  console.log(`[DEBUG] Attempts: ${result.attempts}`);
});
```

### Inspect Workflow State

```typescript
const result = await orchestrator.execute(workflow);

// View all step results
console.log('Steps:', result.steps);

// View workflow state
result.context.state.forEach((value, key) => {
  console.log(`${key}:`, value);
});

// View specific step result
const stepResult = result.steps.find(s => s.stepId === 'my_step');
console.log('Step data:', stepResult?.data);
```

---

## 🚀 Performance Tips

1. **Use Parallel Execution**: For independent tasks, use `.parallel()` to reduce total execution time
2. **Set Appropriate Timeouts**: Avoid hanging workflows with reasonable timeouts
3. **Optimize Retry Logic**: Use retries for transient failures, not logic errors
4. **Session Cleanup**: Set appropriate TTL for sessions to avoid memory leaks
5. **Limit Workflow Size**: Break large workflows into sub-workflows

---

## 📚 Examples

See the `examples/` directory for complete working examples:

- **orchestrator-simple.ts** - Basic workflow patterns
- **orchestrator-defi.ts** - DeFi workflow with parallel execution
- **orchestrator-advanced.ts** - Retry logic, callbacks, and state management

Run examples:

```bash
cd sdk
npx tsx examples/orchestrator-simple.ts
npx tsx examples/orchestrator-defi.ts
npx tsx examples/orchestrator-advanced.ts
```

---

## 🎉 Benefits

### For Agent Developers

- **No boilerplate**: Focus on agent logic, not orchestration
- **Declarative syntax**: Easy to understand and maintain workflows
- **Type-safe**: Full TypeScript support with IntelliSense
- **Testable**: Mock agents and test workflows in isolation

### For System Architects

- **Composability**: Build complex systems from simple agents
- **Reliability**: Built-in retry, error handling, and rollback
- **Observability**: Rich event system for monitoring
- **Scalability**: Parallel execution and efficient routing

### For Users

- **Consistency**: Standardized workflow execution
- **Transparency**: Clear execution history and state
- **Reliability**: Automatic error recovery
- **Performance**: Optimized execution with parallelization

---

## 🔮 Future Enhancements

- [ ] Workflow versioning and migrations
- [ ] Conditional branching (if/else logic)
- [ ] Loop constructs (for/while)
- [ ] Sub-workflow composition
- [ ] Workflow templates and presets
- [ ] Visual workflow designer
- [ ] Workflow analytics and insights
- [ ] Distributed workflow execution
- [ ] Workflow marketplace

---

## 📝 License

Part of UACP SDK - Universal Agent Communication Protocol for Somnia
