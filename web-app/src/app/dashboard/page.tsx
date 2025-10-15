"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PixelBlast from "@/components/PixelBlast"
import Footer from "@/components/Footer"

const ConnectionCard = ({ 
  fromAgent, 
  toAgent, 
  status, 
  timestamp 
}: { 
  fromAgent: string
  toAgent: string
  status: 'active' | 'pending' | 'failed'
  timestamp: string
}) => {
  const statusColors = {
    active: 'bg-[#8B7355]',
    pending: 'bg-[#D4A574]',
    failed: 'bg-red-500'
  }

  const statusText = {
    active: 'Connected',
    pending: 'Connecting...',
    failed: 'Failed'
  }

  return (
    <div className="bg-[#FFF8E7] border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-4 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <div className="text-black font-black text-sm">{fromAgent}</div>
          <div className="text-black text-lg">→</div>
          <div className="text-black font-black text-sm">{toAgent}</div>
        </div>
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-black/80 text-xs">{timestamp}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded ${statusColors[status]} text-white`}>
          {statusText[status]}
        </span>
      </div>
    </div>
  )
}

const AgentSelector = ({ 
  agents, 
  selectedAgents, 
  onToggleAgent 
}: { 
  agents: string[]
  selectedAgents: string[]
  onToggleAgent: (agent: string) => void 
}) => {
  return (
    <div className="bg-[#FFF8E7] border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-lg p-6">
      <h3 className="text-xl font-black text-black mb-4">Select Agents to Connect</h3>
      <div className="grid grid-cols-2 gap-3">
        {agents.map((agent) => (
          <button
            key={agent}
            onClick={() => onToggleAgent(agent)}
            className={`p-3 rounded-lg border-2 border-black font-bold text-sm transition-all ${
              selectedAgents.includes(agent)
                ? 'bg-[#8B7355] text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
                : 'bg-[#FFF8E7] text-black hover:bg-[#D4A574] hover:text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]'
            }`}
          >
            {agent}
          </button>
        ))}
      </div>
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            if (selectedAgents.length >= 2) {
              // Simulate connection
              console.log('Connecting agents:', selectedAgents)
            }
          }}
          disabled={selectedAgents.length < 2}
          className={`px-6 py-3 rounded-lg border-2 border-black font-bold text-sm transition-all ${
            selectedAgents.length >= 2
              ? 'bg-[#8B7355] text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Connect Selected Agents
        </button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [connections, setConnections] = useState([
    { fromAgent: 'Payment Agent', toAgent: 'Data Agent', status: 'active' as const, timestamp: '2 min ago' },
    { fromAgent: 'Security Agent', toAgent: 'Storage Agent', status: 'active' as const, timestamp: '5 min ago' },
    { fromAgent: 'AI Agent', toAgent: 'Bridge Agent', status: 'pending' as const, timestamp: '1 min ago' },
    { fromAgent: 'Data Agent', toAgent: 'AI Agent', status: 'failed' as const, timestamp: '10 min ago' }
  ])

  const availableAgents = [
    'Payment Agent',
    'Data Agent', 
    'Security Agent',
    'Storage Agent',
    'AI Agent',
    'Bridge Agent'
  ]

  const handleToggleAgent = (agent: string) => {
    setSelectedAgents(prev => 
      prev.includes(agent) 
        ? prev.filter(a => a !== agent)
        : [...prev, agent]
    )
  }

  const handleConnect = () => {
    if (selectedAgents.length >= 2) {
      const newConnection = {
        fromAgent: selectedAgents[0],
        toAgent: selectedAgents[1],
        status: 'pending' as const,
        timestamp: 'Just now'
      }
      setConnections(prev => [newConnection, ...prev])
      setSelectedAgents([])
      
      // Simulate connection status change
      setTimeout(() => {
        setConnections(prev => 
          prev.map(conn => 
            conn === newConnection 
              ? { ...conn, status: 'active' as const }
              : conn
          )
        )
      }, 3000)
    }
  }

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
            Agent Dashboard
          </h1>
          <p className="text-xl text-[#D4A574] mb-4 max-w-3xl mx-auto drop-shadow-md">
            Monitor and manage agent connections in the A2A Protocol network
          </p>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Side - Agent Selector */}
          <div>
            <AgentSelector
              agents={availableAgents}
              selectedAgents={selectedAgents}
              onToggleAgent={handleToggleAgent}
            />
          </div>

          {/* Right Side - Connections Dashboard */}
          <div>
            <div className="bg-[#FFF8E7] border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-lg p-6">
              <h3 className="text-xl font-black text-black mb-4">Active Connections</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {connections.map((connection, index) => (
                  <ConnectionCard
                    key={index}
                    fromAgent={connection.fromAgent}
                    toAgent={connection.toAgent}
                    status={connection.status}
                    timestamp={connection.timestamp}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-[#FFF8E7] border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-6 text-center">
            <h4 className="text-2xl font-black text-[#8B7355] mb-2">
              {connections.filter(c => c.status === 'active').length}
            </h4>
            <p className="text-black font-bold">Active Connections</p>
          </div>
          <div className="bg-[#FFF8E7] border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-6 text-center">
            <h4 className="text-2xl font-black text-[#D4A574] mb-2">
              {connections.filter(c => c.status === 'pending').length}
            </h4>
            <p className="text-black font-bold">Pending Connections</p>
          </div>
          <div className="bg-[#FFF8E7] border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-6 text-center">
            <h4 className="text-2xl font-black text-black mb-2">
              {availableAgents.length}
            </h4>
            <p className="text-black font-bold">Available Agents</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </main>
  )
}
