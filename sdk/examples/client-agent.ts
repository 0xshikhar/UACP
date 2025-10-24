import { UACPAgent } from '../src/index.js';
import { sharedRegistry } from './shared-registry.js';

/**
 * Client agent that sends messages to other agents
 */
async function main() {
  // Create a client agent with shared registry
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
    registry: sharedRegistry,
  });

  // Initialize the client agent
  await clientAgent.initialize();
  await clientAgent.register();
  await clientAgent.listen();

  console.log('🚀 Client Agent is running on port 4001\n');

  // Wait a bit for the echo agent to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    // Send a message to the echo agent
    console.log('📤 Sending echo message...');
    const echoResponse = await clientAgent.sendMessage({
      recipient: 'did:somnia:echo-agent-001',
      intent: 'echo',
      task: {
        message: 'Hello from client agent!',
        timestamp: Date.now(),
      },
    });

    console.log('📥 Echo response:', JSON.stringify(echoResponse, null, 2));

    // Send a ping message
    console.log('\n📤 Sending ping message...');
    const pingResponse = await clientAgent.sendMessage({
      recipient: 'did:somnia:echo-agent-001',
      intent: 'ping',
      task: {},
    });

    console.log('📥 Ping response:', JSON.stringify(pingResponse, null, 2));
  } catch (error) {
    console.error('❌ Error sending message:', error);
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
