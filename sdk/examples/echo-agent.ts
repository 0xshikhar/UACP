import { UACPAgent, AgentEvent } from '../src/index.js';
import { sharedRegistry } from './shared-registry.js';

/**
 * Echo Agent - responds to echo and ping intents
 * Run this agent first before running client-agent.ts
 */
async function main() {
  // Create an echo agent with shared registry
  const echoAgent = new UACPAgent({
    agentCard: {
      id: 'did:somnia:echo-agent-001',
      name: 'Echo Agent',
      description: 'A simple agent that echoes back messages',
      endpoint: 'http://localhost:4000',
      capabilities: ['echo', 'ping'],
      auth: { type: 'none' },
      version: '1.0.0',
    },
    port: 4000,
    logLevel: 'info',
    registry: sharedRegistry,
  });

  // Handle echo intent - responds with the received message
  echoAgent.onIntent('echo', async (task, context) => {
    console.log('🔊 Echo intent received:', task);
    return {
      success: true,
      data: {
        echo: task.message,
        receivedAt: context.timestamp,
        sender: context.sender,
        message: `Echo: ${task.message}`,
      },
    };
  });

  // Handle ping intent - responds with pong
  echoAgent.onIntent('ping', async (_task, context) => {
    console.log('🏓 Ping intent received from:', context.sender);
    return {
      success: true,
      data: {
        pong: true,
        timestamp: Date.now(),
        message: 'Pong!',
      },
    };
  });

  // Listen to agent events
  echoAgent.on(AgentEvent.MESSAGE_RECEIVED, (message) => {
    console.log('📨 Message received:', {
      id: message.id,
      intent: message.intent,
      sender: message.sender,
    });
  });

  echoAgent.on(AgentEvent.ERROR, (data) => {
    console.error('❌ Error:', data);
  });

  // Initialize and start the agent
  try {
    await echoAgent.initialize();
    await echoAgent.register();
    await echoAgent.listen();

    console.log('\n🚀 Echo Agent is running!');
    console.log('📍 Endpoint: http://localhost:4000/a2a');
    console.log('💚 Health: http://localhost:4000/health');
    console.log('🎴 Card: http://localhost:4000/card');
    console.log('\n✅ Ready to receive messages from client-agent.ts\n');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down Echo Agent...');
      await echoAgent.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start Echo Agent:', error);
    process.exit(1);
  }
}

main();
