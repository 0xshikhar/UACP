# 🚀 Test Agent Communication NOW (Direct A2A)

## Quick Test (2 Terminals)

### Terminal 1 - Echo Agent
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/echo-agent.ts
```

Wait for:
```
🚀 Echo Agent is running!
📍 Endpoint: http://localhost:4000/a2a
```

### Terminal 2 - Client Agent (Direct)
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/client-agent.ts
```

## Expected Output

### ✅ SUCCESS looks like:
```
[Agent] [INFO] Agent listening on port 4001
🚀 Client Agent is running on port 4001 (DIRECT A2A)

📤 Sending echo message directly...
📥 Echo response: {
  "status": 200,
  "success": true,
  "data": { "echo": "Hello from client agent!", ... }
}

📤 Sending ping message directly...
📥 Ping response: {
  "status": 200,
  "success": true,
  "data": { "pong": true, ... }
}
```

### ❌ FAILURE looks like:
```
❌ HTTP Error: connect ECONNREFUSED 127.0.0.1:4000
   → Echo agent is not running on port 4000
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

### 3. Connection Refused
Ensure `echo-agent.ts` is running before starting the client.

## Key Points

- No shared in-memory registry is used.
- The client posts directly to `http://localhost:4000/a2a`.
- DIDs are still present in the message for identity/audit.

---

Need discovery? Use the HTTP registry flow in `HTTP-REGISTRY-GUIDE.md` and run:
- `examples/registry-server.ts`
- `examples/echo-agent-http.ts`
- `examples/client-agent-http.ts`
