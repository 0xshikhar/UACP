import { UACPAgent, AgentEvent } from '../src/index.js';

/**
 * Simple example agent demonstrating basic UACP SDK usage
 */
async function main() {
  // Create a simple echo agent
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
  });

  // Register intent handlers
  echoAgent.onIntent('echo', async (task, context) => {
    console.log('Echo intent received:', task);
    return {
      success: true,
      data: {
        echo: task.message,
        receivedAt: context.timestamp,
        sender: context.sender,
      },
    };
  });

  echoAgent.onIntent('ping', async (task, context) => {
    console.log('Ping intent received from:', context.sender);
    return {
      success: true,
      data: {
        pong: true,
        timestamp: Date.now(),
      },
    };
  });

  // Listen to events
  echoAgent.on(AgentEvent.INITIALIZED, (data) => {
    console.log('✅ Agent initialized:', data);
  });

  echoAgent.on(AgentEvent.REGISTERED, (data) => {
    console.log('✅ Agent registered:', data);
  });

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
    console.log('🎴 Card: http://localhost:4000/card\n');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down...');
      await echoAgent.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start agent:', error);
    process.exit(1);
  }
}

main();
