import { UACPAgent, AgentEvent } from '../src/index.js';
import { HTTPRegistryClient } from '../src/registry-http.js';

/**
 * Echo Agent with HTTP Registry
 * Registers with a central HTTP registry server
 */

const REGISTRY_URL = 'http://localhost:3000';

async function main() {
  // Create HTTP registry client
  const httpRegistry = new HTTPRegistryClient(REGISTRY_URL);

  // Check if registry server is available
  const health = await httpRegistry.healthCheck();
  if (!health.healthy) {
    console.error('❌ Registry server is not available at', REGISTRY_URL);
    console.error('   Start it first: npx tsx examples/registry-server.ts');
    process.exit(1);
  }

  console.log('✅ Connected to registry server at', REGISTRY_URL, '\n');

  // Create echo agent with HTTP registry
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
    registry: httpRegistry as any, // HTTP registry implements same interface
  });

  // Handle echo intent
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

  // Handle ping intent
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

  // Listen to events
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

  // Initialize and start
  try {
    await echoAgent.initialize();
    await echoAgent.register();
    await echoAgent.listen();

    console.log('\n🚀 Echo Agent is running with HTTP REGISTRY!');
    console.log('📍 Endpoint: http://localhost:4000/a2a');
    console.log('💚 Health: http://localhost:4000/health');
    console.log('🎴 Card: http://localhost:4000/card');
    console.log('🏛️  Registry: http://localhost:3000');
    console.log('\n✅ Registered with HTTP registry server');
    console.log('✅ Other agents can discover this agent via registry\n');

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
