# HTTP Registry Server - Complete Guide

## ✅ Proper A2A Communication Implementation

This guide shows how to set up and use the HTTP Registry Server for proper Agent-to-Agent (A2A) communication.

## Architecture

```
┌──────────────────────────────────────────┐
│     HTTP Registry Server (Port 3000)     │
│  ┌────────────────────────────────────┐  │
│  │ Registry Database (In-Memory)      │  │
│  │  - did:somnia:echo-agent-001       │  │
│  │    → http://localhost:4000         │  │
│  │  - did:somnia:client-agent-001     │  │
│  │    → http://localhost:4001         │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
         ↑                    ↑
         │ Register           │ Register
         │ Query              │ Query
    ┌────┴────────┐     ┌────┴────────┐
    │ Echo Agent  │     │   Client    │
    │ Port 4000   │     │   Agent     │
    │             │←────│  Port 4001  │
    └─────────────┘ HTTP └─────────────┘
           POST /a2a
```

## How It Works

### 1. Registry Server
- Runs on port 3000
- Stores agent registrations
- Provides lookup APIs
- Accessible via HTTP REST API

### 2. Agent Registration
```typescript
// Agent starts up
const httpRegistry = new HTTPRegistryClient('http://localhost:3000');
const agent = new UACPAgent({
  agentCard: {...},
  registry: httpRegistry,  // Use HTTP registry instead of in-memory
});
await agent.initialize();
await agent.register();  // Registers with HTTP server
```

### 3. Agent Discovery
```typescript
// Client wants to send message
await clientAgent.sendMessage({
  recipient: 'did:somnia:echo-agent-001',  // Only have DID
  intent: 'echo',
  task: {...}
});

// Behind the scenes:
// 1. Router calls: registry.getAgent('did:somnia:echo-agent-001')
// 2. HTTP GET to: http://localhost:3000/registry/agents/did:somnia:echo-agent-001
// 3. Registry returns: {endpoint: 'http://localhost:4000', ...}
// 4. Router sends: POST http://localhost:4000/a2a
```

## Testing Instructions

### Terminal 1: Start Registry Server

```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/registry-server.ts
```

**Expected Output:**
```
🏛️  Initializing Registry Server...

🏛️  Registry Server is running!
📍 URL: http://localhost:3000
💚 Health: http://localhost:3000/health
📋 List agents: http://localhost:3000/registry/agents
```

**Leave this running!**

### Terminal 2: Start Echo Agent

```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/echo-agent-http.ts
```

**Expected Output:**
```
✅ Connected to registry server at http://localhost:3000

[HTTPRegistry] [INFO] HTTP Registry client initialized: http://localhost:3000
[Agent] [INFO] Agent created: Echo Agent (did:somnia:echo-agent-001)
[Agent] [INFO] Agent listening on port 4000

🚀 Echo Agent is running with HTTP REGISTRY!
📍 Endpoint: http://localhost:4000/a2a
💚 Health: http://localhost:4000/health
🎴 Card: http://localhost:4000/card
🏛️  Registry: http://localhost:3000

✅ Registered with HTTP registry server
✅ Other agents can discover this agent via registry
```

**In Terminal 1 (registry server), you should see:**
```
✅ Agent registered: did:somnia:echo-agent-001 (Echo Agent)
```

**Leave this running!**

### Terminal 3: Start Client Agent

```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/client-agent-http.ts
```

**Expected SUCCESS Output:**
```
✅ Connected to registry server at http://localhost:3000

[HTTPRegistry] [INFO] HTTP Registry client initialized: http://localhost:3000
[Agent] [INFO] Agent created: Client Agent (did:somnia:client-agent-001)
[Agent] [INFO] Agent listening on port 4001
🚀 Client Agent is running with HTTP REGISTRY on port 4001
🏛️  Registry: http://localhost:3000

📋 Listing all agents in registry...
Found 2 agents:
  - Echo Agent (did:somnia:echo-agent-001) at http://localhost:4000
  - Client Agent (did:somnia:client-agent-001) at http://localhost:4001

📤 Sending echo message to did:somnia:echo-agent-001...
   1. Looking up agent in HTTP registry...
[Router] [INFO] 🔍 Looking up agent in registry: did:somnia:echo-agent-001
[Router] [INFO] ✅ Found agent: Echo Agent at http://localhost:4000
   2. Found agent endpoint from registry ✅
   3. Sent HTTP POST to endpoint ✅
📥 Echo response: {
  "messageId": "...",
  "status": 200,
  "success": true,
  "data": {
    "echo": "Hello from HTTP client agent!",
    "receivedAt": 1234567890000,
    "sender": "did:somnia:client-agent-001",
    "message": "Echo: Hello from HTTP client agent!"
  }
}

📤 Sending ping message...
📥 Ping response: {
  "messageId": "...",
  "status": 200,
  "success": true,
  "data": {
    "pong": true,
    "timestamp": 1234567890000,
    "message": "Pong!"
  }
}

✅ Communication successful via HTTP Registry!

📝 How this worked:
   1. Echo agent registered with registry server
   2. Client looked up echo agent DID in registry
   3. Registry returned endpoint URL
   4. Client sent HTTP POST to that endpoint
   5. This is proper A2A communication! 🎉
```

## Success Indicators

### ✅ What You Should See:

1. **Registry Server:**
   - Shows agent registrations
   - No errors

2. **Echo Agent:**
   - Successfully connected to registry
   - Registered successfully
   - Listening on port 4000

3. **Client Agent:**
   - Found 2 agents in registry
   - Successfully looked up echo agent
   - Received echo and ping responses

4. **No "Agent not found" errors!**

## Registry API Endpoints

### Register Agent
```bash
POST http://localhost:3000/registry/agents
Content-Type: application/json

{
  "id": "did:somnia:my-agent",
  "name": "My Agent",
  "endpoint": "http://localhost:5000",
  "capabilities": ["chat"],
  "auth": {"type": "none"},
  "version": "1.0.0"
}
```

### Get Agent by DID
```bash
GET http://localhost:3000/registry/agents/did:somnia:echo-agent-001
```

### List All Agents
```bash
GET http://localhost:3000/registry/agents
```

### Update Agent
```bash
PUT http://localhost:3000/registry/agents/did:somnia:my-agent
Content-Type: application/json

{
  "endpoint": "http://localhost:6000"
}
```

### Unregister Agent
```bash
DELETE http://localhost:3000/registry/agents/did:somnia:my-agent
```

### Health Check
```bash
GET http://localhost:3000/health
```

## Key Differences from Shared Registry

### ❌ Old Approach (Broken):
```
Terminal 1: echo-agent.ts → Process A → Registry A (memory)
Terminal 2: client-agent.ts → Process B → Registry B (memory)
Different processes → Different registries → Can't find each other
```

### ✅ New Approach (Working):
```
Terminal 1: registry-server.ts → HTTP Server
Terminal 2: echo-agent-http.ts → HTTP Client → Registry Server
Terminal 3: client-agent-http.ts → HTTP Client → Registry Server
All agents use same HTTP registry → Can find each other!
```

## What Changed

### 1. Created `HTTPRegistryClient`
- Wraps HTTP calls to registry server
- Same interface as `AgentRegistry`
- Can be used as drop-in replacement

### 2. Created `registry-server.ts`
- HTTP server for registry
- REST API for registration/discovery
- Shared state across processes

### 3. Created HTTP-enabled agents
- `echo-agent-http.ts`
- `client-agent-http.ts`
- Use `HTTPRegistryClient` instead of `AgentRegistry`

### 4. Removed unnecessary code
- Deleted `shared-registry.ts` (doesn't work across processes)
- Deleted `*-fixed.ts` files (temporary attempts)

## Files Overview

### Core Implementation
- `src/registry-http.ts` - HTTP Registry Client
- `examples/registry-server.ts` - HTTP Registry Server

### HTTP-Enabled Agents
- `examples/echo-agent-http.ts` - Echo server with HTTP registry
- `examples/client-agent-http.ts` - Client with HTTP registry

### Documentation
- `HTTP-REGISTRY-GUIDE.md` - This file
- `ARCHITECTURE-EXPLAINED.md` - Detailed architecture
- `COMPLETE-ANSWER.md` - FAQ and explanations

## Troubleshooting

### Error: "Registry server is not available"
```
❌ Registry server is not available at http://localhost:3000
   Start it first: npx tsx examples/registry-server.ts
```

**Solution:** Start the registry server first (Terminal 1)

### Error: "Agent not found"
```
❌ Error sending message: AgentNotFoundError: Agent not found: did:somnia:echo-agent-001
```

**Solution:** Make sure echo-agent-http.ts is running (Terminal 2)

### Error: "ECONNREFUSED"
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:** Registry server is not running or wrong port

### Error: "Port already in use"
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill it
kill -9 <PID>
```

## Production Considerations

### 1. Persistent Storage
Currently using in-memory storage. For production, use:
- Database (PostgreSQL, MongoDB)
- Redis for caching
- Distributed cache for scalability

### 2. Security
- Add authentication (JWT, API keys)
- Enable HTTPS
- Rate limiting
- Input validation

### 3. High Availability
- Multiple registry instances
- Load balancer
- Health checks
- Automatic failover

### 4. Monitoring
- Agent registration/unregistration events
- Lookup latency metrics
- Error rates
- Agent health status

## Next Steps

1. ✅ **Test the HTTP Registry** - Follow the testing instructions
2. **Add More Agents** - Create additional agents that use HTTP registry
3. **Implement Persistence** - Add database storage for registry
4. **Deploy** - Deploy registry server to production
5. **Scale** - Add multiple registry instances with load balancing

---

**You now have a proper A2A communication system with HTTP-based service discovery!** 🎉
