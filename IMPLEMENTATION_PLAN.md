# UACP SDK Implementation Plan

## Executive Summary

This document outlines the complete implementation plan for building the Universal Agent Communication Protocol (UACP) SDK for Somnia. The SDK will leverage the existing **a2a-x402-typescript library** as a foundation for payment functionality while building custom agent communication and registry features on top.

## Key Architecture Decisions

### 1. Use A2A-X402 Library: **YES**

**Decision**: We will use the `a2a-x402-typescript` library as a dependency for payment functionality.

**Rationale**:
- Battle-tested implementation of X402 payment protocol
- Exception-driven payment flow (`x402PaymentRequiredException`) fits perfectly with our agent communication model
- Provides `processPayment()`, `verifyPayment()`, and `settlePayment()` utilities out of the box
- Supports EVM networks and ERC-20 tokens (compatible with Somnia)
- Reduces development time and potential bugs in payment logic

**Integration Strategy**:
- Import `a2a-x402-typescript` as npm dependency
- Wrap X402 classes in our SDK's payment module (`src/x402.ts`)
- Extend base classes (`x402ServerExecutor`, `x402ClientExecutor`) for agent-specific implementations
- Add Somnia-specific network configurations

### 2. SDK Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UACP SDK Layer                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Agent      │  │   Registry   │  │   Router     │ │
│  │   Core       │  │   Discovery  │  │   Messaging  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   A2A        │  │   X402       │  │   Utils      │ │
│  │   Protocol   │  │   Payments   │  │   Helpers    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                          │                             │
└──────────────────────────┼─────────────────────────────┘
                           │
                ┌──────────▼──────────┐
                │  a2a-x402-typescript │
                │      (npm dep)       │
                └─────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation & Core SDK (Week 1-2)

#### 1.1 Project Setup
- [ ] Initialize TypeScript project with proper tsconfig
- [ ] Set up package.json with dependencies
- [ ] Configure build tooling (esbuild/rollup)
- [ ] Set up testing framework (Jest/Vitest)
- [ ] Configure ESLint and Prettier

**Dependencies**:
```json
{
  "dependencies": {
    "a2a-x402-typescript": "latest",
    "ethers": "^6.x",
    "express": "^4.x",
    "zod": "^3.x",
    "eventemitter3": "^5.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/express": "^4.x",
    "vitest": "^1.x"
  }
}
```

#### 1.2 Core Types & Schemas (`src/types/`)
- [ ] Define `AgentCard` interface
- [ ] Define `A2AMessage` interface
- [ ] Define `PaymentRequirements` interface
- [ ] Define `AgentCapability` types
- [ ] Create Zod schemas for runtime validation

**Key Types**:
```typescript
interface AgentCard {
  id: string; // DID format: did:somnia:agent-name
  name: string;
  description: string;
  endpoint: string; // HTTP endpoint for A2A
  capabilities: string[];
  auth: AuthConfig;
  paymentMethods?: string[];
  status: 'online' | 'offline' | 'busy';
  metadata?: Record<string, any>;
}

interface A2AMessage {
  id: string;
  timestamp: number;
  sender: string;
  recipient: string;
  intent: string;
  task: Record<string, any>;
  context?: string;
  type: 'request' | 'response' | 'event';
  priority?: 'low' | 'medium' | 'high';
  ttl?: number;
  signature?: string;
}
```

#### 1.3 Agent Core (`src/agent.ts`)
- [ ] Implement `UACPAgent` class
- [ ] Agent initialization and configuration
- [ ] Event emitter for agent lifecycle events
- [ ] HTTP server setup for A2A endpoint
- [ ] Request/response handling
- [ ] Intent routing system

**Core API**:
```typescript
class UACPAgent {
  constructor(config: AgentConfig);
  
  // Lifecycle
  async initialize(): Promise<void>;
  async register(): Promise<void>;
  async listen(port?: number): Promise<void>;
  async shutdown(): Promise<void>;
  
  // Messaging
  async sendMessage(message: A2AMessage): Promise<A2AResponse>;
  onIntent(intent: string, handler: IntentHandler): void;
  
  // Events
  on(event: string, handler: Function): void;
  emit(event: string, data: any): void;
}
```

### Phase 2: Registry & Discovery (Week 2)

#### 2.1 Registry Module (`src/registry.ts`)
- [ ] Off-chain registry implementation (in-memory + optional Redis)
- [ ] On-chain registry interface (Somnia smart contract)
- [ ] Agent registration logic
- [ ] Agent discovery APIs
- [ ] Health check and status updates

**Registry API**:
```typescript
class AgentRegistry {
  async registerAgent(card: AgentCard): Promise<void>;
  async updateAgent(id: string, updates: Partial<AgentCard>): Promise<void>;
  async getAgent(id: string): Promise<AgentCard | null>;
  async findAgentsByType(type: string): Promise<AgentCard[]>;
  async findAgentsByCapability(capability: string): Promise<AgentCard[]>;
  async unregisterAgent(id: string): Promise<void>;
}
```

#### 2.2 Smart Contract Integration
- [ ] Create Solidity contract for on-chain registry
- [ ] Implement contract interaction layer
- [ ] Add ethers.js integration for contract calls
- [ ] Event listening for registry changes

### Phase 3: A2A Protocol Implementation (Week 3)

#### 3.1 A2A Module (`src/a2a.ts`)
- [ ] Implement A2A message format
- [ ] Message validation and serialization
- [ ] HTTP transport layer
- [ ] SSE (Server-Sent Events) for streaming responses
- [ ] Message signing and verification
- [ ] Context and workflow management

**A2A Features**:
```typescript
class A2AProtocol {
  // Message handling
  createMessage(params: MessageParams): A2AMessage;
  validateMessage(message: A2AMessage): boolean;
  signMessage(message: A2AMessage, privateKey: string): A2AMessage;
  verifyMessage(message: A2AMessage): boolean;
  
  // Transport
  async sendHTTP(endpoint: string, message: A2AMessage): Promise<Response>;
  createSSEStream(endpoint: string): EventSource;
}
```

#### 3.2 Router Module (`src/router.ts`)
- [ ] Message routing logic
- [ ] Retry mechanism with exponential backoff
- [ ] Circuit breaker pattern for failing agents
- [ ] Request/response correlation
- [ ] Timeout handling
- [ ] Queue management for async operations

### Phase 4: X402 Payment Integration (Week 3-4)

#### 4.1 X402 Wrapper (`src/x402.ts`)
- [ ] Wrap `a2a-x402-typescript` library
- [ ] Extend `x402ServerExecutor` for merchant agents
- [ ] Extend `x402ClientExecutor` for client agents
- [ ] Implement payment verification flow
- [ ] Implement payment settlement flow
- [ ] Add Somnia network configuration

**Payment Integration**:
```typescript
class UACPPaymentServer extends x402ServerExecutor {
  async verifyPayment(
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<boolean>;
  
  async settlePayment(
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<SettlementResult>;
}

class UACPPaymentClient extends x402ClientExecutor {
  async handlePaymentRequired(
    error: x402PaymentRequiredException,
    task: A2AMessage
  ): Promise<PaymentPayload>;
  
  async processPayment(
    requirements: PaymentRequirements,
    wallet: Wallet
  ): Promise<PaymentPayload>;
}
```

#### 4.2 Payment Flow Implementation
- [ ] HTTP 402 response handling
- [ ] Payment requirements parsing
- [ ] Payment payload creation
- [ ] X-PAYMENT header handling
- [ ] Payment verification hooks
- [ ] Settlement confirmation

### Phase 5: Utilities & Error Handling (Week 4)

#### 5.1 Utils Module (`src/utils/`)
- [ ] Logger with configurable levels
- [ ] Crypto utilities (signing, hashing)
- [ ] Validation helpers
- [ ] Retry utilities
- [ ] Rate limiting
- [ ] Error classes and error handling

**Error Hierarchy**:
```typescript
class UACPError extends Error {}
class AgentNotFoundError extends UACPError {}
class MessageValidationError extends UACPError {}
class PaymentRequiredError extends UACPError {}
class RegistryError extends UACPError {}
class NetworkError extends UACPError {}
```

#### 5.2 Monitoring & Observability
- [ ] Event logging
- [ ] Metrics collection (message count, latency, errors)
- [ ] Health check endpoints
- [ ] Debug mode with verbose logging

### Phase 6: Example Agents (Week 5)

#### 6.1 Payment Agent (`agents/payment/`)
- [ ] Implement payment processing logic
- [ ] Handle payment requests via X402
- [ ] Settlement and refund capabilities
- [ ] Transaction history tracking

#### 6.2 DeFi Agent (`agents/defi/`)
- [ ] Price oracle integration
- [ ] Token swap capabilities
- [ ] Liquidity pool interactions
- [ ] Market data queries

#### 6.3 Orchestrator Agent (`agents/orchestrator/`)
- [ ] Multi-agent workflow coordination
- [ ] Task delegation logic
- [ ] Result aggregation
- [ ] Error recovery and fallback

### Phase 7: Testing & Documentation (Week 5-6)

#### 7.1 Testing
- [ ] Unit tests for all modules (>80% coverage)
- [ ] Integration tests for agent communication
- [ ] E2E tests for payment flows
- [ ] Load testing for concurrent agents
- [ ] Mock agents for testing

#### 7.2 Documentation
- [ ] API reference documentation
- [ ] Integration guide
- [ ] Payment flow tutorial
- [ ] Example code snippets
- [ ] Architecture diagrams
- [ ] Troubleshooting guide

### Phase 8: Dashboard (Week 6-7)

#### 8.1 Next.js Dashboard (`dashboard/`)
- [ ] Agent registry viewer
- [ ] Real-time agent status monitoring
- [ ] Message flow visualization
- [ ] Payment transaction history
- [ ] Agent registration UI
- [ ] WebSocket integration for live updates

**Tech Stack**:
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui components
- Lucide icons
- Recharts for visualizations

### Phase 9: Infrastructure & Deployment (Week 7-8)

#### 9.1 Docker Setup (`infra/`)
- [ ] Dockerfile for SDK
- [ ] Docker Compose for multi-agent setup
- [ ] Environment configuration
- [ ] Volume management for persistence

#### 9.2 Deployment
- [ ] Vercel configuration for dashboard
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] NPM package publishing
- [ ] Versioning strategy

## Technical Specifications

### SDK Package Structure

```
@uacp/somnia-sdk/
├── src/
│   ├── index.ts              # Main entry point
│   ├── agent.ts              # UACPAgent class
│   ├── registry.ts           # Registry implementation
│   ├── router.ts             # Message routing
│   ├── a2a.ts                # A2A protocol
│   ├── x402.ts               # X402 payment wrapper
│   ├── agentcard.ts          # AgentCard utilities
│   ├── types/
│   │   ├── agent.ts
│   │   ├── message.ts
│   │   ├── payment.ts
│   │   └── registry.ts
│   └── utils/
│       ├── logger.ts
│       ├── crypto.ts
│       ├── validation.ts
│       ├── retry.ts
│       └── errors.ts
├── tests/
├── examples/
└── docs/
```

### Network Configuration

```typescript
const SOMNIA_CONFIG = {
  chainId: 50311, // Somnia testnet
  rpcUrl: 'https://rpc.somnia.network',
  registryContract: '0x...', // Deploy address
  nativeToken: 'STT',
  supportedTokens: ['USDC', 'USDT', 'DAI']
};
```

### Message Flow Example

```typescript
// Orchestrator sends request to DeFi agent
const orchestrator = new UACPAgent({
  agentCard: {
    id: 'did:somnia:orchestrator-001',
    name: 'Orchestrator',
    endpoint: 'http://localhost:4000/a2a',
    capabilities: ['orchestrate', 'coordinate']
  }
});

// Send message
const response = await orchestrator.sendMessage({
  recipient: 'did:somnia:defi-001',
  intent: 'get_price',
  task: { token: 'USDC', amount: '100' }
});

// Handle payment if required
if (response.status === 402) {
  const payment = await orchestrator.processPayment(
    response.paymentRequirements
  );
  
  const retryResponse = await orchestrator.sendMessage({
    recipient: 'did:somnia:defi-001',
    intent: 'get_price',
    task: { token: 'USDC', amount: '100' },
    payment
  });
}
```

## Success Criteria

### MVP Requirements (End of Week 4)
- ✅ Core SDK with agent creation and messaging
- ✅ Registry with discovery APIs
- ✅ A2A protocol implementation
- ✅ X402 payment integration
- ✅ At least 2 working example agents
- ✅ Basic documentation

### Full Release (End of Week 8)
- ✅ Complete SDK with all features
- ✅ 3+ example agents with different use cases
- ✅ Dashboard with monitoring capabilities
- ✅ Comprehensive documentation
- ✅ Published NPM package
- ✅ Docker deployment setup
- ✅ >80% test coverage

## Risk Mitigation

### Technical Risks
1. **A2A-X402 Library Compatibility**
   - Mitigation: Test integration early, create wrapper layer for abstraction
   
2. **Somnia Network Specifics**
   - Mitigation: Keep network config pluggable, test on testnet early
   
3. **Performance at Scale**
   - Mitigation: Implement rate limiting, connection pooling, load testing

### Timeline Risks
1. **Scope Creep**
   - Mitigation: Stick to MVP features first, add enhancements later
   
2. **Integration Complexity**
   - Mitigation: Modular architecture, clear interfaces between components

## Next Steps

1. **Immediate (This Week)**:
   - Set up project structure
   - Install and test `a2a-x402-typescript` library
   - Define core types and interfaces
   - Create basic UACPAgent skeleton

2. **Short Term (Next 2 Weeks)**:
   - Implement core agent functionality
   - Build registry system
   - Integrate A2A protocol
   - Add X402 payment support

3. **Medium Term (Weeks 4-6)**:
   - Build example agents
   - Create comprehensive tests
   - Write documentation
   - Start dashboard development

4. **Long Term (Weeks 7-8)**:
   - Complete dashboard
   - Set up deployment infrastructure
   - Publish package
   - Create demo videos and tutorials

## Conclusion

This implementation plan provides a clear roadmap for building the UACP SDK using the `a2a-x402-typescript` library as a foundation. The modular architecture ensures flexibility while the phased approach allows for iterative development and testing. By leveraging existing battle-tested payment infrastructure, we can focus on building robust agent communication and registry features specific to Somnia's needs.
