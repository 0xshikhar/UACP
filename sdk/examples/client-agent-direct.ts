import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Client Agent - Direct Communication (No Registry)
 * This version directly connects to echo agent's endpoint
 */
async function main() {
  console.log('🚀 Starting client with DIRECT communication\n');

  // Wait for echo agent to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    // Send echo message DIRECTLY to echo agent's endpoint
    console.log('📤 Sending echo message directly to http://localhost:4000/a2a...');
    
    const echoMessage = {
      id: uuidv4(),
      timestamp: Date.now(),
      sender: 'did:somnia:client-agent-001',
      recipient: 'did:somnia:echo-agent-001',
      intent: 'echo',
      task: {
        message: 'Hello from direct client!',
      },
      type: 'request',
      priority: 'medium',
    };

    const echoResponse = await axios.post('http://localhost:4000/a2a', echoMessage, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });

    console.log('📥 Echo response:', JSON.stringify(echoResponse.data, null, 2));

    // Send ping message
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

    const pingResponse = await axios.post('http://localhost:4000/a2a', pingMessage, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });

    console.log('📥 Ping response:', JSON.stringify(pingResponse.data, null, 2));

    console.log('\n✅ Direct communication successful!');
    console.log('\n📝 How this works:');
    console.log('   1. Client knows echo agent is at http://localhost:4000');
    console.log('   2. Client sends HTTP POST directly to http://localhost:4000/a2a');
    console.log('   3. No registry lookup needed!');
    console.log('   4. DID is just an identifier in the message payload');

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ HTTP Error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('   → Echo agent is not running on port 4000');
        console.error('   → Start it first: npx tsx examples/echo-agent.ts');
      }
    } else {
      console.error('❌ Error:', error);
    }
  }

  process.exit(0);
}

main();
