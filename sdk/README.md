# UACP SDK - Universal Agent Communication Protocol for Somnia

A TypeScript SDK for building agent-to-agent communication systems using the A2A protocol with X402 payment integration on Somnia.

## Features

- 🤖 **Agent Framework**: Easy-to-use agent creation and management
- 📨 **A2A Protocol**: Google A2A-compliant message format
- 💰 **Payment Integration**: X402 payment protocol support (coming soon)
- 🔍 **Agent Discovery**: Built-in registry for agent discovery
- 🔄 **Message Routing**: Intelligent routing with retry and circuit breaker patterns
- 📊 **Event System**: Comprehensive event emitter for agent lifecycle
- 🛡️ **Type Safety**: Full TypeScript support with Zod validation
- 🧪 **Testing**: Built-in testing utilities

## Installation

```bash
npm install @uacp/somnia-sdk
```

## Quick Start

### 1. Create a Simple Agent

```typescript
import { UACPAgent, AgentEvent } from '@uacp/somnia-sdk';

const agent = new UACPAgent({
  agentCard: {
    id: 'did:somnia:my-agent-001',
    name: 'My Agent',
    description: 'My first UACP agent',
    endpoint: 'http://localhost:4000',
    capabilities: ['echo', 'process'],
    auth: { type: 'none' },
    version: '1.0.0',
  },
  port: 4000,
  logLevel: 'info',
});

// Register intent handlers
agent.onIntent('echo', async (task, context) => {
  return {
    success: true,
    data: { echo: task.message },
  };
});

// Listen to events
agent.on(AgentEvent.MESSAGE_RECEIVED, (message) => {
  console.log('Message received:', message.intent);
});

// Start the agent
await agent.initialize();
await agent.register();
await agent.listen();
```

### 2. Send Messages Between Agents

```typescript
// Send a message to another agent
const response = await agent.sendMessage({
  recipient: 'did:somnia:other-agent-001',
  intent: 'process_data',
  task: {
    data: 'Hello, World!',
  },
});

console.log('Response:', response.data);
```

## Core Concepts

### Agent Card

An `AgentCard` is the identity and capability descriptor for an agent:

```typescript
{
  id: 'did:somnia:agent-name',        // DID format identifier
  name: 'Agent Name',                  // Human-readable name
  description: 'What this agent does', // Description
  endpoint: 'http://localhost:4000',   // HTTP endpoint for A2A
  capabilities: ['cap1', 'cap2'],      // List of capabilities
  auth: { type: 'none' },              // Authentication config
  status: 'online',                    // Current status
  version: '1.0.0'                     // Agent version
}
```

### A2A Messages

Messages follow the A2A protocol format:

```typescript
{
  id: 'uuid',                          // Unique message ID
  timestamp: 1234567890,               // Unix timestamp
  sender: 'did:somnia:sender',         // Sender DID
  recipient: 'did:somnia:recipient',   // Recipient DID
  intent: 'action_name',               // What to do
  task: { /* data */ },                // Task payload
  type: 'request',                     // Message type
  priority: 'medium',                  // Priority level
  ttl: 60                              // Time to live (seconds)
}
```

### Intent Handlers

Register handlers for specific intents:

```typescript
agent.onIntent('calculate', async (task, context) => {
  const result = task.a + task.b;
  
  return {
    success: true,
    data: { result },
  };
});
```

### Payment Required (X402)

Return payment requirements from an intent handler:

```typescript
agent.onIntent('premium_feature', async (task, context) => {
  return {
    success: false,
    requiresPayment: true,
    paymentRequirements: {
      scheme: 'exact',
      network: 'somnia',
      asset: '0x...', // USDC address
      payTo: '0x...', // Your wallet
      maxAmountRequired: '1000000', // 1 USDC
      resource: '/premium_feature',
      description: 'Access to premium feature',
    },
  };
});
```

## Agent Events

Listen to agent lifecycle events:

```typescript
agent.on(AgentEvent.INITIALIZED, (data) => {
  console.log('Agent initialized');
});

agent.on(AgentEvent.REGISTERED, (data) => {
  console.log('Agent registered');
});

agent.on(AgentEvent.MESSAGE_RECEIVED, (message) => {
  console.log('Message received:', message);
});

agent.on(AgentEvent.MESSAGE_SENT, (message) => {
  console.log('Message sent:', message);
});

agent.on(AgentEvent.PAYMENT_REQUIRED, (data) => {
  console.log('Payment required:', data);
});

agent.on(AgentEvent.ERROR, (error) => {
  console.error('Error:', error);
});
```

## Agent Discovery

Find other agents using the registry:

```typescript
const registry = agent.getRegistry();

// Find agents by capability
const agents = await registry.findAgentsByCapability('payment');

// Find agents by type
const defiAgents = await registry.findAgentsByType('defi');

// Get specific agent
const agent = await registry.getAgent('did:somnia:agent-001');

// List all agents
const allAgents = await registry.listAgents();
```

## Examples

Check the `examples/` directory for complete examples:

- `simple-agent.ts` - Basic echo agent
- `client-agent.ts` - Client that sends messages

### Running Examples

```bash
# Terminal 1: Start the echo agent
npm run dev
npx tsx examples/simple-agent.ts

# Terminal 2: Start the client agent
npx tsx examples/client-agent.ts
```

## API Reference

### UACPAgent

Main agent class for creating and managing agents.

#### Constructor

```typescript
new UACPAgent(config: AgentConfig)
```

#### Methods

- `initialize()` - Initialize the agent
- `register()` - Register with the registry
- `listen(port?)` - Start listening for messages
- `shutdown()` - Gracefully shutdown the agent
- `onIntent(intent, handler)` - Register an intent handler
- `sendMessage(params)` - Send a message to another agent
- `on(event, handler)` - Listen to events
- `getAgentCard()` - Get the agent's card
- `getRegistry()` - Get the registry instance
- `getRouter()` - Get the router instance

### AgentRegistry

Manages agent registration and discovery.

#### Methods

- `registerAgent(card)` - Register a new agent
- `getAgent(id)` - Get agent by ID
- `findAgents(query)` - Find agents by query
- `findAgentsByCapability(capability)` - Find by capability
- `findAgentsByType(type)` - Find by type
- `listAgents()` - List all agents
- `unregisterAgent(id)` - Unregister an agent

### MessageRouter

Handles message routing and delivery.

#### Methods

- `sendMessage(message, options)` - Send a message
- `broadcastMessage(message, recipients, options)` - Broadcast to multiple agents
- `setDefaultTimeout(timeout)` - Set default timeout
- `resetCircuitBreaker(agentId)` - Reset circuit breaker for an agent

## Configuration

### Agent Config

```typescript
interface AgentConfig {
  agentCard: AgentCard;
  registryUrl?: string;
  port?: number;
  enablePayments?: boolean;
  walletPrivateKey?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  retryConfig?: RetryConfig;
}
```

### Retry Config

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UACP SDK Layer                       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Agent      │  │   Registry   │  │   Router     │ │
│  │   Core       │  │   Discovery  │  │   Messaging  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   A2A        │  │   X402       │  │   Utils      │ │
│  │   Protocol   │  │   Payments   │  │   Helpers    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Roadmap

- [x] Core agent framework
- [x] A2A protocol implementation
- [x] Agent registry and discovery
- [x] Message routing with retry
- [x] Circuit breaker pattern
- [ ] X402 payment integration
- [ ] On-chain registry (Somnia)
- [ ] WebSocket support for streaming
- [ ] Agent orchestration
- [ ] Multi-chain support

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
