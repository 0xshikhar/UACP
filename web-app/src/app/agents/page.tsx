"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Search, BarChart3 } from "lucide-react"
import PixelBlast from "@/components/PixelBlast"

interface TokenPrice {
  symbol: string
  name: string
  price: number
  priceChange24h: number
  marketCap: number
  volume24h: number
  logoURI?: string
}

interface DeFiLlamaResponse {
  coins: {
    [key: string]: {
      symbol: string
      name: string
      price: number
      priceChange24h: number
      marketCap: number
      volume24h: number
      logoURI?: string
    }
  }
}

export default function AgentsPage() {
  // Price Agent States
  const [priceData, setPriceData] = useState<TokenPrice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [customTicker, setCustomTicker] = useState("")

  // Comparison Agent States
  const [comparisonToken, setComparisonToken] = useState("")
  const [comparisonData, setComparisonData] = useState<TokenPrice | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonError, setComparisonError] = useState<string | null>(null)

  // Fetch price data with custom ticker support
  const fetchPriceData = async (ticker?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      let apiUrl = 'https://coins.llama.fi/prices/current/ethereum:0xa0b86a33e6c4e6c4e6c4e6c4e6c4e6c4e6c4e6c,bitcoin:bitcoin,ethereum:ethereum'
      
      // If custom ticker is provided, try to fetch specific token
      if (ticker && ticker.trim()) {
        apiUrl = `https://coins.llama.fi/prices/current/ethereum:${ticker.trim().toLowerCase()},bitcoin:${ticker.trim().toLowerCase()}`
      }
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: DeFiLlamaResponse = await response.json()
      
      // Transform the data into our format
      const tokens: TokenPrice[] = Object.entries(data.coins).map(([key, coin]) => ({
        symbol: coin.symbol,
        name: coin.name,
        price: coin.price,
        priceChange24h: coin.priceChange24h || 0,
        marketCap: coin.marketCap || 0,
        volume24h: coin.volume24h || 0,
        logoURI: coin.logoURI
      }))
      
      setPriceData(tokens)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price data')
      console.error('Error fetching price data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch specific token for comparison
  const fetchComparisonData = async (tokenSymbol: string) => {
    if (!tokenSymbol.trim()) return
    
    setComparisonLoading(true)
    setComparisonError(null)
    
    try {
      const response = await fetch(`https://coins.llama.fi/prices/current/ethereum:${tokenSymbol.toLowerCase()},bitcoin:${tokenSymbol.toLowerCase()}`)
      
      if (!response.ok) {
        throw new Error(`Token "${tokenSymbol}" not found or API error`)
      }
      
      const data: DeFiLlamaResponse = await response.json()
      
      if (Object.keys(data.coins).length === 0) {
        throw new Error(`Token "${tokenSymbol}" not found`)
      }
      
      // Get the first token from the response
      const [key, coin] = Object.entries(data.coins)[0]
      const token: TokenPrice = {
        symbol: coin.symbol,
        name: coin.name,
        price: coin.price,
        priceChange24h: coin.priceChange24h || 0,
        marketCap: coin.marketCap || 0,
        volume24h: coin.volume24h || 0,
        logoURI: coin.logoURI
      }
      
      setComparisonData(token)
    } catch (err) {
      setComparisonError(err instanceof Error ? err.message : 'Failed to fetch token data')
      console.error('Error fetching comparison data:', err)
      setComparisonData(null)
    } finally {
      setComparisonLoading(false)
    }
  }

  useEffect(() => {
    fetchPriceData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchPriceData(), 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`
    } else if (price < 1) {
      return `$${price.toFixed(4)}`
    } else {
      return `$${price.toFixed(2)}`
    }
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`
    } else if (marketCap >= 1e3) {
      return `$${(marketCap / 1e3).toFixed(2)}K`
    } else {
      return `$${marketCap.toFixed(2)}`
    }
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(2)}K`
    } else {
      return `$${volume.toFixed(2)}`
    }
  }

  const handleCustomTickerSearch = () => {
    if (customTicker.trim()) {
      fetchPriceData(customTicker.trim())
    }
  }

  const handleComparisonSearch = () => {
    if (comparisonToken.trim()) {
      fetchComparisonData(comparisonToken.trim())
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
            🤖 Agents Dashboard
          </h1>
          <p className="text-xl text-[#D4A574] mb-4 max-w-3xl mx-auto drop-shadow-md">
            Autonomous agents powered by A2A Protocol - Working together seamlessly
          </p>
          <p className="text-lg text-[#FFF8E7]/90 max-w-4xl mx-auto drop-shadow-md">
            Watch as our DeFiLlama Price Agent and Comparison Agent collaborate in real-time, 
            demonstrating the power of agent-to-agent communication.
          </p>
        </div>

        {/* Main Content Container */}
        <div className="bg-[#FFF8E7] border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-lg p-8 max-w-6xl mx-auto">
          <Tabs defaultValue="price-agent" className="space-y-6">
            <TabsList className="bg-[#D4A574] border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-lg p-1">
              <TabsTrigger 
                value="price-agent" 
                className="data-[state=active]:bg-[#8B7355] data-[state=active]:text-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-md font-bold"
              >
                💰 Price Agent
              </TabsTrigger>
              <TabsTrigger 
                value="comparison-agent"
                className="data-[state=active]:bg-[#8B7355] data-[state=active]:text-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-md font-bold"
              >
                📊 Comparison Agent
              </TabsTrigger>
              <TabsTrigger 
                value="collaboration"
                className="data-[state=active]:bg-[#8B7355] data-[state=active]:text-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-md font-bold"
              >
                🤝 Collaboration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="price-agent" className="space-y-6">
              {/* Price Agent Header */}
              <div className="bg-[#D4A574] border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-black mb-2 flex items-center gap-2">
                      💰 DeFiLlama Price Agent
                    </h2>
                    <p className="text-black/80 font-semibold">
                      Real-time cryptocurrency price data from DeFiLlama APIs with custom ticker support
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => fetchPriceData()}
                      disabled={loading}
                      className="bg-[#8B7355] hover:bg-[#8B7355]/90 text-white border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200 font-bold"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh All
                    </Button>
                    {lastUpdated && (
                      <div className="bg-white border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] rounded-lg px-3 py-1">
                        <span className="text-black text-sm font-bold">
                          Updated {lastUpdated.toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Ticker Input */}
              <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-6">
                <h3 className="text-xl font-black text-black mb-4">🔍 Search Custom Token</h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter token symbol (e.g., usdc, wbtc, link)..."
                      value={customTicker}
                      onChange={(e) => setCustomTicker(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomTickerSearch()}
                      className="border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-md font-semibold"
                    />
                  </div>
                  <Button 
                    onClick={handleCustomTickerSearch} 
                    disabled={loading || !customTicker.trim()}
                    className="bg-[#D4A574] hover:bg-[#D4A574]/90 text-black border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200 font-bold"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-100 border-2 border-red-500 shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-4">
                  <p className="text-red-800 font-bold">❌ Error: {error}</p>
                </div>
              )}

              {/* Loading State */}
              {loading && priceData.length === 0 ? (
                <div className="flex items-center justify-center py-12 bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg">
                  <RefreshCw className="h-8 w-8 animate-spin mr-3 text-[#8B7355]" />
                  <span className="text-black font-bold text-lg">Loading price data...</span>
                </div>
              ) : (
                /* Token Cards */
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {priceData.map((token, index) => (
                    <div key={index} className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-6 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {token.logoURI && (
                            <img
                              src={token.logoURI}
                              alt={token.symbol}
                              className="w-10 h-10 rounded-full border-2 border-black"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                          <div>
                            <h3 className="font-black text-black text-lg">{token.symbol}</h3>
                            <p className="text-black/70 text-sm font-semibold">{token.name}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-1 ${
                          token.priceChange24h >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {token.priceChange24h >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-bold">
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-black/70 font-semibold">Price</span>
                          <span className="font-black text-black text-lg">{formatPrice(token.price)}</span>
                        </div>
                        
                        {token.marketCap > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-black/70 font-semibold">Market Cap</span>
                            <span className="font-bold text-black">{formatMarketCap(token.marketCap)}</span>
                          </div>
                        )}
                        
                        {token.volume24h > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-black/70 font-semibold">Volume 24h</span>
                            <span className="font-bold text-black">{formatVolume(token.volume24h)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {priceData.length === 0 && !loading && !error && (
                <div className="text-center py-12 bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg">
                  <p className="text-black/70 font-bold text-lg">No price data available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="comparison-agent" className="space-y-6">
              {/* Comparison Agent Header */}
              <div className="bg-[#D4A574] border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-6">
                <div>
                  <h2 className="text-2xl font-black text-black mb-2 flex items-center gap-2">
                    📊 Price Comparison Agent
                  </h2>
                  <p className="text-black/80 font-semibold">
                    Enter any token symbol to get detailed 24hr price change analysis
                  </p>
                </div>
              </div>

              {/* Token Input */}
              <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-6">
                <h3 className="text-xl font-black text-black mb-4">🔍 Analyze Token</h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter token symbol (e.g., BTC, ETH, ADA, SOL)..."
                      value={comparisonToken}
                      onChange={(e) => setComparisonToken(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleComparisonSearch()}
                      className="border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-md font-semibold"
                    />
                  </div>
                  <Button 
                    onClick={handleComparisonSearch} 
                    disabled={comparisonLoading || !comparisonToken.trim()}
                    className="bg-[#D4A574] hover:bg-[#D4A574]/90 text-black border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200 font-bold"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {comparisonError && (
                <div className="bg-red-100 border-2 border-red-500 shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-4">
                  <p className="text-red-800 font-bold">❌ Error: {comparisonError}</p>
                </div>
              )}

              {/* Loading State */}
              {comparisonLoading && (
                <div className="flex items-center justify-center py-12 bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg">
                  <RefreshCw className="h-8 w-8 animate-spin mr-3 text-[#8B7355]" />
                  <span className="text-black font-bold text-lg">Analyzing token data...</span>
                </div>
              )}

              {/* Comparison Results */}
              {comparisonData && (
                <div className="bg-white border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {comparisonData.logoURI && (
                        <img
                          src={comparisonData.logoURI}
                          alt={comparisonData.symbol}
                          className="w-12 h-12 rounded-full border-2 border-black"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                      <div>
                        <h3 className="text-2xl font-black text-black">{comparisonData.symbol}</h3>
                        <p className="text-black/70 font-semibold">{comparisonData.name}</p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center gap-2 ${
                      comparisonData.priceChange24h >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {comparisonData.priceChange24h >= 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                      <span className="font-black text-xl">
                        {comparisonData.priceChange24h >= 0 ? '+' : ''}{comparisonData.priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#FFF8E7] border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-lg p-4 text-center">
                      <p className="text-black/70 font-semibold mb-2">Current Price</p>
                      <p className="text-2xl font-black text-black">{formatPrice(comparisonData.price)}</p>
                    </div>
                    
                    <div className="bg-[#FFF8E7] border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-lg p-4 text-center">
                      <p className="text-black/70 font-semibold mb-2">24h Change</p>
                      <p className={`text-2xl font-black ${comparisonData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {comparisonData.priceChange24h >= 0 ? '+' : ''}{comparisonData.priceChange24h.toFixed(2)}%
                      </p>
                    </div>
                    
                    <div className="bg-[#FFF8E7] border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-lg p-4 text-center">
                      <p className="text-black/70 font-semibold mb-2">Market Cap</p>
                      <p className="text-2xl font-black text-black">{formatMarketCap(comparisonData.marketCap)}</p>
                    </div>
                  </div>
                </div>
              )}

              {!comparisonData && !comparisonLoading && !comparisonError && (
                <div className="text-center py-12 bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-[#8B7355]" />
                  <p className="text-black/70 font-bold text-lg">Enter a token symbol to see detailed analysis</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="collaboration" className="space-y-6">
              {/* Collaboration Header */}
              <div className="bg-[#D4A574] border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-6">
                <div>
                  <h2 className="text-2xl font-black text-black mb-2 flex items-center gap-2">
                    🤝 Agent Collaboration
                  </h2>
                  <p className="text-black/80 font-semibold">
                    See how the Price Agent and Comparison Agent work together in real-time
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Price Agent Status */}
                <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-6">
                  <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                    💰 Price Agent Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-black">Active Tokens:</span>
                      <span className="bg-[#D4A574] px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-black">
                        {priceData.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-black">Last Updated:</span>
                      <span className="font-bold text-black">{lastUpdated?.toLocaleTimeString() || 'Never'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-black">Status:</span>
                      <span className={`px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold ${
                        error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {error ? "Error" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comparison Agent Status */}
                <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-lg p-6">
                  <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                    📊 Comparison Agent Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-black">Current Analysis:</span>
                      <span className="bg-[#D4A574] px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold text-black">
                        {comparisonData?.symbol || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-black">24h Change:</span>
                      <span className={`font-bold ${
                        comparisonData?.priceChange24h ? 
                          (comparisonData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600') : 
                          'text-black/50'
                      }`}>
                        {comparisonData?.priceChange24h ? 
                          `${comparisonData.priceChange24h >= 0 ? '+' : ''}${comparisonData.priceChange24h.toFixed(2)}%` : 
                          'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-black">Status:</span>
                      <span className={`px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold ${
                        comparisonError ? 'bg-red-100 text-red-800' : 
                        comparisonLoading ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {comparisonError ? "Error" : comparisonLoading ? "Loading" : "Ready"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collaboration Flow */}
              <div className="bg-white border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-lg p-6">
                <h3 className="text-xl font-black text-black mb-6">🔄 Collaboration Flow</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#8B7355] rounded-full flex items-center justify-center border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-black text-lg">Price Agent</p>
                      <p className="text-black/70 font-semibold">Fetches real-time price data from DeFiLlama APIs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-6 h-6 bg-[#D4A574] rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <div className="w-3 h-3 bg-black rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-black text-black text-lg">Data Sharing</p>
                      <p className="text-black/70 font-semibold">Shares price data with other agents via A2A Protocol</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-6">
                    <div className="w-12 h-12 bg-[#D4A574] rounded-full flex items-center justify-center border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                      <BarChart3 className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <p className="font-black text-black text-lg">Comparison Agent</p>
                      <p className="text-black/70 font-semibold">Analyzes specific tokens and provides detailed insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}