"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

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
  const [priceData, setPriceData] = useState<TokenPrice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchPriceData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // DeFiLlama API endpoint for token prices
      const response = await fetch('https://coins.llama.fi/prices/current/ethereum:0xa0b86a33e6c4e6c4e6c4e6c4e6c4e6c4e6c4e6c,bitcoin:bitcoin,ethereum:ethereum')
      
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

  useEffect(() => {
    fetchPriceData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPriceData, 30000)
    
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Agents Dashboard</h1>
        <p className="text-muted-foreground">
          Autonomous agents powered by A2A Protocol
        </p>
      </div>

      <Tabs defaultValue="price-agent" className="space-y-6">
        <TabsList>
          <TabsTrigger value="price-agent">Price Agent</TabsTrigger>
          <TabsTrigger value="coming-soon">Coming Soon</TabsTrigger>
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
                    Real-time cryptocurrency price data from DeFiLlama APIs
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={fetchPriceData}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  {lastUpdated && (
                    <Badge variant="secondary">
                      Updated {lastUpdated.toLocaleTimeString()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
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

        <TabsContent value="coming-soon" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>More Agents Coming Soon</CardTitle>
              <CardDescription>
                Additional autonomous agents will be added to the A2A Protocol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Stay tuned for more exciting agents powered by the A2A Protocol!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
