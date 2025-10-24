import express from 'express';
import { AgentRegistry } from '../src/index.js';

/**
 * HTTP Registry Server
 * Central registry that agents register with and query for discovery
 */

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  // Enable CORS for agent communication
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const registry = new AgentRegistry({ type: 'memory' });

console.log('🏛️  Initializing Registry Server...\n');

// Register an agent
app.post('/registry/agents', async (req, res) => {
  try {
    const agentCard = req.body;
    const result = await registry.registerAgent(agentCard);
    console.log(`✅ Agent registered: ${agentCard.id} (${agentCard.name})`);
    res.json(result);
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get agent by ID
app.get('/registry/agents/:id', async (req, res) => {
  try {
    const agent = await registry.getAgent(req.params.id);
    res.json(agent);
  } catch (error) {
    res.status(404).json({ error: 'Agent not found' });
  }
});

// List all agents
app.get('/registry/agents', async (req, res) => {
  try {
    const agents = await registry.listAgents();
    res.json({ agents, count: agents.length });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update agent
app.put('/registry/agents/:id', async (req, res) => {
  try {
    await registry.updateAgent(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

// Unregister agent
app.delete('/registry/agents/:id', async (req, res) => {
  try {
    await registry.unregisterAgent(req.params.id);
    console.log(`🗑️  Agent unregistered: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log('\n🏛️  Registry Server is running!');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`📋 List agents: http://localhost:${PORT}/registry/agents\n`);
});
