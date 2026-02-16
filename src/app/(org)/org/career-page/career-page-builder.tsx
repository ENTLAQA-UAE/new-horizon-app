"use client"

import { useState, useCallback } from "react"
import { supabaseInsert, supabaseUpdate, supabaseDelete } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Loader2,
  Monitor,
  Smartphone,
  Eye,
  Save,
  Globe,
  Plus,
  GripVertical,
  Trash2,
  Settings,
  Palette,
  Image as ImageIcon,
  Building2,
  Heart,
  Gift,
  Users,
  MessageSquare,
  Briefcase,
  BarChart3,
  Images,
  MousePointer,
  Mail,
  Code,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Check,
  Copy,
  Undo,
  Redo,
  Layout,
  Type,
} from "lucide-react"
import { KawadirIcon } from "@/components/ui/kawadir-icon"
import {
  BlockType,
  CareerPageBlock,
  CareerPageStyles,
  CareerPageSettings,
  defaultBlocks,
  blockLabels,
} from "@/lib/career-page/types"
import { BlockEditor } from "./components/block-editor"
import { BlockPreview } from "./components/block-preview"

interface Organization {
  id: string
  name: string
  name_ar: string | null
  slug: string
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  career_page_config: any
  career_page_published: boolean | null
}

interface CareerPageBuilderProps {
  organization: Organization
  initialBlocks: any[]
  jobsCount: number
}

const blockIcons: Record<BlockType, any> = {
  hero: ImageIcon,
  about: Building2,
  values: Heart,
  benefits: Gift,
  team: Users,
  testimonials: MessageSquare,
  jobs: Briefcase,
  stats: BarChart3,
  gallery: Images,
  cta: MousePointer,
  contact: Mail,
  custom: Code,
}

const defaultPageStyles: CareerPageStyles = {
  primaryColor: "#3B82F6",
  secondaryColor: "#10B981",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  fontFamily: "Inter",
  fontSize: "medium",
  borderRadius: "8px",
  headerStyle: "standard",
  footerStyle: "standard",
}

const defaultPageSettings: CareerPageSettings = {
  showHeader: true,
  showFooter: true,
  showLogo: true,
  showJobSearch: true,
  showJobFilters: true,
  language: "both",
  defaultLanguage: "en",
}

export function CareerPageBuilder({
  organization,
  initialBlocks,
  jobsCount,
}: CareerPageBuilderProps) {
  // Parse initial config
  const initialConfig = organization.career_page_config || {}
  const [blocks, setBlocks] = useState<CareerPageBlock[]>(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      return initialBlocks.map((b: any) => ({
        id: b.id,
        type: b.block_type as BlockType,
        order: b.block_order,
        enabled: b.enabled,
        content: b.content || {},
        styles: b.styles || {},
      }))
    }
    // Return default blocks for new setup
    return [
      { id: crypto.randomUUID(), ...defaultBlocks.hero, order: 0 } as CareerPageBlock,
      { id: crypto.randomUUID(), ...defaultBlocks.about, order: 1 } as CareerPageBlock,
      { id: crypto.randomUUID(), ...defaultBlocks.values, order: 2 } as CareerPageBlock,
      { id: crypto.randomUUID(), ...defaultBlocks.benefits, order: 3 } as CareerPageBlock,
      { id: crypto.randomUUID(), ...defaultBlocks.jobs, order: 4 } as CareerPageBlock,
    ]
  })

  const [pageStyles, setPageStyles] = useState<CareerPageStyles>({
    ...defaultPageStyles,
    primaryColor: organization.primary_color || defaultPageStyles.primaryColor,
    secondaryColor: organization.secondary_color || defaultPageStyles.secondaryColor,
    ...(initialConfig.styles || {}),
  })

  const [pageSettings, setPageSettings] = useState<CareerPageSettings>({
    ...defaultPageSettings,
    ...(initialConfig.settings || {}),
  })

  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [selectedBlock, setSelectedBlock] = useState<CareerPageBlock | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [activeTab, setActiveTab] = useState<"blocks" | "styling" | "settings">("blocks")
  const [isPublished, setIsPublished] = useState(organization.career_page_published || false)

  const careersUrl = typeof window !== "undefined"
    ? `${window.location.origin}/careers/${organization.slug}`
    : `/careers/${organization.slug}`

  // Add a new block
  const addBlock = useCallback((type: BlockType) => {
    const template = defaultBlocks[type]
    const newBlock: CareerPageBlock = {
      id: crypto.randomUUID(),
      type,
      order: blocks.length,
      enabled: true,
      content: template?.content || {},
      styles: template?.styles || {},
    }
    setBlocks([...blocks, newBlock])
    setShowAddBlock(false)
    toast.success(`${blockLabels[type].en} block added`)
  }, [blocks])

  // Remove a block
  const removeBlock = useCallback((blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId))
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(null)
    }
    toast.success("Block removed")
  }, [blocks, selectedBlock])

  // Move block up/down
  const moveBlock = useCallback((blockId: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === blockId)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === blocks.length - 1) return

    const newBlocks = [...blocks]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]]

    // Update order values
    newBlocks.forEach((b, i) => {
      b.order = i
    })

    setBlocks(newBlocks)
  }, [blocks])

  // Toggle block enabled
  const toggleBlock = useCallback((blockId: string) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId ? { ...b, enabled: !b.enabled } : b
      )
    )
  }, [blocks])

  // Update block content/styles
  const updateBlock = useCallback((blockId: string, updates: Partial<CareerPageBlock>) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId ? { ...b, ...updates } : b
      )
    )
    if (selectedBlock?.id === blockId) {
      setSelectedBlock({ ...selectedBlock, ...updates })
    }
  }, [blocks, selectedBlock])

  // Save changes
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Delete existing blocks
      const { error: deleteError } = await supabaseDelete(
        "career_page_blocks",
        { column: "org_id", value: organization.id }
      )

      if (deleteError) throw deleteError

      // Insert new blocks
      if (blocks.length > 0) {
        const insertPromises = blocks.map((b, index) =>
          supabaseInsert("career_page_blocks", {
            org_id: organization.id,
            block_type: b.type,
            block_order: index,
            enabled: b.enabled,
            content: b.content,
            styles: b.styles,
          })
        )

        const insertResults = await Promise.all(insertPromises)
        const blocksError = insertResults.find(r => r.error)?.error
        if (blocksError) throw blocksError
      }

      // Update organization config (only career page config, NOT org branding colors)
      // Career page styling is stored in career_page_config.styles and is independent
      // from organization branding colors which are managed in /org/branding
      const { error: orgError } = await supabaseUpdate(
        "organizations",
        {
          career_page_config: {
            styles: pageStyles,
            settings: pageSettings,
          },
          updated_at: new Date().toISOString(),
        },
        { column: "id", value: organization.id }
      )

      if (orgError) throw orgError

      toast.success("Changes saved successfully")
    } catch (error) {
      console.error("Error saving:", error)
      toast.error("Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  // Publish/Unpublish
  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      // First save
      await handleSave()

      // Then toggle publish status
      const { error } = await supabaseUpdate(
        "organizations",
        {
          career_page_published: !isPublished,
          updated_at: new Date().toISOString(),
        },
        { column: "id", value: organization.id }
      )

      if (error) throw error

      setIsPublished(!isPublished)
      toast.success(isPublished ? "Career page unpublished" : "Career page published!")
    } catch (error) {
      console.error("Error publishing:", error)
      toast.error("Failed to publish")
    } finally {
      setIsPublishing(false)
    }
  }

  // Copy URL to clipboard
  const copyUrl = () => {
    navigator.clipboard.writeText(careersUrl)
    toast.success("URL copied to clipboard")
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Toolbar */}
      <div className="border-b bg-background px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Career Page Builder</h1>
          <Badge variant={isPublished ? "default" : "secondary"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Preview Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={previewMode === "desktop" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === "mobile" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Preview Link */}
          <Button variant="outline" size="sm" asChild>
            <a href={careersUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="mr-2 h-4 w-4" />
              Preview
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>

          {/* Copy URL */}
          <Button variant="outline" size="sm" onClick={copyUrl}>
            <Copy className="mr-2 h-4 w-4" />
            Copy URL
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Save Button */}
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>

          {/* Publish Button */}
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            variant={isPublished ? "outline" : "default"}
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Block Management */}
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 m-2">
              <TabsTrigger value="blocks" className="text-xs">
                <Layout className="h-3 w-3 mr-1" />
                Blocks
              </TabsTrigger>
              <TabsTrigger value="styling" className="text-xs">
                <Palette className="h-3 w-3 mr-1" />
                Styling
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="blocks" className="flex-1 flex flex-col m-0 p-2">
              {/* Add Block Button */}
              <Dialog open={showAddBlock} onOpenChange={setShowAddBlock}>
                <DialogTrigger asChild>
                  <Button className="w-full mb-3">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Block
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Block</DialogTitle>
                    <DialogDescription>
                      Choose a block type to add to your career page
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {(Object.keys(blockLabels) as BlockType[]).map((type) => {
                      const Icon = blockIcons[type]
                      return (
                        <button
                          key={type}
                          onClick={() => addBlock(type)}
                          className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <Icon className="h-6 w-6 mb-2 text-primary" />
                          <div className="font-medium text-sm">{blockLabels[type].en}</div>
                        </button>
                      )
                    })}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Blocks List */}
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-2">
                  {blocks.map((block, index) => {
                    const Icon = blockIcons[block.type]
                    const isSelected = selectedBlock?.id === block.id
                    return (
                      <div
                        key={block.id}
                        className={`
                          p-3 border rounded-lg cursor-pointer transition-all
                          ${isSelected ? "border-primary bg-primary/5" : "hover:border-muted-foreground/50"}
                          ${!block.enabled ? "opacity-50" : ""}
                        `}
                        onClick={() => setSelectedBlock(block)}
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <Icon className="h-4 w-4" />
                          <span className="flex-1 text-sm font-medium truncate">
                            {blockLabels[block.type].en}
                          </span>
                          <Switch
                            checked={block.enabled}
                            onCheckedChange={() => toggleBlock(block.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex items-center gap-1 mt-2 ml-6">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              moveBlock(block.id, "up")
                            }}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              moveBlock(block.id, "down")
                            }}
                            disabled={index === blocks.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <div className="flex-1" />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeBlock(block.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="styling" className="flex-1 m-0 p-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
              <div className="space-y-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Primary</Label>
                        <div className="flex gap-2 mt-1">
                          <div
                            className="w-8 h-8 rounded border cursor-pointer"
                            style={{ backgroundColor: pageStyles.primaryColor }}
                          />
                          <Input
                            value={pageStyles.primaryColor}
                            onChange={(e) =>
                              setPageStyles({ ...pageStyles, primaryColor: e.target.value })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Secondary</Label>
                        <div className="flex gap-2 mt-1">
                          <div
                            className="w-8 h-8 rounded border cursor-pointer"
                            style={{ backgroundColor: pageStyles.secondaryColor }}
                          />
                          <Input
                            value={pageStyles.secondaryColor}
                            onChange={(e) =>
                              setPageStyles({ ...pageStyles, secondaryColor: e.target.value })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Background</Label>
                        <div className="flex gap-2 mt-1">
                          <div
                            className="w-8 h-8 rounded border cursor-pointer"
                            style={{ backgroundColor: pageStyles.backgroundColor }}
                          />
                          <Input
                            value={pageStyles.backgroundColor}
                            onChange={(e) =>
                              setPageStyles({ ...pageStyles, backgroundColor: e.target.value })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Text</Label>
                        <div className="flex gap-2 mt-1">
                          <div
                            className="w-8 h-8 rounded border cursor-pointer"
                            style={{ backgroundColor: pageStyles.textColor }}
                          />
                          <Input
                            value={pageStyles.textColor}
                            onChange={(e) =>
                              setPageStyles({ ...pageStyles, textColor: e.target.value })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Typography</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Font Family</Label>
                      <Select
                        value={pageStyles.fontFamily}
                        onValueChange={(v) => setPageStyles({ ...pageStyles, fontFamily: v })}
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="DM Sans">DM Sans</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Raleway">Raleway</SelectItem>
                          <SelectItem value="Plus Jakarta Sans">Plus Jakarta Sans</SelectItem>
                          <SelectItem value="Outfit">Outfit</SelectItem>
                          <SelectItem value="Manrope">Manrope</SelectItem>
                          <SelectItem value="Rubik">Rubik</SelectItem>
                          <SelectItem value="Cairo">Cairo (Arabic)</SelectItem>
                          <SelectItem value="Tajawal">Tajawal (Arabic)</SelectItem>
                          <SelectItem value="IBM Plex Sans Arabic">IBM Plex Sans Arabic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Font Size</Label>
                      <Select
                        value={pageStyles.fontSize}
                        onValueChange={(v: any) => setPageStyles({ ...pageStyles, fontSize: v })}
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Border Radius</Label>
                      <Select
                        value={pageStyles.borderRadius}
                        onValueChange={(v) => setPageStyles({ ...pageStyles, borderRadius: v })}
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0px">None</SelectItem>
                          <SelectItem value="4px">Small (4px)</SelectItem>
                          <SelectItem value="8px">Medium (8px)</SelectItem>
                          <SelectItem value="12px">Large (12px)</SelectItem>
                          <SelectItem value="16px">Extra Large (16px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Header & Footer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Header Style</Label>
                      <Select
                        value={pageStyles.headerStyle}
                        onValueChange={(v: any) => setPageStyles({ ...pageStyles, headerStyle: v })}
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Footer Style</Label>
                      <Select
                        value={pageStyles.footerStyle}
                        onValueChange={(v: any) => setPageStyles({ ...pageStyles, footerStyle: v })}
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 m-0 p-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
              <div className="space-y-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Page Elements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Show Header</Label>
                      <Switch
                        checked={pageSettings.showHeader}
                        onCheckedChange={(v) =>
                          setPageSettings({ ...pageSettings, showHeader: v })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Show Footer</Label>
                      <Switch
                        checked={pageSettings.showFooter}
                        onCheckedChange={(v) =>
                          setPageSettings({ ...pageSettings, showFooter: v })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Show Logo</Label>
                      <Switch
                        checked={pageSettings.showLogo}
                        onCheckedChange={(v) =>
                          setPageSettings({ ...pageSettings, showLogo: v })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Show Job Search</Label>
                      <Switch
                        checked={pageSettings.showJobSearch}
                        onCheckedChange={(v) =>
                          setPageSettings({ ...pageSettings, showJobSearch: v })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Show Job Filters</Label>
                      <Switch
                        checked={pageSettings.showJobFilters}
                        onCheckedChange={(v) =>
                          setPageSettings({ ...pageSettings, showJobFilters: v })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Language</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Display Language</Label>
                      <Select
                        value={pageSettings.language}
                        onValueChange={(v: any) =>
                          setPageSettings({ ...pageSettings, language: v })
                        }
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English Only</SelectItem>
                          <SelectItem value="ar">Arabic Only</SelectItem>
                          <SelectItem value="both">Both (Switchable)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Default Language</Label>
                      <Select
                        value={pageSettings.defaultLanguage}
                        onValueChange={(v: any) =>
                          setPageSettings({ ...pageSettings, defaultLanguage: v })
                        }
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Thank You Page</CardTitle>
                    <CardDescription className="text-xs">Customize the page shown after a candidate submits an application</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Show Logo</Label>
                      <Switch
                        checked={pageSettings.thankYouPage?.showLogo !== false}
                        onCheckedChange={(v) =>
                          setPageSettings({
                            ...pageSettings,
                            thankYouPage: { ...pageSettings.thankYouPage, showLogo: v },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={pageSettings.thankYouPage?.title || ""}
                        onChange={(e) =>
                          setPageSettings({
                            ...pageSettings,
                            thankYouPage: { ...pageSettings.thankYouPage, showLogo: pageSettings.thankYouPage?.showLogo !== false, title: e.target.value },
                          })
                        }
                        placeholder="Application Submitted!"
                        className="h-8 mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Title (Arabic)</Label>
                      <Input
                        value={pageSettings.thankYouPage?.titleAr || ""}
                        onChange={(e) =>
                          setPageSettings({
                            ...pageSettings,
                            thankYouPage: { ...pageSettings.thankYouPage, showLogo: pageSettings.thankYouPage?.showLogo !== false, titleAr: e.target.value },
                          })
                        }
                        placeholder="تم تقديم الطلب!"
                        className="h-8 mt-1 text-xs"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Message</Label>
                      <Textarea
                        value={pageSettings.thankYouPage?.message || ""}
                        onChange={(e) =>
                          setPageSettings({
                            ...pageSettings,
                            thankYouPage: { ...pageSettings.thankYouPage, showLogo: pageSettings.thankYouPage?.showLogo !== false, message: e.target.value },
                          })
                        }
                        placeholder="Thank you for applying. We will review your application and get back to you soon."
                        className="mt-1 text-xs min-h-[60px]"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Message (Arabic)</Label>
                      <Textarea
                        value={pageSettings.thankYouPage?.messageAr || ""}
                        onChange={(e) =>
                          setPageSettings({
                            ...pageSettings,
                            thankYouPage: { ...pageSettings.thankYouPage, showLogo: pageSettings.thankYouPage?.showLogo !== false, messageAr: e.target.value },
                          })
                        }
                        placeholder="شكراً لتقديمك. سنراجع طلبك ونعود إليك قريباً."
                        className="mt-1 text-xs min-h-[60px]"
                        rows={3}
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Button Text</Label>
                      <Input
                        value={pageSettings.thankYouPage?.ctaText || ""}
                        onChange={(e) =>
                          setPageSettings({
                            ...pageSettings,
                            thankYouPage: { ...pageSettings.thankYouPage, showLogo: pageSettings.thankYouPage?.showLogo !== false, ctaText: e.target.value },
                          })
                        }
                        placeholder="View More Jobs"
                        className="h-8 mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Button Text (Arabic)</Label>
                      <Input
                        value={pageSettings.thankYouPage?.ctaTextAr || ""}
                        onChange={(e) =>
                          setPageSettings({
                            ...pageSettings,
                            thankYouPage: { ...pageSettings.thankYouPage, showLogo: pageSettings.thankYouPage?.showLogo !== false, ctaTextAr: e.target.value },
                          })
                        }
                        placeholder="عرض المزيد من الوظائف"
                        className="h-8 mt-1 text-xs"
                        dir="rtl"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Page Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Published Jobs:</span>
                      <span className="font-medium text-foreground">{jobsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Blocks:</span>
                      <span className="font-medium text-foreground">{blocks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Blocks:</span>
                      <span className="font-medium text-foreground">
                        {blocks.filter((b) => b.enabled).length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Preview Area */}
        <div className="flex-1 bg-muted/20 p-4 overflow-auto">
          <div
            className={`
              mx-auto bg-white shadow-lg rounded-lg overflow-hidden transition-all
              ${previewMode === "mobile" ? "max-w-[375px]" : "max-w-4xl"}
            `}
            style={{ backgroundColor: pageStyles.backgroundColor }}
          >
            <BlockPreview
              blocks={blocks.filter((b) => b.enabled)}
              styles={pageStyles}
              settings={pageSettings}
              organization={organization}
              jobsCount={jobsCount}
              previewMode={previewMode}
            />
          </div>
        </div>

        {/* Right Sidebar - Block Editor */}
        <Sheet open={!!selectedBlock} onOpenChange={(open) => !open && setSelectedBlock(null)}>
          <SheetContent className="w-96 sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {selectedBlock && (
                  <>
                    {(() => {
                      const Icon = blockIcons[selectedBlock.type]
                      return <Icon className="h-5 w-5" />
                    })()}
                    Edit {blockLabels[selectedBlock?.type || "hero"].en}
                  </>
                )}
              </SheetTitle>
              <SheetDescription>
                Configure the content and appearance of this block
              </SheetDescription>
            </SheetHeader>
            {selectedBlock && (
              <BlockEditor
                block={selectedBlock}
                onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                pageStyles={pageStyles}
                organizationId={organization.id}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
