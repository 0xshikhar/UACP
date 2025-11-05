# Testing Agent Communication (A2A)

This guide shows two supported ways to test agents without any shared in-memory registry:

- Direct A2A (no registry)
- HTTP Registry (proper discovery via server)

## Option 1: Direct A2A (No Registry)

Use this for the fastest local test. Client posts directly to the Echo agent's `/a2a` endpoint.

### Terminal 1: Start Echo Agent
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/echo-agent.ts
```

Wait for:
```
🚀 Echo Agent is running!
📍 Endpoint: http://localhost:4000/a2a
```

### Terminal 2: Start Client Agent (Direct)
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/client-agent.ts
```

Expected output:
```
📤 Sending echo message directly...
📥 Echo response: { "success": true, ... }

📤 Sending ping message directly...
📥 Ping response: { "success": true, "data": { "pong": true } }
```

Notes:
- DID is carried in the message. No lookup happens.
- Endpoint is known: `http://localhost:4000/a2a`.

## Option 2: HTTP Registry (Discovery)

Use this for real A2A discovery via an HTTP registry server.

### Terminal 1: Start Registry Server
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/registry-server.ts
```

### Terminal 2: Start Echo Agent (HTTP Registry)
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/echo-agent-http.ts
```

### Terminal 3: Start Client Agent (HTTP Registry)
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/client-agent-http.ts
```

Expected flow:
1. Echo registers with registry server.
2. Client discovers Echo by DID via registry.
3. Router posts to discovered endpoint.

## Important

- Shared in-memory registries between processes are not supported and have been removed from examples.
- Prefer Direct A2A for quick local tests, and HTTP Registry for proper discovery.
