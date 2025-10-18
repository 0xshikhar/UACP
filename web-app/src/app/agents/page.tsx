"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Search, BarChart3 } from "lucide-react"

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Agents Dashboard</h1>
        <p className="text-muted-foreground">
          Autonomous agents powered by A2A Protocol - Working together seamlessly
        </p>
      </div>

      <Tabs defaultValue="price-agent" className="space-y-6">
        <TabsList>
          <TabsTrigger value="price-agent">Price Agent</TabsTrigger>
          <TabsTrigger value="comparison-agent">Comparison Agent</TabsTrigger>
          <TabsTrigger value="collaboration">Agent Collaboration</TabsTrigger>
        </TabsList>

        <TabsContent value="price-agent" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    DeFiLlama Price Agent
                  </CardTitle>
                  <CardDescription>
                    Real-time cryptocurrency price data from DeFiLlama APIs with custom ticker support
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => fetchPriceData()}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh All
                  </Button>
                  {lastUpdated && (
                    <Badge variant="secondary">
                      Updated {lastUpdated.toLocaleTimeString()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Custom Ticker Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="custom-ticker">Search Custom Token (e.g., usdc, wbtc, link)</Label>
                  <Input
                    id="custom-ticker"
                    placeholder="Enter token symbol..."
                    value={customTicker}
                    onChange={(e) => setCustomTicker(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomTickerSearch()}
                  />
                </div>
                <Button onClick={handleCustomTickerSearch} disabled={loading || !customTicker.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {error && (
                <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
                  <p className="text-destructive">Error: {error}</p>
                </div>
              )}

              {loading && priceData.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading price data...</span>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {priceData.map((token, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {token.logoURI && (
                              <img
                                src={token.logoURI}
                                alt={token.symbol}
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            <div>
                              <h3 className="font-semibold">{token.symbol}</h3>
                              <p className="text-sm text-muted-foreground">{token.name}</p>
                            </div>
                          </div>
                          <Badge
                            variant={token.priceChange24h >= 0 ? "default" : "destructive"}
                            className="flex items-center gap-1"
                          >
                            {token.priceChange24h >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Price</span>
                            <span className="font-semibold">{formatPrice(token.price)}</span>
                          </div>
                          
                          {token.marketCap > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Market Cap</span>
                              <span className="text-sm">{formatMarketCap(token.marketCap)}</span>
                            </div>
                          )}
                          
                          {token.volume24h > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Volume 24h</span>
                              <span className="text-sm">{formatVolume(token.volume24h)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {priceData.length === 0 && !loading && !error && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No price data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison-agent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Price Comparison Agent
              </CardTitle>
              <CardDescription>
                Enter any token symbol to get detailed 24hr price change analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Token Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="comparison-token">Token Symbol</Label>
                  <Input
                    id="comparison-token"
                    placeholder="Enter token symbol (e.g., BTC, ETH, ADA, SOL)..."
                    value={comparisonToken}
                    onChange={(e) => setComparisonToken(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleComparisonSearch()}
                  />
                </div>
                <Button onClick={handleComparisonSearch} disabled={comparisonLoading || !comparisonToken.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze
                </Button>
              </div>

              {comparisonError && (
                <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
                  <p className="text-destructive">Error: {comparisonError}</p>
                </div>
              )}

              {comparisonLoading && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Analyzing token data...</span>
                </div>
              )}

              {comparisonData && (
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {comparisonData.logoURI && (
                          <img
                            src={comparisonData.logoURI}
                            alt={comparisonData.symbol}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <div>
                          <CardTitle className="text-xl">{comparisonData.symbol}</CardTitle>
                          <CardDescription>{comparisonData.name}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={comparisonData.priceChange24h >= 0 ? "default" : "destructive"}
                        className="flex items-center gap-1 text-lg px-3 py-1"
                      >
                        {comparisonData.priceChange24h >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {comparisonData.priceChange24h >= 0 ? '+' : ''}{comparisonData.priceChange24h.toFixed(2)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                        <p className="text-2xl font-bold">{formatPrice(comparisonData.price)}</p>
                      </div>
                      
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">24h Change</p>
                        <p className={`text-2xl font-bold ${comparisonData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {comparisonData.priceChange24h >= 0 ? '+' : ''}{comparisonData.priceChange24h.toFixed(2)}%
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
                        <p className="text-2xl font-bold">{formatMarketCap(comparisonData.marketCap)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!comparisonData && !comparisonLoading && !comparisonError && (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Enter a token symbol to see detailed analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤝 Agent Collaboration
              </CardTitle>
              <CardDescription>
                See how the Price Agent and Comparison Agent work together
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Price Agent Status */}
                  <Card className="border-2 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        Price Agent Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Active Tokens:</span>
                          <Badge variant="secondary">{priceData.length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span className="text-sm">{lastUpdated?.toLocaleTimeString() || 'Never'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge variant={error ? "destructive" : "default"}>
                            {error ? "Error" : "Active"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comparison Agent Status */}
                  <Card className="border-2 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        Comparison Agent Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Current Analysis:</span>
                          <Badge variant="secondary">{comparisonData?.symbol || 'None'}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>24h Change:</span>
                          <span className={`text-sm font-semibold ${comparisonData?.priceChange24h ? (comparisonData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600') : 'text-muted-foreground'}`}>
                            {comparisonData?.priceChange24h ? `${comparisonData.priceChange24h >= 0 ? '+' : ''}${comparisonData.priceChange24h.toFixed(2)}%` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge variant={comparisonError ? "destructive" : comparisonLoading ? "secondary" : "default"}>
                            {comparisonError ? "Error" : comparisonLoading ? "Loading" : "Ready"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Collaboration Flow */}
                <Card className="border-2 border-purple-200">
                  <CardHeader>
                    <CardTitle>🔄 Collaboration Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Price Agent</p>
                          <p className="text-sm text-muted-foreground">Fetches real-time price data from DeFiLlama APIs</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 ml-4">
                        <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-semibold">Data Sharing</p>
                          <p className="text-sm text-muted-foreground">Shares price data with other agents via A2A Protocol</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 ml-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Comparison Agent</p>
                          <p className="text-sm text-muted-foreground">Analyzes specific tokens and provides detailed insights</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}