# 🏗️ UACP Architecture - How Agent Communication Actually Works

## The Problem You're Facing

### Why "Agent not found" Keeps Happening

```
Terminal 1: echo-agent.ts
├─ Creates Process A
└─ Creates Registry A in memory
    └─ Registers: did:somnia:echo-agent-001

Terminal 2: client-agent.ts  
├─ Creates Process B  
└─ Creates Registry B in memory  
    └─ Tries to find: did:somnia:echo-agent-001 ❌
```

**Problem:** Process A and Process B have SEPARATE MEMORY. They cannot share an in-memory registry!

## How A2A Protocol Actually Works

### The 3-Layer Architecture

```
┌─────────────────────────────────────────┐
│  Layer 1: Agent Identity (DID)          │
│  - did:somnia:echo-agent-001            │
│  - Unique identifier                    │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Layer 2: Discovery (Registry)          │
│  - Maps DID → Endpoint URL              │
│  - did:somnia:echo-agent-001            │
│    → http://localhost:4000              │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Layer 3: Communication (HTTP)          │
│  - POST http://localhost:4000/a2a       │
│  - Sends A2A message format             │
└─────────────────────────────────────────┘
```

## Current Flow (Why It Fails)

### Step-by-Step Breakdown

**When client-agent.ts tries to send a message:**

```typescript
// 1. Client calls sendMessage
await clientAgent.sendMessage({
  recipient: 'did:somnia:echo-agent-001',  // ← DID
  intent: 'echo',
  task: { message: 'Hello!' },
});

// 2. Router tries to look up the DID
const recipient = await this.registry.getAgent('did:somnia:echo-agent-001');
//    ↑ Looks in client's OWN registry (Process B)
//    ↑ Echo agent is in Process A's registry
//    ↑ FAILS! ❌

// 3. Never gets to this step:
const response = await axios.post(`${recipient.endpoint}/a2a`, message);
```

### The Missing Link

**The registry lookup happens at line 33 in `router.ts`:**

```typescript
// src/router.ts:33
const recipient = await this.registry.getAgent(message.recipient);
//                       └─ This is an in-memory Map
//                       └─ Only has agents registered in THIS process
```

## Why curl Works But client-agent Doesn't

### curl Command (WORKS ✅)
```bash
curl -X POST http://localhost:4000/a2a \
  -H "Content-Type: application/json" \
  -d '{
    "id": "msg-123",
    "sender": "did:somnia:test",
    "recipient": "did:somnia:echo-agent-001",
    "intent": "echo",
    ...
  }'
```

**Why it works:**
- You provide the endpoint URL directly (`localhost:4000`)
- No registry lookup needed
- Direct HTTP communication

### client-agent (FAILS ❌)
```typescript
await clientAgent.sendMessage({
  recipient: 'did:somnia:echo-agent-001',  // Only provides DID
  intent: 'echo',
  ...
});
```

**Why it fails:**
- Client only knows the DID
- Needs to look up endpoint URL in registry
- Registry is empty (different process)
- Fails before HTTP call

## The Role of DIDs

### What is a DID?

**DID = Decentralized Identifier**

Think of it like:
- Email address: `user@domain.com` → identifies a mailbox
- DID: `did:somnia:echo-agent-001` → identifies an agent

### DID Flow in Messages

```typescript
{
  "id": "msg-12345",                        // Message ID
  "sender": "did:somnia:client-agent-001",  // Who sent it
  "recipient": "did:somnia:echo-agent-001", // Who receives it
  "intent": "echo",                          // What action
  "task": { "message": "Hello!" }            // Data
}
```

**The DID is used for:**
1. **Identity:** Who is sending/receiving
2. **Discovery:** Look up endpoint URL
3. **Authorization:** Verify sender is allowed
4. **Audit:** Track message flow

### Why Not Just Use URLs?

**Bad approach:**
```typescript
recipient: "http://localhost:4000"  // ❌ Not portable
```

**Good approach (A2A):**
```typescript
recipient: "did:somnia:echo-agent-001"  // ✅ Abstract, can move
```

**Benefits:**
- Agent can move to different servers
- Can have multiple endpoints (load balancing)
- Decentralized (no central authority)
- Privacy (DID doesn't reveal location)

## Solutions

### Solution 1: Direct Communication (No Registry)

**Best for:** Development, single machine testing

```typescript
// Client knows echo agent's URL directly
const response = await axios.post('http://localhost:4000/a2a', {
  id: 'msg-123',
  sender: 'did:somnia:client-agent-001',
  recipient: 'did:somnia:echo-agent-001',
  intent: 'echo',
  task: { message: 'Hello!' },
  type: 'request',
  priority: 'medium',
});
```

**Pros:**
- Simple, works immediately
- No registry needed
- Fast development

**Cons:**
- Hardcoded endpoints
- Not scalable
- Defeats purpose of DIDs

### Solution 2: HTTP Registry Server

**Best for:** Production, multiple machines, real A2A

```
┌─────────────────────────┐
│   Registry Server       │
│   (port 3000)           │
│   ┌─────────────────┐   │
│   │ Registry Map:   │   │
│   │ echo-agent-001  │   │
│   │ → localhost:4000│   │
│   │                 │   │
│   │ client-agent-001│   │
│   │ → localhost:4001│   │
│   └─────────────────┘   │
└─────────────────────────┘
         ↑          ↑
         │          │
    ┌────┴───┐  ┌──┴─────┐
    │ Echo   │  │ Client │
    │ Agent  │  │ Agent  │
    │ :4000  │  │ :4001  │
    └────────┘  └────────┘
```

**Flow:**
1. Echo agent starts → Registers with registry server
2. Client agent starts → Registers with registry server
3. Client wants to message echo agent
4. Client asks registry: "What's the endpoint for echo-agent-001?"
5. Registry responds: "http://localhost:4000"
6. Client sends HTTP POST to that endpoint

**Pros:**
- True A2A protocol
- Agents can be on different machines
- Dynamic discovery
- Scalable

**Cons:**
- Requires registry server
- More complex setup

### Solution 3: Hardcoded Agent Map

**Best for:** Simple demos, known set of agents

```typescript
// In client-agent.ts
const KNOWN_AGENTS = {
  'did:somnia:echo-agent-001': 'http://localhost:4000',
  'did:somnia:payment-agent-001': 'http://localhost:5000',
};

// Manual lookup
const endpoint = KNOWN_AGENTS[recipientDID];
const response = await axios.post(`${endpoint}/a2a`, message);
```

## How to Fix Your Current Issue

### Quick Fix: Use Direct Communication

**Run this:**
```bash
# Terminal 1
npx tsx examples/echo-agent.ts

# Terminal 2  
npx tsx examples/client-agent-direct.ts
```

This bypasses the registry entirely and works immediately!

### Proper Fix: Implement HTTP Registry

**Run this:**
```bash
# Terminal 1: Start registry server
npx tsx examples/registry-server.ts

# Terminal 2: Start echo agent (will register with server)
npx tsx examples/echo-agent-http.ts

# Terminal 3: Start client agent (will lookup via server)
npx tsx examples/client-agent-http.ts
```

## Key Takeaways

1. **DIDs are identifiers, not addresses**
   - DID: `did:somnia:echo-agent-001` (who)
   - Endpoint: `http://localhost:4000` (where)

2. **Registry maps DID → Endpoint**
   - Registry is the "phone book"
   - Lookup DID to find where to send HTTP request

3. **In-memory registry only works in same process**
   - Cannot share memory between processes
   - Need HTTP registry server for multi-process

4. **A2A communication is HTTP-based**
   - Final communication is always HTTP POST
   - Registry just helps find the endpoint

5. **Current error happens at lookup stage**
   - Never reaches HTTP call
   - Registry lookup fails first
   - No endpoint URL found

## Visual Flow Comparison

### ❌ Current (Broken)
```
Client Agent Process
  ├─ Send to 'did:somnia:echo-agent-001'
  ├─ Look up in local registry
  ├─ Not found! ❌
  └─ Error: Agent not found
```

### ✅ Direct (Works)
```
Client
  └─ HTTP POST to http://localhost:4000/a2a ✅
```

### ✅ HTTP Registry (Proper A2A)
```
Client Agent Process
  ├─ Send to 'did:somnia:echo-agent-001'
  ├─ Look up in HTTP registry server
  ├─ Found: http://localhost:4000 ✅
  └─ HTTP POST to http://localhost:4000/a2a ✅
```

## Next Steps

1. **For quick testing:** Use `client-agent-direct.ts`
2. **For proper A2A:** Set up registry server
3. **For production:** Deploy registry server + agents
4. **For decentralized:** Use blockchain-based registry

---

**The Bottom Line:**

Your agents are in different processes, so they need a way to discover each other. Either:
- Use direct endpoints (skip discovery)
- Use HTTP registry server (proper A2A)
- Use static configuration (hybrid approach)

The in-memory shared registry approach cannot work across processes! 🚫
