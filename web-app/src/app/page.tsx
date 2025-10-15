import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import PixelBlast from "@/components/PixelBlast"

export default function Home() {
  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden bg-black">
      {/* PixelBlast Background */}
      <div className="absolute inset-0 z-0">
        <PixelBlast
          variant="square"
          pixelSize={3}
          color="#8B7355"
          patternScale={2}
          patternDensity={1.2}
          enableRipples={true}
          rippleIntensityScale={1.8}
          rippleThickness={0.2}
          rippleSpeed={0.5}
          speed={0.4}
          transparent={true}
          edgeFade={0.1}
          className="opacity-80"
        />
      </div>
      
      {/* A2A Protocol Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-[#FFF8E7] mb-6 tracking-tight drop-shadow-lg">
          A2A Protocol
        </h1>
        
        <p className="text-lg md:text-xl text-[#D4A574] mb-6 max-w-2xl leading-relaxed drop-shadow-md">
          Agent-to-Agent Communication Protocol
        </p>
        
        <p className="text-base text-[#FFF8E7]/90 mb-8 max-w-3xl leading-relaxed drop-shadow-md">
          A revolutionary protocol enabling seamless communication between autonomous agents. 
          Built for the future of decentralized AI interactions and smart contract automation.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/token"
            className="px-6 py-3 text-sm font-bold text-white bg-[#8B7355] border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200"
          >
            Start Building
          </Link>
          
          <Link
            href="/explore"
            className="px-6 py-3 text-sm font-bold text-white bg-[#D4A574] border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200"
          >
            Explore Protocol
          </Link>
        </div>
      </div>
    </main>
  )
}
