# ✅ Test Direct Communication (WORKS IMMEDIATELY)

## Why This Works

**No registry lookup! Direct HTTP communication.**

```
Client → HTTP POST → http://localhost:4000/a2a → Echo Agent
```

## Run These Commands

### Terminal 1: Start Echo Agent
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/echo-agent.ts
```

Wait for: `✅ Ready to receive messages`

### Terminal 2: Direct Client
```bash
cd /Users/shikharsingh/Downloads/code/somania/uacp/sdk
npx tsx examples/client-agent-direct.ts
```

## Expected Output

### ✅ SUCCESS:
```
🚀 Starting client with DIRECT communication

📤 Sending echo message directly to http://localhost:4000/a2a...
📥 Echo response: {
  "success": true,
  "data": {
    "echo": "Hello from direct client!",
    ...
  }
}

📤 Sending ping message directly...
📥 Ping response: {
  "success": true,
  "data": {
    "pong": true,
    ...
  }
}

✅ Direct communication successful!

📝 How this works:
   1. Client knows echo agent is at http://localhost:4000
   2. Client sends HTTP POST directly to http://localhost:4000/a2a
   3. No registry lookup needed!
   4. DID is just an identifier in the message payload
```

## What's Different?

### Old Way (Broken):
```typescript
// Tries to lookup DID in registry → Fails
await clientAgent.sendMessage({
  recipient: 'did:somnia:echo-agent-001',
  intent: 'echo',
  task: { message: 'Hello!' },
});
```

### New Way (Works):
```typescript
// Direct HTTP POST to known endpoint
await axios.post('http://localhost:4000/a2a', {
  sender: 'did:somnia:client-agent-001',
  recipient: 'did:somnia:echo-agent-001',
  intent: 'echo',
  task: { message: 'Hello!' },
});
```

## Why No Registry?

**The DID is still in the message**, but we don't look it up in a registry. We already know the endpoint URL (`localhost:4000`).

Think of it like:
- **With registry:** "What's John's phone number?" → Look in phonebook → Call
- **Without registry:** "Call 555-1234 directly" → Already know number → Call

The DID (`did:somnia:echo-agent-001`) is still useful for:
- Identifying who the message is for
- Authorization/verification
- Message routing inside the agent
- Audit trails

## Next: Proper A2A with Registry Server

See `ARCHITECTURE-EXPLAINED.md` for how to set up:
1. Registry Server (port 3000)
2. Echo Agent → Registers with server
3. Client Agent → Discovers echo agent via server
4. Client → HTTP POST to discovered endpoint

---

**Test this now!** It will work immediately without any registry issues.
