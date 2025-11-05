import { SiteConfig } from "@/types"

import { env } from "@/env.mjs"

export const siteConfig: SiteConfig = {
  name: "UACP",
  author: "0xShikhar",
  description:
    "Universal Agent Communication Protocol",
  keywords: ["Next.js", "React", "Tailwind CSS", "Radix UI", "shadcn/ui", "wagmi", "rainbowkit", "prisma"],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "https://0xshikhar.xyz",
  },
  links: {
    github: "https://github.com/0xShikhar/uacp",
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/og.jpg`,
}
