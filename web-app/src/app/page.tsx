import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import PixelBlast from "@/components/PixelBlast"

export default function Home() {
  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden">
      {/* PixelBlast Background */}
      <div className="absolute inset-0 z-0">
        <PixelBlast
          variant="circle"
          pixelSize={3}
          color="#B19EEF"
          patternScale={2.5}
          patternDensity={1.2}
          enableRipples={true}
          rippleIntensityScale={2.0}
          rippleThickness={0.2}
          rippleSpeed={0.6}
          speed={0.5}
          transparent={true}
          edgeFade={0.1}
          className="opacity-90"
        />
      </div>
      
      {/* A2A Protocol Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
          A2A Protocol
        </h1>
        
        <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl leading-relaxed drop-shadow-md">
          Agent-to-Agent Communication Protocol
        </p>
        
        <p className="text-lg text-white/95 mb-8 max-w-3xl leading-relaxed drop-shadow-md">
          A revolutionary protocol enabling seamless communication between autonomous agents. 
          Built for the future of decentralized AI interactions and smart contract automation.
        </p>
        
        {/* Pixelated Text */}
        <div className="mb-12">
          <p className="text-sm text-white/70 font-mono tracking-wider drop-shadow-sm">
            [PIXELATED] DECENTRALIZED • AUTONOMOUS • FUTURE-READY [PIXELATED]
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <Link
            href="/token"
            className="px-12 py-6 text-xl font-bold text-white border-2 border-white hover:bg-white hover:text-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Start Building
          </Link>
          
          <Link
            href="/nft"
            className="px-12 py-6 text-xl font-bold text-white border-2 border-white hover:bg-white hover:text-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Explore Protocol
          </Link>
        </div>
      </div>
    </main>
  )
}
