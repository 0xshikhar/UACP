import Link from "next/link"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { ModeToggle } from "@/components/mode-toggle"
import InstructionsComponent from "@/components/InstructionsComponent"
import PixelBlast from "@/components/PixelBlast"

export default function Home() {
  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden">
      {/* PixelBlast Background */}
      <div className="absolute inset-0 z-0">
        <PixelBlast
          variant="circle"
          pixelSize={4}
          color="#B19EEF"
          patternScale={1.5}
          patternDensity={0.8}
          enableRipples={true}
          rippleIntensityScale={1.2}
          rippleThickness={0.15}
          rippleSpeed={0.4}
          speed={0.3}
          transparent={true}
          edgeFade={0.3}
          className="opacity-60"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <InstructionsComponent />
      </div>
    </main>
  )
}
