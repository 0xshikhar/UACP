# UACP SDK Quick Start Guide

## Setup

### 1. Install Dependencies

```bash
cd sdk
npm install
```

### 2. Build the SDK

```bash
npm run build
```

## Running Your First Agent

### Step 1: Start the Echo Agent

Open a terminal and run:

```bash
npx tsx examples/simple-agent.ts
```

You should see:

```
🚀 Echo Agent is running!
📍 Endpoint: http://localhost:4000/a2a
💚 Health: http://localhost:4000/health
🎴 Card: http://localhost:4000/card
```

### Step 2: Test the Agent

In another terminal, test the health endpoint:

```bash
curl http://localhost:4000/health
```

Get the agent card:

```bash
curl http://localhost:4000/card
```

Send a message to the agent:

```bash
curl -X POST http://localhost:4000/a2a \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": 1234567890000,
    "sender": "did:somnia:test-client",
    "recipient": "did:somnia:echo-agent-001",
    "intent": "echo",
    "task": {
      "message": "Hello, UACP!"
    },
    "type": "request",
    "priority": "medium"
  }'
```

### Step 3: Run the Client Agent

In a third terminal:

```bash
npx tsx examples/client-agent.ts
```

This will automatically send messages to the echo agent and display the responses.

## Creating Your Own Agent

### 1. Create a New Agent File

Create `my-agent.ts`:

```typescript
import { UACPAgent, AgentEvent } from './src/index.js';

const agent = new UACPAgent({
  agentCard: {
    id: 'did:somnia:my-custom-agent',
    name: 'My Custom Agent',
    description: 'Does amazing things',
    endpoint: 'http://localhost:5000',
    capabilities: ['custom_action'],
    auth: { type: 'none' },
    version: '1.0.0',
  },
  port: 5000,
  logLevel: 'info',
});

// Add your custom logic
agent.onIntent('custom_action', async (task, context) => {
  console.log('Received task:', task);
  
  // Your business logic here
  const result = await processTask(task);
  
  return {
    success: true,
    data: result,
  };
});

async function processTask(task: any) {
  // Your implementation
  return { processed: true, data: task };
}

// Start the agent
async function main() {
  await agent.initialize();
  await agent.register();
  await agent.listen();
  
  console.log('✅ My Custom Agent is ready!');
}

main();
```

### 2. Run Your Agent

```bash
npx tsx my-agent.ts
```

## Common Patterns

### Pattern 1: Agent with Multiple Intents

```typescript
agent.onIntent('intent1', async (task, context) => {
  // Handle intent1
  return { success: true, data: {} };
});

agent.onIntent('intent2', async (task, context) => {
  // Handle intent2
  return { success: true, data: {} };
});

agent.onIntent('intent3', async (task, context) => {
  // Handle intent3
  return { success: true, data: {} };
});
```

### Pattern 2: Agent Communication Chain

```typescript
// Agent A sends to Agent B, which sends to Agent C
agent.onIntent('process', async (task, context) => {
  // Process locally
  const localResult = await processLocally(task);
  
  // Forward to another agent
  const response = await agent.sendMessage({
    recipient: 'did:somnia:agent-b',
    intent: 'continue_processing',
    task: { data: localResult },
  });
  
  return {
    success: true,
    data: response.data,
  };
});
```

### Pattern 3: Error Handling

```typescript
agent.onIntent('risky_operation', async (task, context) => {
  try {
    const result = await riskyOperation(task);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});
```

### Pattern 4: Payment Required

```typescript
agent.onIntent('premium_feature', async (task, context) => {
  // Check if payment was provided
  if (!context.payment) {
    return {
      success: false,
      requiresPayment: true,
      paymentRequirements: {
        scheme: 'exact',
        network: 'somnia',
        asset: '0xUSDC_ADDRESS',
        payTo: '0xYOUR_WALLET',
        maxAmountRequired: '1000000',
        resource: '/premium_feature',
        description: 'Premium feature access',
      },
    };
  }
  
  // Payment verified, provide service
  const result = await providePremiumFeature(task);
  return { success: true, data: result };
});
```

## Development Workflow

### 1. Development Mode

Run TypeScript directly without building:

```bash
npx tsx examples/simple-agent.ts
```

### 2. Build and Run

```bash
npm run build
node dist/examples/simple-agent.js
```

### 3. Watch Mode

For development with auto-rebuild:

```bash
npm run dev
```

## Testing Your Agents

### Using curl

```bash
# Health check
curl http://localhost:4000/health

# Get agent card
curl http://localhost:4000/card

# Send message
curl -X POST http://localhost:4000/a2a \
  -H "Content-Type: application/json" \
  -d @message.json
```

### Using the Client Agent

Modify `examples/client-agent.ts` to test your agent:

```typescript
const response = await clientAgent.sendMessage({
  recipient: 'did:somnia:your-agent',
  intent: 'your_intent',
  task: { /* your data */ },
});
```

## Troubleshooting

### Port Already in Use

Change the port in your agent config:

```typescript
port: 5000, // Use a different port
```

### Agent Not Found

Make sure both agents are registered:

```typescript
await agent.register();
```

### Message Validation Errors

Ensure your message follows the A2A format with all required fields.

### Connection Refused

Make sure the recipient agent is running and listening on the correct port.

## Next Steps

1. **Add More Intents**: Expand your agent's capabilities
2. **Implement Discovery**: Use the registry to find other agents
3. **Add Payments**: Integrate X402 for paid services
4. **Deploy**: Deploy your agents to production
5. **Monitor**: Add logging and monitoring

## Resources

- [Full Documentation](./README.md)
- [Implementation Plan](../IMPLEMENTATION_PLAN.md)
- [Project Idea](../ProjectIdea.md)

## Getting Help

- Check the examples in `examples/`
- Review the type definitions in `src/types/`
- Read the implementation in `src/`

Happy building! 🚀
