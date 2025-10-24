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

## Running Your First Agent Interaction

This example demonstrates two agents communicating: an **Echo Agent** (server) and a **Client Agent**.

### ⚠️ IMPORTANT: Order Matters!

You **MUST** start the echo agent FIRST before running the client agent. The client agent will fail if the echo agent is not running.

### Step 1: Start the Registry Server

**Open Terminal 1** and run:

```bash
npx tsx examples/registry-server.ts
```

You should see output like:

```
🏛️  Initializing Registry Server...


🏛️  Registry Server is running!
📍 URL: http://localhost:3000
💚 Health: http://localhost:3000/health
📋 List agents: http://localhost:3000/registry/agents
```

**✅ Keep this terminal running!** The echo agent must stay active.

### Step 2: Test the Echo Agent (Optional)

**Open Terminal 2** to test the agent manually:

Test health endpoint:
```bash
npx tsx examples/echo-agent-http.ts
```

### Step 3: Run the Client Agent

**Make sure Echo Agent (Terminal 1) is still running!**

**Open Terminal 3** (or use Terminal 2 if you skipped the optional test):

```bash
npx tsx examples/client-agent-http.ts
```

You should see successful output:

```

🚀 Client Agent is running with HTTP REGISTRY on port 4001
🏛️  Registry: http://localhost:3000

📋 Listing all agents in registry...
Found 2 agents:
  - Echo Agent (did:somnia:echo-agent-001) at http://localhost:4000
  - Client Agent (did:somnia:client-agent-001) at http://localhost:4001

📤 Sending echo message to did:somnia:echo-agent-001...
   1. Looking up agent in HTTP registry...
   2. Found agent at http://localhost:4000
   3. Sending message...
   4. Received response:
      {
        "success": true,
        "data": {
          "echo": "Hello from echo agent!",
          "receivedAt": 1234567890000,
          "sender": "did:somnia:echo-agent-001",
          "message": "Echo: Hello from echo agent!"
        }
      }

✅ Client agent will keep running. Press Ctrl+C to exit.
```

### Troubleshooting

#### Error: "Agent not found: did:somnia:echo-agent-001"

**Problem:** The echo agent is not running.

**Solution:** 
1. Make sure you started `echo-agent.ts` in Step 1
2. Check that Terminal 1 with the echo agent is still running
3. If you closed it, restart the echo agent first

#### Error: "EADDRINUSE: address already in use"

**Problem:** Port 4000 or 4001 is already in use.

**Solution:**
```bash
# Find what's using the port
lsof -i :4000
lsof -i :4001

# Kill the process
kill -9 <PID>
```

#### Connection Refused / Network Errors

**Problem:** The agents can't communicate.

**Solution:**
1. Make sure both agents are running
2. Check firewall settings
3. Verify the ports are correct (4000 for echo, 4001 for client)

## Creating Your Own Agent

### 1. Create a New Agent File

Create `my-agent.ts`:

```typescript
import { UACPAgent, AgentEvent } from './src/index.js';

async function main() {
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

  // Add your custom intent handler
  agent.onIntent('custom_action', async (task, context) => {
    console.log('Received task:', task);
    
    // Your business logic here
    const result = await processTask(task);
    
    return {
      success: true,
      data: result,
    };
  });

  // Listen to events
  agent.on(AgentEvent.MESSAGE_RECEIVED, (message) => {
    console.log('📨 Message received:', message);
  });

  // Start the agent
  await agent.initialize();
  await agent.register();
  await agent.listen();
  
  console.log('✅ My Custom Agent is ready on port 5000!');
}

async function processTask(task: any) {
  // Your implementation
  return { processed: true, data: task };
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
// Agent A sends to Agent B
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

## Development Workflow

### 1. Development Mode

Run TypeScript directly without building:

```bash
npx tsx examples/echo-agent.ts
```

### 2. Build and Run

```bash
npm run build
node dist/examples/echo-agent.js
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

## Next Steps

1. **Add More Intents**: Expand your agent's capabilities
2. **Implement Discovery**: Use the registry to find other agents
3. **Add Payments**: Integrate X402 for paid services (see `examples/payment-agent.ts`)
4. **Deploy**: Deploy your agents to production
5. **Monitor**: Add logging and monitoring

## Example Files

- `examples/echo-agent.ts` - Simple echo server agent
- `examples/client-agent.ts` - Client that sends messages
- `examples/simple-agent.ts` - Another echo agent example
- `examples/payment-agent.ts` - Agent with X402 payments
- `examples/payment-client.ts` - Client for payment testing
- `examples/orchestrator-simple.ts` - Basic orchestrator
- `examples/orchestrator-advanced.ts` - Advanced orchestration
- `examples/orchestrator-defi.ts` - DeFi use case example

## Resources

- [Full Documentation](./README.md)
- [Implementation Plan](../IMPLEMENTATION_PLAN.md)
- [Project Idea](../ProjectIdea.md)

## Getting Help

- Check the examples in `examples/`
- Review the type definitions in `src/types/`
- Read the implementation in `src/`

Happy building! 🚀
