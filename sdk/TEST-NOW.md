# 🚀 Test Agent Communication NOW

## Quick Test (2 Terminals)

### Terminal 1 - Echo Agent
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/echo-agent.ts
```

Wait for:
```
✅ Ready to receive messages from client-agent.ts
```

### Terminal 2 - Client Agent
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/client-agent.ts
```

## Expected Output

### ✅ SUCCESS looks like:
```
📋 Shared registry created and exported
[Agent] [INFO] Agent listening on port 4001
🚀 Client Agent is running on port 4001

📤 Sending echo message...
📥 Echo response: {
  "success": true,
  "data": {
    "echo": "Hello from client agent!",
    ...
  }
}

📤 Sending ping message...
📥 Ping response: {
  "success": true,
  "data": {
    "pong": true,
    ...
  }
}
```

### ❌ FAILURE looks like:
```
❌ Error sending message: AgentNotFoundError: Agent not found: did:somnia:echo-agent-001
```

## If You Get Errors

### 1. Port Already in Use
```bash
lsof -i :4000 | grep LISTEN
lsof -i :4001 | grep LISTEN
# Kill processes
kill -9 <PID>
```

### 2. Module Not Found
```bash
npm install
npm run build
```

### 3. Still Getting "Agent not found"
Make sure echo-agent is running FIRST before starting client-agent!

## Key Differences from Before

### Before (BROKEN):
- Saw **TWO** "Registry initialized" messages
- Got "Agent not found" error
- Registry override was too late

### After (FIXED):
- See **ONE** "Registry initialized" message (shared registry)
- No "Agent not found" errors
- Registry passed in config from the start

## What to Watch For

1. **Shared registry log**: `📋 Shared registry created and exported`
2. **Only ONE registry init per agent** (not two)
3. **Successful responses** from both echo and ping

---

**Ready?** Open 2 terminals and test it now! 🎯
