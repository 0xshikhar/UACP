"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
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
      className="absolute bg-[#FFF8E7] border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-4 min-w-[200px]"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-black font-black text-sm">{name}</h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#8B7355]' : 'bg-[#D4A574]'}`}></div>
      </div>
      <p className="text-black/80 text-xs mb-3">{status}</p>
      <button
        onClick={onConnect}
        className={`w-full py-2 px-3 text-xs font-bold rounded transition-all border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] ${
          isConnected 
            ? 'bg-[#8B7355] text-white hover:bg-[#8B7355]/90' 
            : 'bg-[#D4A574] text-white hover:bg-[#D4A574]/90'
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
        height: '3px',
        transform: `rotate(${angle}deg)`,
        background: isActive 
          ? 'linear-gradient(90deg, #8B7355, #D4A574, #8B7355)'
          : '#4B5563',
        boxShadow: isActive ? '0 0 8px #8B7355' : 'none'
      }}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFF8E7] to-transparent animate-pulse"></div>
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
    <main className="relative min-h-screen bg-black overflow-hidden">
      {/* PixelBlast Background */}
      <div className="absolute inset-0 z-0">
        <PixelBlast
          variant="square"
          pixelSize={2}
          color="#8B7355"
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
          <h1 className="text-5xl md:text-7xl font-black text-[#FFF8E7] mb-6 drop-shadow-lg">
            Agent Network
          </h1>
          <p className="text-xl text-[#D4A574] mb-4 max-w-3xl mx-auto drop-shadow-md">
            Explore how autonomous agents connect and communicate in the A2A Protocol
          </p>
          <p className="text-lg text-[#FFF8E7]/90 max-w-4xl mx-auto drop-shadow-md">
            Each agent represents a specialized function in the decentralized ecosystem. 
            Click on agents to establish connections and watch the network come alive.
          </p>
        </div>

        {/* Demo Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-[#FFF8E7] mb-6 text-center drop-shadow-lg">
            Live Demo: Agent Connections
          </h2>
          <div className="bg-[#FFF8E7] border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-lg p-6 max-w-4xl mx-auto">
            <p className="text-black text-center mb-6 font-semibold">
              Click on any agent to connect it to the network. Watch as connections form between active agents.
            </p>
            
            {/* Network Visualization */}
            <div className="relative h-[400px] bg-black rounded-lg border-2 border-black overflow-hidden">
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

        {/* Connection Interface */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-[#FFF8E7] mb-6 text-center drop-shadow-lg">
            Connect Agents
          </h2>
          <div className="bg-[#FFF8E7] border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-lg p-8 max-w-4xl mx-auto text-center">
            <p className="text-black text-lg mb-6 font-semibold">
              Ready to connect agents and see them in action?
            </p>
            <Link 
              href="/dashboard"
              className="inline-block px-8 py-4 bg-[#8B7355] text-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg text-lg font-bold hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
            >
              View Connected Agents Dashboard
            </Link>
          </div>
        </div>

        {/* Protocol Info */}
        <div className="mt-16 text-center">
          <div className="bg-[#FFF8E7] border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-black text-black mb-4">
              A2A Protocol Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="text-black font-black mb-2">Decentralized Communication</h4>
                <p className="text-black/80 text-sm">Agents communicate directly without central servers</p>
              </div>
              <div>
                <h4 className="text-black font-black mb-2">Smart Contract Integration</h4>
                <p className="text-black/80 text-sm">Seamless integration with blockchain smart contracts</p>
              </div>
              <div>
                <h4 className="text-black font-black mb-2">Autonomous Operations</h4>
                <p className="text-black/80 text-sm">Self-managing agents with minimal human intervention</p>
              </div>
              <div>
                <h4 className="text-black font-black mb-2">Cross-Chain Compatibility</h4>
                <p className="text-black/80 text-sm">Agents can operate across multiple blockchain networks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
