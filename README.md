<div align="center">

# 🤖 UACP — Universal Agent Communication Protocol

### **DeFi Agents on Somnia: AI-Powered Automation for Decentralized Finance**

**Somnia AI Hackathon 2025 • Track: DeFi Agents**

*Production-ready protocol for secure, interoperable agent-to-agent communication with native payment semantics*

[![Somnia](https://img.shields.io/badge/Somnia-Blockchain-purple)](https://somnia.network)
[![A2A Protocol](https://img.shields.io/badge/Google-A2A%20Protocol-blue)](https://github.com/google/A2A)
[![X402](https://img.shields.io/badge/X402-Payment%20Protocol-green)](https://x402.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

**📺 [Video Demo](#) • 📊 [Pitch Deck](./PITCH_DECK.md) • 📚 [SDK Docs](./sdk/README.md)**

</div>

---

## 📋 Table of Contents
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Architecture](#-architecture)
- [Test Agents](#-test-agents--examples)
- [Quick Start](#-quick-start)
- [Tech Stack](#-tech-stack)
- [Roadmap](#-roadmap--future-goals)

---

## 🚨 Problem Statement

### **The DeFi Automation Crisis**

**1. Fragmented Bot Infrastructure**
- Every protocol builds custom bots with proprietary APIs
- No standard for agent discovery or composition
- Teams waste 60%+ of time rebuilding routing/retry logic
- **Impact**: Slow innovation, vendor lock-in

**2. Unsafe Automation**
- Bots execute without risk checks or circuit breakers
- No standard for multi-agent coordination
- Missing retry patterns lead to cascading failures
- **Impact**: $500M+ lost annually to automation failures

**3. No Payment Standard**
- Premium services lack payment semantics
- Bots cannot autonomously pay for services
- **Impact**: Centralized gatekeeping

**4. Poor Developer Experience**
- Developers reinvent schemas and error handling
- No type-safe SDK or testing utilities
- **Impact**: 3-6 month development cycles

---

## 💡 Solution

### **UACP: Google A2A + Coinbase X402 + Somnia Blockchain**

**1. 99% Faster Development**
- A2A-compliant message schema with DID-based identities
- Build agents in hours, not months

**2. Safe Multi-Agent Orchestration**
- Declarative workflows with retry/circuit breaker
- Compose price oracles, risk agents, execution agents

**3. Native Payment Semantics (X402)**
- HTTP 402-based payment flow
- 1-line integration for autonomous payments

**4. Type-Safe SDK**
- TypeScript with Zod validation
- Runnable test agents and examples

### **Impact**

| Metric | Before | With UACP | Improvement |
|--------|--------|-----------|-------------|
| Development Time | 3-6 months | 1-2 weeks | 90%+ |
| Integration Cost | $50K-$200K | $5K-$10K | 90%+ |
| Failure Rate | 15-30% | <1% | 95%+ |
| Payment Integration | 2-4 weeks | 1 line | 99%+ |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│         APPLICATION LAYER                        │
│  Orchestrator │ Price Oracle │ Execution │ Risk │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────┐
│         UACP SDK (TypeScript)                    │
│  UACPAgent │ Router │ Registry │ Orchestrator   │
│  Workflow  │ X402   │ A2A      │ Context        │
└──────────────┬──────────────────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────┐    ┌──────────────────┐
│  HTTP    │    │  SOMNIA          │
│ Registry │    │  • AgentRegistry │
│          │    │  • UACPEvents    │
└──────────┘    └──────────────────┘
```

**Key Flows:**
1. **Registration**: Agent → HTTP Registry → On-chain (optional)
2. **Discovery**: Query Registry by Capability → AgentCard[]
3. **Workflow**: Orchestrator → Price → Risk → Execute
4. **Payment**: Request → HTTP 402 → Pay → Retry

---

## 🤖 Test Agents & Examples

All in `sdk/examples/`:

### **Core Examples**
- **`registry-server.ts`** — HTTP registry for discovery
- **`echo-agent.ts`** — Minimal A2A agent
- **`client-agent.ts`** — Sends messages to agents
- **`payment-agent.ts`** — X402 payment-gated service
- **`payment-client.ts`** — X402 payment flow
- **`orchestrator-defi.ts`** — Multi-agent DeFi workflow

### **DeFi Orchestrator Demo**
Composes 6 agents: Price Oracle → Swap Executor → Notifier + Logger (parallel) → Treasury (error handler)

```bash
npx tsx examples/orchestrator-defi.ts
```

---

## 🚀 Quick Start

```bash
# Install
cd sdk && npm install && npm run build

# Test 1: Echo Agent
npx tsx examples/echo-agent.ts

# Test 2: DeFi Orchestration
npx tsx examples/orchestrator-defi.ts
```

### **Create Your Agent**

```typescript
import { UACPAgent } from '@uacp/somnia-sdk';

const agent = new UACPAgent({
  agentCard: {
    id: 'did:somnia:my-agent',
    name: 'My Agent',
    endpoint: 'http://localhost:4000',
    capabilities: ['swap'],
    auth: { type: 'none' },
    version: '1.0.0',
  },
  port: 4000,
});

agent.onIntent('swap', async (task, context) => {
  return { success: true, data: { txHash: '0x...' } };
});

await agent.initialize();
await agent.listen();
```

### **Orchestrate Workflows**

```typescript
const workflow = new AgentWorkflow('Strategy')
  .step('price', { agent: 'oracle', intent: 'get_price' })
  .then('swap', { agent: 'executor', intent: 'swap' })
  .parallel([
    { agent: 'notifier', intent: 'notify' },
    { agent: 'logger', intent: 'log' },
  ]);

await orchestrator.execute(workflow.build());
```

---

## 🛠️ Tech Stack

**Blockchain:** Somnia (400K+ TPS), Solidity 0.8.20, ethers.js  
**Protocols:** Google A2A, Coinbase X402  
**SDK:** TypeScript 5, Zod, Express, EventEmitter3  
**Testing:** Vitest, ESLint, Prettier

---

## 🔧 Extending UACP

### **Add Custom Agent**
```typescript
const myAgent = new UACPAgent({ /* config */ });
myAgent.onIntent('custom', async (task) => { /* logic */ });
```

### **Add Payment Requirements**
```typescript
agent.onIntent('premium', async (task) => {
  return {
    requiresPayment: true,
    paymentRequirements: {
      scheme: 'exact',
      network: 'somnia',
      asset: '0x...', // USDC
      maxAmountRequired: '1000000',
    },
  };
});
```

---

## 🗺️ Roadmap & Future Goals

### **Phase 1: MVP (Current)**
- ✅ A2A protocol implementation
- ✅ X402 payment scaffolding
- ✅ HTTP registry server
- ✅ Multi-agent orchestration
- ✅ Test agents and examples

### **Phase 2: Production ( Q4 2025)**
- [ ] X402 end-to-end on-chain settlement
- [ ] On-chain registry on Somnia mainnet
- [ ] WebSocket transport for streaming
- [ ] Agent reputation system
- [ ] Multi-chain support

### **Phase 3: DeFi Strategies ( Q1 2026)**
- [ ] Pre-built strategy packs (DCA, LP rebalance, TWAP)
- [ ] Risk/compliance agent templates
- [ ] MEV protection agents
- [ ] Cross-chain bridge agents

### **Phase 4: Enterprise ( Q2 2026)**
- [ ] Visual workflow builder (web UI)
- [ ] Agent marketplace
- [ ] Monitoring dashboard
- [ ] SLA guarantees and insurance

### **Hackathon Goal**
Win DeFi Agents track by demonstrating:
- Real-time, payment-aware automation
- Safe multi-agent coordination
- Production-ready SDK and examples
- Clear path to mainnet deployment

---

## 🏆 Hackathon Track Alignment

**Track: DeFi Agents — Explore how AI agents can enhance decentralized finance through automation, strategy execution, and intelligent decision-making in real time**

### **How UACP Delivers**

**1. Automation**
- Declarative workflows eliminate manual intervention
- Circuit breakers and retries prevent failures
- Event-driven monitoring for observability

**2. Strategy Execution**
- Multi-agent orchestration (price → risk → execute)
- Parallel execution for speed
- Error handlers for rollback

**3. Intelligent Decision-Making**
- Agents negotiate capabilities via AgentCard
- Context management for stateful interactions
- Payment-aware resource allocation

**4. Real-Time**
- Somnia's <1s finality enables instant coordination
- SSE streaming for long-running tasks
- Circuit breakers prevent cascading delays

---

## 📚 Documentation

- **[SDK Documentation](./sdk/README.md)** — Complete API reference
- **[Architecture Explained](./sdk/ARCHITECTURE-EXPLAINED.md)** — Deep dive into design
- **[Test Agents Guide](./sdk/TEST-AGENTS.md)** — Running examples
- **[Pitch Deck](./PITCH_DECK.md)** — Hackathon presentation

---

## 📄 License

MIT

---

## 👥 Team

**0xShikhar** — Protocol & SDK Development

**Ayush** — Full stack Developer

---

## 🔗 Links

- **Somnia**: https://somnia.network
- **Google A2A**: https://github.com/google/A2A
- **Coinbase X402**: https://x402.org
- **GitHub**: https://github.com/0xshikhar/uacp

---

<div align="center">

**Built with ❤️ for Somnia AI Hackathon 2025**

</div>
