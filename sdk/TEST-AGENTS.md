# Testing Agent Communication - FIXED VERSION

## The Problem
Both agents were creating separate in-memory registries, so they couldn't find each other.

## The Solution
Created a **shared registry** that both agents use.

## How to Test

### Step 1: Start Echo Agent
Open Terminal 1:
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/echo-agent.ts
```

Wait for:
```
🚀 Echo Agent is running!
✅ Ready to receive messages from client-agent.ts
```

### Step 2: Start Client Agent
Open Terminal 2:
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/client-agent.ts
```

You should now see:
```
📤 Sending echo message...
📥 Echo response: { "success": true, ... }

📤 Sending ping message...
📥 Ping response: { "success": true, "data": { "pong": true } }
```

## What Changed

### 1. Created `shared-registry.ts`
A single registry instance that both agents import and use.

### 2. Updated `echo-agent.ts`
- Imports `sharedRegistry`
- Overrides internal registry with shared one

### 3. Updated `client-agent.ts`
- Imports `sharedRegistry`
- Overrides internal registry with shared one

## Technical Details

The agents now share the same registry in memory:
```typescript
// shared-registry.ts
export const sharedRegistry = new AgentRegistry({ type: 'memory' });

// echo-agent.ts & client-agent.ts
import { sharedRegistry } from './shared-registry.js';
(agent as any).registry = sharedRegistry;
(agent as any).router.registry = sharedRegistry;
```

This ensures when echo-agent registers itself, client-agent can find it in the same registry.

## Alternative: Registry Server (Production)

For production, you should use a registry server instead of shared memory:

```typescript
const registry = new AgentRegistry({
  type: 'http',
  url: 'http://localhost:3000/registry'
});
```

This would allow agents on different machines to discover each other.
