"use client"
import React, { useState, useEffect } from 'react'
import PixelBlast from "@/components/PixelBlast"

const AgentBox = ({ 
  id, 
  name, 
  status, 
  isConnected, 
  onConnect, 
  position 
}: { 
  id: string
  name: string
  status: string
  isConnected: boolean
  onConnect: () => void
  position: { x: number; y: number }
}) => {
  return (
    <div 
      className="absolute bg-black/80 border-2 border-purple-400 rounded-lg p-4 min-w-[200px] backdrop-blur-sm"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-sm">{name}</h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
      </div>
      <p className="text-gray-300 text-xs mb-3">{status}</p>
      <button
        onClick={onConnect}
        className={`w-full py-2 px-3 text-xs font-semibold rounded transition-all ${
          isConnected 
            ? 'bg-green-600 text-white hover:bg-green-700' 
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {isConnected ? 'Connected' : 'Connect'}
      </button>
    </div>
  )
}

const ConnectionLine = ({ 
  from, 
  to, 
  isActive 
}: { 
  from: { x: number; y: number }
  to: { x: number; y: number }
  isActive: boolean 
}) => {
  const length = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2))
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI
  
  return (
    <div
      className={`absolute origin-left transition-all duration-1000 ${
        isActive ? 'opacity-100' : 'opacity-30'
      }`}
      style={{
        left: `${from.x}px`,
        top: `${from.y}px`,
        width: `${length}px`,
        height: '2px',
        transform: `rotate(${angle}deg)`,
        background: isActive 
          ? 'linear-gradient(90deg, #B19EEF, #8B5CF6, #B19EEF)'
          : '#4B5563',
        boxShadow: isActive ? '0 0 10px #B19EEF' : 'none'
      }}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
      )}
    </div>
  )
}

export default function ExplorePage() {
  const [agents, setAgents] = useState([
    { id: 'agent1', name: 'Payment Agent', status: 'Ready for transactions', isConnected: false },
    { id: 'agent2', name: 'Data Agent', status: 'Processing requests', isConnected: false },
    { id: 'agent3', name: 'Security Agent', status: 'Monitoring network', isConnected: false },
    { id: 'agent4', name: 'Storage Agent', status: 'Available for storage', isConnected: false },
    { id: 'agent5', name: 'AI Agent', status: 'Learning and adapting', isConnected: false },
    { id: 'agent6', name: 'Bridge Agent', status: 'Cross-chain ready', isConnected: false }
  ])

  const [connections, setConnections] = useState([
    { from: 'agent1', to: 'agent2', isActive: false },
    { from: 'agent2', to: 'agent3', isActive: false },
    { from: 'agent3', to: 'agent4', isActive: false },
    { from: 'agent4', to: 'agent5', isActive: false },
    { from: 'agent5', to: 'agent6', isActive: false },
    { from: 'agent6', to: 'agent1', isActive: false }
  ])

  const agentPositions = {
    agent1: { x: 200, y: 150 },
    agent2: { x: 400, y: 150 },
    agent3: { x: 600, y: 150 },
    agent4: { x: 600, y: 300 },
    agent5: { x: 400, y: 300 },
    agent6: { x: 200, y: 300 }
  }

  const handleAgentConnect = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, isConnected: !agent.isConnected }
        : agent
    ))
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setConnections(prev => prev.map(conn => ({
        ...conn,
        isActive: agents.find(a => a.id === conn.from)?.isConnected && 
                 agents.find(a => a.id === conn.to)?.isConnected
      })))
    }, 100)

    return () => clearInterval(interval)
  }, [agents])

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* PixelBlast Background */}
      <div className="absolute inset-0 z-0">
        <PixelBlast
          variant="square"
          pixelSize={2}
          color="#B19EEF"
          patternScale={3}
          patternDensity={1.5}
          enableRipples={true}
          rippleIntensityScale={1.5}
          rippleThickness={0.1}
          rippleSpeed={0.3}
          speed={0.2}
          transparent={true}
          edgeFade={0.2}
          className="opacity-70"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Agent Network
          </h1>
          <p className="text-xl text-white/90 mb-4 max-w-3xl mx-auto drop-shadow-md">
            Explore how autonomous agents connect and communicate in the A2A Protocol
          </p>
          <p className="text-lg text-white/80 max-w-4xl mx-auto drop-shadow-md">
            Each agent represents a specialized function in the decentralized ecosystem. 
            Click on agents to establish connections and watch the network come alive.
          </p>
        </div>

        {/* Demo Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center drop-shadow-lg">
            Live Demo: Agent Connections
          </h2>
          <div className="bg-black/40 backdrop-blur-sm border border-purple-400 rounded-lg p-6 max-w-4xl mx-auto">
            <p className="text-white/90 text-center mb-6">
              Click on any agent to connect it to the network. Watch as connections form between active agents.
            </p>
            
            {/* Network Visualization */}
            <div className="relative h-[400px] bg-black/60 rounded-lg border border-purple-300 overflow-hidden">
              {/* Connection Lines */}
              {connections.map((conn, index) => (
                <ConnectionLine
                  key={index}
                  from={agentPositions[conn.from as keyof typeof agentPositions]}
                  to={agentPositions[conn.to as keyof typeof agentPositions]}
                  isActive={conn.isActive}
                />
              ))}
              
              {/* Agent Boxes */}
              {agents.map((agent) => (
                <AgentBox
                  key={agent.id}
                  id={agent.id}
                  name={agent.name}
                  status={agent.status}
                  isConnected={agent.isConnected}
                  onConnect={() => handleAgentConnect(agent.id)}
                  position={agentPositions[agent.id as keyof typeof agentPositions]}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Agent Types Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-black/60 backdrop-blur-sm border border-purple-400 rounded-lg p-6 hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-lg">{agent.name}</h3>
                <div className={`w-3 h-3 rounded-full ${agent.isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              </div>
              <p className="text-gray-300 text-sm mb-4">{agent.status}</p>
              <div className="text-xs text-purple-300 font-mono">
                ID: {agent.id}
              </div>
            </div>
          ))}
        </div>

        {/* Protocol Info */}
        <div className="mt-16 text-center">
          <div className="bg-black/60 backdrop-blur-sm border border-purple-400 rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">
              A2A Protocol Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="text-white font-semibold mb-2">Decentralized Communication</h4>
                <p className="text-gray-300 text-sm">Agents communicate directly without central servers</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Smart Contract Integration</h4>
                <p className="text-gray-300 text-sm">Seamless integration with blockchain smart contracts</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Autonomous Operations</h4>
                <p className="text-gray-300 text-sm">Self-managing agents with minimal human intervention</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Cross-Chain Compatibility</h4>
                <p className="text-gray-300 text-sm">Agents can operate across multiple blockchain networks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
