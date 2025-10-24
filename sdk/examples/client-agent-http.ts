import { UACPAgent } from '../src/index.js';
import { HTTPRegistryClient } from '../src/registry-http.js';

/**
 * Client Agent with HTTP Registry
 * Discovers and communicates with other agents via HTTP registry
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

  // Create client agent with HTTP registry
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
    registry: httpRegistry as any, // HTTP registry implements same interface
  });

  // Initialize the client agent
  await clientAgent.initialize();
  await clientAgent.register();
  await clientAgent.listen();

  console.log('🚀 Client Agent is running with HTTP REGISTRY on port 4001');
  console.log('🏛️  Registry: http://localhost:3000\n');

  // Wait for echo agent to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    // List all agents in registry
    console.log('📋 Listing all agents in registry...');
    const agents = await httpRegistry.listAgents();
    console.log(`Found ${agents.length} agents:`);
    agents.forEach(agent => {
      console.log(`  - ${agent.name} (${agent.id}) at ${agent.endpoint}`);
    });
    console.log('');

    // Send echo message
    console.log('📤 Sending echo message to did:somnia:echo-agent-001...');
    console.log('   1. Looking up agent in HTTP registry...');
    
    const echoResponse = await clientAgent.sendMessage({
      recipient: 'did:somnia:echo-agent-001',
      intent: 'echo',
      task: {
        message: 'Hello from HTTP client agent!',
        timestamp: Date.now(),
      },
    });

    console.log('   2. Found agent endpoint from registry ✅');
    console.log('   3. Sent HTTP POST to endpoint ✅');
    console.log('📥 Echo response:', JSON.stringify(echoResponse, null, 2));

    // Send ping message
    console.log('\n📤 Sending ping message...');
    const pingResponse = await clientAgent.sendMessage({
      recipient: 'did:somnia:echo-agent-001',
      intent: 'ping',
      task: {},
    });

    console.log('📥 Ping response:', JSON.stringify(pingResponse, null, 2));

    console.log('\n✅ Communication successful via HTTP Registry!');
    console.log('\n📝 How this worked:');
    console.log('   1. Echo agent registered with registry server');
    console.log('   2. Client looked up echo agent DID in registry');
    console.log('   3. Registry returned endpoint URL');
    console.log('   4. Client sent HTTP POST to that endpoint');
    console.log('   5. This is proper A2A communication! 🎉');

  } catch (error) {
    console.error('❌ Error sending message:', error);
    if ((error as any).code === 'AGENT_NOT_FOUND') {
      console.error('\n💡 Make sure echo-agent-http.ts is running!');
      console.error('   Terminal 1: npx tsx examples/registry-server.ts');
      console.error('   Terminal 2: npx tsx examples/echo-agent-http.ts');
      console.error('   Terminal 3: npx tsx examples/client-agent-http.ts');
    }
  }

  // Keep running
  console.log('\n✅ Client agent will keep running. Press Ctrl+C to exit.\n');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    await clientAgent.shutdown();
    process.exit(0);
  });
}

main();
