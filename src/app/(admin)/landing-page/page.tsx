import { createClient } from "@/lib/supabase/server"
import { LandingPageBuilder } from "./landing-page-builder"
import { LandingPageBlock, LandingPageConfig, defaultLandingConfig, defaultLandingBlocks, LandingBlockType } from "@/lib/landing-page/types"

async function loadLandingPageData() {
  const supabase = await createClient()

  // Load blocks
  let blocks: LandingPageBlock[] = []
  try {
    const { data: blocksData, error: blocksError } = await supabase
      .from("landing_page_blocks")
      .select("*")
      .order("block_order")

    if (blocksError) {
      console.error("Error loading landing page blocks:", blocksError)
    }

    if (blocksData && blocksData.length > 0) {
      blocks = blocksData.map((b) => ({
        id: b.id,
        type: b.block_type as LandingBlockType,
        order: b.block_order,
        enabled: b.enabled,
        content: (b.content as any) ?? {},
        styles: (b.styles as any) ?? {},
      }))
    }
  } catch (error) {
    console.error("Error fetching landing page blocks:", error)
  }

  // If no blocks found, use defaults
  if (blocks.length === 0) {
    blocks = (
      Object.entries(defaultLandingBlocks) as [LandingBlockType, Partial<LandingPageBlock>][]
    ).map(([type, block], index) => ({
      id: crypto.randomUUID(),
      type,
      order: index,
      enabled: block.enabled ?? false,
      content: block.content ?? {},
      styles: block.styles ?? {},
    }))
  }

  // Load config from platform_settings
  let config: LandingPageConfig = defaultLandingConfig
  let platformLogo: string | null = null
  try {
    const { data: configData, error: configError } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["landing_page_config", "platform_logo"])

    if (configError) {
      console.error("Error loading landing page config:", configError)
    }

    if (configData && configData.length > 0) {
      for (const row of configData) {
        if (row.key === "landing_page_config") {
          try {
            const rawValue = row.value
            const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue
            config = { ...defaultLandingConfig, ...parsed }
          } catch {
            // Use defaults
          }
        }
        if (row.key === "platform_logo" && row.value) {
          let logoVal = row.value as string
          if (typeof logoVal === 'string' && logoVal.startsWith('"') && logoVal.endsWith('"')) {
            try { logoVal = JSON.parse(logoVal) } catch { /* keep as-is */ }
          }
          platformLogo = logoVal
        }
      }
    }
  } catch (error) {
    console.error("Error fetching landing page config:", error)
  }

  return { blocks, config, platformLogo }
}

export default async function LandingPageAdmin() {
  const { blocks, config, platformLogo } = await loadLandingPageData()

  return (
    <LandingPageBuilder
      initialBlocks={blocks}
      initialConfig={config}
      platformLogo={platformLogo}
    />
  )
}
