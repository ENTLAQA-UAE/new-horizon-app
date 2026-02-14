"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LandingPageBuilder } from "./landing-page-builder"
import { LandingPageBlock, LandingPageConfig, defaultLandingConfig, defaultLandingBlocks, LandingBlockType } from "@/lib/landing-page/types"
import { Loader2 } from "lucide-react"

export default function LandingPageAdmin() {
  const [blocks, setBlocks] = useState<LandingPageBlock[]>([])
  const [config, setConfig] = useState<LandingPageConfig>(defaultLandingConfig)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      try {
        // Load blocks
        const { data: blocksData, error: blocksError } = await supabase
          .from("landing_page_blocks")
          .select("*")
          .order("block_order")

        if (blocksError) {
          console.error("Error loading landing page blocks:", blocksError)
        }

        if (blocksData && blocksData.length > 0) {
          setBlocks(
            blocksData.map((b) => ({
              id: b.id,
              type: b.block_type as LandingBlockType,
              order: b.block_order,
              enabled: b.enabled,
              content: b.content as any,
              styles: b.styles as any,
            }))
          )
        } else {
          // Load defaults for first time
          const defaultBlocksList: LandingPageBlock[] = (
            Object.entries(defaultLandingBlocks) as [LandingBlockType, Partial<LandingPageBlock>][]
          ).map(([type, block], index) => ({
            id: crypto.randomUUID(),
            type,
            order: index,
            enabled: block.enabled ?? false,
            content: block.content ?? {},
            styles: block.styles ?? {},
          }))
          setBlocks(defaultBlocksList)
        }

        // Load config from platform_settings
        const { data: configData, error: configError } = await supabase
          .from("platform_settings")
          .select("key, value")
          .in("key", ["landing_page_config"])

        if (configError) {
          console.error("Error loading landing page config:", configError)
        }

        if (configData && configData.length > 0) {
          try {
            const parsed = JSON.parse(configData[0].value as string)
            setConfig({ ...defaultLandingConfig, ...parsed })
          } catch {
            // Use defaults
          }
        }
      } catch (error) {
        console.error("Error loading landing page data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <LandingPageBuilder
      initialBlocks={blocks}
      initialConfig={config}
    />
  )
}
