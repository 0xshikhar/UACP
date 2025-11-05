import { UACPAgent } from '../src/index.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Client Agent - Direct A2A (No Shared Registry)
 * Creates an agent and sends A2A messages directly to a known endpoint.
 */
async function main() {
  // Create a client agent (no shared registry)
  const clientAgent = new UACPAgent({
    agentCard: {
      id: 'did:somnia:client-agent-001',
      name: 'Client Agent',
      description: 'A client agent that sends messages',
      endpoint: 'http://localhost:4001',
      capabilities: ['send_message', 'query'],
      auth: { type: 'none' },
      version: '1.0.0',
    },
    port: 4001,
    logLevel: 'info',
  });

  // Initialize the client agent
  await clientAgent.initialize();
  await clientAgent.register();
  await clientAgent.listen();

  console.log('🚀 Client Agent is running on port 4001 (DIRECT A2A)\n');

  // Wait a bit for the echo agent to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    // Directly POST A2A messages to echo agent (known endpoint)
    const endpoint = 'http://localhost:4000/a2a';

    console.log('📤 Sending echo message directly...');
    const echoMessage = {
      id: uuidv4(),
      timestamp: Date.now(),
      sender: 'did:somnia:client-agent-001',
      recipient: 'did:somnia:echo-agent-001',
      intent: 'echo',
      task: { message: 'Hello from client agent!' },
      type: 'request',
      priority: 'medium',
    };

    const echoResp = await axios.post(endpoint, echoMessage, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    console.log('📥 Echo response:', JSON.stringify(echoResp.data, null, 2));

    console.log('\n📤 Sending ping message directly...');
    const pingMessage = {
      id: uuidv4(),
      timestamp: Date.now(),
      sender: 'did:somnia:client-agent-001',
      recipient: 'did:somnia:echo-agent-001',
      intent: 'ping',
      task: {},
      type: 'request',
      priority: 'medium',
    };

    const pingResp = await axios.post(endpoint, pingMessage, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    console.log('📥 Ping response:', JSON.stringify(pingResp.data, null, 2));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ HTTP Error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('   → Echo agent is not running on port 4000');
        console.error('   → Start it first: npx tsx examples/echo-agent.ts');
      }
    } else {
      console.error('❌ Error sending message:', error);
    }
  }

  // Keep the agent running
  console.log('\n✅ Client agent will keep running. Press Ctrl+C to exit.\n');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    await clientAgent.shutdown();
    process.exit(0);
  });
}

main();
