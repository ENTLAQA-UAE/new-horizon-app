"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  Monitor,
  Smartphone,
  GripVertical,
  Settings,
  Palette,
  LayoutGrid,
  Loader2,
  X,
  Image,
  Sparkles,
  Building2,
  BarChart3,
  MessageSquare,
  CreditCard,
  Building,
  ListOrdered,
  MousePointer,
  HelpCircle,
  Mail,
  Code,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  LandingPageBlock,
  LandingPageConfig,
  LandingBlockType,
  LandingPageSettings,
  defaultLandingConfig,
  defaultLandingBlocks,
  landingBlockLabels,
} from "@/lib/landing-page/types"
import { BlockEditor } from "./components/block-editor"
import { BlockPreview } from "./components/block-preview"

interface LandingPageBuilderProps {
  initialBlocks: LandingPageBlock[]
  initialConfig: LandingPageConfig
  platformLogo?: string | null
}

// Map icon name strings from landingBlockLabels to actual Lucide components
const blockIconMap: Record<string, LucideIcon> = {
  Image,
  Sparkles,
  Building2,
  BarChart3,
  MessageSquare,
  CreditCard,
  Building,
  ListOrdered,
  MousePointer,
  HelpCircle,
  Mail,
  Code,
}

const fontFamilies = [
  "Inter",
  "Poppins",
  "DM Sans",
  "Montserrat",
  "Raleway",
  "Plus Jakarta Sans",
  "Outfit",
  "Manrope",
  "Rubik",
  "Cairo",
  "Tajawal",
  "IBM Plex Sans Arabic",
]

export function LandingPageBuilder({
  initialBlocks,
  initialConfig,
  platformLogo,
}: LandingPageBuilderProps) {
  const [blocks, setBlocks] = useState<LandingPageBlock[]>(initialBlocks)
  const [config, setConfig] = useState<LandingPageConfig>({
    ...defaultLandingConfig,
    ...initialConfig,
    settings: { ...defaultLandingConfig.settings, ...initialConfig.settings },
    styles: { ...defaultLandingConfig.styles, ...initialConfig.styles },
  })
  const [isSaving, setIsSaving] = useState(false)
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("blocks")
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")

  const settings = config.settings || defaultLandingConfig.settings

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/admin/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks, config }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save")
      }

      toast.success("Landing page saved successfully")
    } catch (error) {
      console.error("Error saving:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save landing page")
    } finally {
      setIsSaving(false)
    }
  }

  const addBlock = (type: LandingBlockType) => {
    const template = defaultLandingBlocks[type]
    const newBlock: LandingPageBlock = {
      id: crypto.randomUUID(),
      type,
      order: blocks.length,
      enabled: true,
      content: template.content ?? {},
      styles: template.styles ?? {},
    }
    setBlocks([...blocks, newBlock])
  }

  const updateBlock = (id: string, updates: Partial<LandingPageBlock>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id))
    if (editingBlock === id) setEditingBlock(null)
  }

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id)
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === blocks.length - 1)
    )
      return
    const newBlocks = [...blocks]
    const swap = direction === "up" ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[swap]] = [newBlocks[swap], newBlocks[index]]
    setBlocks(newBlocks)
  }

  const toggleBlock = (id: string) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)))
  }

  const updateConfig = (updates: Partial<LandingPageConfig>) => {
    setConfig({ ...config, ...updates })
  }

  const updateStyles = (updates: any) => {
    setConfig({ ...config, styles: { ...config.styles, ...updates } })
  }

  const updateSettings = (updates: Partial<LandingPageSettings>) => {
    setConfig({ ...config, settings: { ...settings, ...updates } })
  }

  const editingBlockData = blocks.find((b) => b.id === editingBlock)

  // Blocks that are enabled and in order
  const enabledBlocks = blocks.filter((b) => b.enabled)

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* ── Top Toolbar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">Landing Page Builder</h1>
          <Badge variant="outline" className="text-xs">
            {blocks.filter((b) => b.enabled).length} blocks active
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Device toggle */}
          <div className="flex items-center border rounded-lg p-0.5">
            <button
              className={`p-1.5 rounded-md transition-colors ${previewMode === "desktop" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              onClick={() => setPreviewMode("desktop")}
              title="Desktop Preview"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              className={`p-1.5 rounded-md transition-colors ${previewMode === "mobile" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              onClick={() => setPreviewMode("mobile")}
              title="Mobile Preview"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          <a
            href="/landing"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </a>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* ── Main Content: Left Sidebar + Center Preview ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Controls */}
        <div className="w-[340px] shrink-0 border-r bg-white overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 rounded-none border-b h-11">
              <TabsTrigger value="blocks" className="text-xs gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                Blocks
              </TabsTrigger>
              <TabsTrigger value="styling" className="text-xs gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                Styling
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* ─── Blocks Tab ─── */}
            <TabsContent value="blocks" className="p-4 space-y-3 mt-0">
              {/* Block List */}
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                    editingBlock === block.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : block.enabled
                      ? "border-gray-200 hover:border-gray-300"
                      : "border-gray-100 bg-gray-50 opacity-60"
                  }`}
                  onClick={() => setEditingBlock(block.id)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                  {(() => {
                    const IconComp = blockIconMap[landingBlockLabels[block.type]?.icon]
                    return IconComp ? (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: editingBlock === block.id ? 'rgba(var(--primary), 0.1)' : '#f3f4f6' }}>
                        <IconComp className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ) : null
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {landingBlockLabels[block.type]?.en || block.type}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {landingBlockLabels[block.type]?.ar}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={block.enabled}
                      onCheckedChange={(e) => {
                        e // prevent propagation
                        toggleBlock(block.id)
                      }}
                      className="scale-75"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveBlock(block.id, "up")
                      }}
                      className="p-1 hover:bg-muted rounded"
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveBlock(block.id, "down")
                      }}
                      className="p-1 hover:bg-muted rounded"
                      disabled={index === blocks.length - 1}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeBlock(block.id)
                      }}
                      className="p-1 hover:bg-destructive/10 rounded text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Block */}
              <Separator className="my-4" />
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Add Block
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(Object.keys(landingBlockLabels) as LandingBlockType[]).map((type) => {
                  const exists = blocks.some((b) => b.type === type)
                  return (
                    <button
                      key={type}
                      disabled={exists}
                      onClick={() => addBlock(type)}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-gray-200 text-xs font-medium hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {(() => {
                        const AddIcon = blockIconMap[landingBlockLabels[type].icon]
                        return AddIcon ? <AddIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <Plus className="h-3.5 w-3.5 shrink-0" />
                      })()}
                      <span className="truncate">{landingBlockLabels[type].en}</span>
                    </button>
                  )
                })}
              </div>
            </TabsContent>

            {/* ─── Styling Tab ─── */}
            <TabsContent value="styling" className="p-4 space-y-5 mt-0">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  Colors
                </Label>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Primary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.styles.primaryColor}
                        onChange={(e) => updateStyles({ primaryColor: e.target.value })}
                        className="w-10 h-9 rounded border cursor-pointer"
                      />
                      <Input
                        value={config.styles.primaryColor}
                        onChange={(e) => updateStyles({ primaryColor: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Secondary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.styles.secondaryColor}
                        onChange={(e) => updateStyles({ secondaryColor: e.target.value })}
                        className="w-10 h-9 rounded border cursor-pointer"
                      />
                      <Input
                        value={config.styles.secondaryColor}
                        onChange={(e) => updateStyles({ secondaryColor: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Background Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.styles.backgroundColor}
                        onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                        className="w-10 h-9 rounded border cursor-pointer"
                      />
                      <Input
                        value={config.styles.backgroundColor}
                        onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Text Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.styles.textColor}
                        onChange={(e) => updateStyles({ textColor: e.target.value })}
                        className="w-10 h-9 rounded border cursor-pointer"
                      />
                      <Input
                        value={config.styles.textColor}
                        onChange={(e) => updateStyles({ textColor: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  Typography
                </Label>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Font Family</Label>
                    <Select
                      value={config.styles.fontFamily || "Inter"}
                      onValueChange={(v) => updateStyles({ fontFamily: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontFamilies.map((font) => (
                          <SelectItem key={font} value={font} className="text-xs">
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Font Size</Label>
                    <Select
                      value={config.styles.fontSize || "medium"}
                      onValueChange={(v: any) => updateStyles({ fontSize: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  Layout
                </Label>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Border Radius</Label>
                    <Select
                      value={config.styles.borderRadius || "12px"}
                      onValueChange={(v) => updateStyles({ borderRadius: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0px">None</SelectItem>
                        <SelectItem value="4px">Small</SelectItem>
                        <SelectItem value="8px">Medium</SelectItem>
                        <SelectItem value="12px">Large</SelectItem>
                        <SelectItem value="16px">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Header Style</Label>
                    <Select
                      value={config.styles.headerStyle || "standard"}
                      onValueChange={(v: any) => updateStyles({ headerStyle: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="bold">Bold (Colored)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Footer Style</Label>
                    <Select
                      value={config.styles.footerStyle || "detailed"}
                      onValueChange={(v: any) => updateStyles({ footerStyle: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  SEO
                </Label>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Page Title (EN)</Label>
                    <Input
                      value={config.seo.title || ""}
                      onChange={(e) => updateConfig({ seo: { ...config.seo, title: e.target.value } })}
                      className="h-9 text-xs"
                      placeholder="Landing Page Title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Page Title (AR)</Label>
                    <Input
                      value={config.seo.titleAr || ""}
                      onChange={(e) => updateConfig({ seo: { ...config.seo, titleAr: e.target.value } })}
                      className="h-9 text-xs"
                      dir="rtl"
                      placeholder="عنوان الصفحة"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Meta Description (EN)</Label>
                    <Input
                      value={config.seo.description || ""}
                      onChange={(e) => updateConfig({ seo: { ...config.seo, description: e.target.value } })}
                      className="h-9 text-xs"
                      placeholder="Page description"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Meta Description (AR)</Label>
                    <Input
                      value={config.seo.descriptionAr || ""}
                      onChange={(e) => updateConfig({ seo: { ...config.seo, descriptionAr: e.target.value } })}
                      className="h-9 text-xs"
                      dir="rtl"
                      placeholder="وصف الصفحة"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ─── Settings Tab ─── */}
            <TabsContent value="settings" className="p-4 space-y-5 mt-0">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  Display
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Show Header</Label>
                    <Switch
                      checked={settings.showHeader}
                      onCheckedChange={(v) => updateSettings({ showHeader: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Show Footer</Label>
                    <Switch
                      checked={settings.showFooter}
                      onCheckedChange={(v) => updateSettings({ showFooter: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Show Logo</Label>
                    <Switch
                      checked={settings.showLogo}
                      onCheckedChange={(v) => updateSettings({ showLogo: v })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  Language
                </Label>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Available Languages</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(v: any) => updateSettings({ language: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English Only</SelectItem>
                        <SelectItem value="ar">Arabic Only</SelectItem>
                        <SelectItem value="both">Both (EN + AR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Default Language</Label>
                    <Select
                      value={settings.defaultLanguage}
                      onValueChange={(v: any) => updateSettings({ defaultLanguage: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  Navbar
                </Label>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Logo URL</Label>
                    <Input
                      value={config.navbar.logoUrl || ""}
                      onChange={(e) => updateConfig({ navbar: { ...config.navbar, logoUrl: e.target.value } })}
                      className="h-9 text-xs"
                      placeholder="https://... (leave empty for platform logo)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">CTA Text (EN)</Label>
                      <Input
                        value={config.navbar.ctaText || ""}
                        onChange={(e) => updateConfig({ navbar: { ...config.navbar, ctaText: e.target.value } })}
                        className="h-9 text-xs"
                        placeholder="Get Started"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">CTA Text (AR)</Label>
                      <Input
                        value={config.navbar.ctaTextAr || ""}
                        onChange={(e) => updateConfig({ navbar: { ...config.navbar, ctaTextAr: e.target.value } })}
                        className="h-9 text-xs"
                        dir="rtl"
                        placeholder="ابدأ الآن"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CTA Link</Label>
                    <Input
                      value={config.navbar.ctaLink || ""}
                      onChange={(e) => updateConfig({ navbar: { ...config.navbar, ctaLink: e.target.value } })}
                      className="h-9 text-xs"
                      placeholder="/signup"
                    />
                  </div>
                  {/* Nav links */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Navigation Links</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          updateConfig({
                            navbar: {
                              ...config.navbar,
                              links: [...(config.navbar.links || []), { label: "New Link", labelAr: "رابط جديد", href: "#" }],
                            },
                          })
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {(config.navbar.links || []).map((link, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 border rounded-lg">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            value={link.label}
                            onChange={(e) => {
                              const links = [...(config.navbar.links || [])]
                              links[i] = { ...links[i], label: e.target.value }
                              updateConfig({ navbar: { ...config.navbar, links } })
                            }}
                            className="h-7 text-xs"
                            placeholder="Label (EN)"
                          />
                          <Input
                            value={link.labelAr || ""}
                            onChange={(e) => {
                              const links = [...(config.navbar.links || [])]
                              links[i] = { ...links[i], labelAr: e.target.value }
                              updateConfig({ navbar: { ...config.navbar, links } })
                            }}
                            className="h-7 text-xs"
                            dir="rtl"
                            placeholder="التسمية (AR)"
                          />
                          <Input
                            value={link.href}
                            onChange={(e) => {
                              const links = [...(config.navbar.links || [])]
                              links[i] = { ...links[i], href: e.target.value }
                              updateConfig({ navbar: { ...config.navbar, links } })
                            }}
                            className="h-7 text-xs"
                            placeholder="#section or /path"
                          />
                        </div>
                        <button
                          className="p-1 text-destructive hover:bg-destructive/10 rounded shrink-0 mt-0.5"
                          onClick={() => {
                            const links = (config.navbar.links || []).filter((_, idx) => idx !== i)
                            updateConfig({ navbar: { ...config.navbar, links } })
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  Footer
                </Label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Company Name (EN)</Label>
                      <Input
                        value={config.footer.companyName || ""}
                        onChange={(e) => updateConfig({ footer: { ...config.footer, companyName: e.target.value } })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Company Name (AR)</Label>
                      <Input
                        value={config.footer.companyNameAr || ""}
                        onChange={(e) => updateConfig({ footer: { ...config.footer, companyNameAr: e.target.value } })}
                        className="h-9 text-xs"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description (EN)</Label>
                    <Input
                      value={config.footer.description || ""}
                      onChange={(e) => updateConfig({ footer: { ...config.footer, description: e.target.value } })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description (AR)</Label>
                    <Input
                      value={config.footer.descriptionAr || ""}
                      onChange={(e) => updateConfig({ footer: { ...config.footer, descriptionAr: e.target.value } })}
                      className="h-9 text-xs"
                      dir="rtl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Copyright (EN)</Label>
                      <Input
                        value={config.footer.copyright || ""}
                        onChange={(e) => updateConfig({ footer: { ...config.footer, copyright: e.target.value } })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Copyright (AR)</Label>
                      <Input
                        value={config.footer.copyrightAr || ""}
                        onChange={(e) => updateConfig({ footer: { ...config.footer, copyrightAr: e.target.value } })}
                        className="h-9 text-xs"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  {/* Footer links */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Footer Links</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          updateConfig({
                            footer: {
                              ...config.footer,
                              links: [...(config.footer.links || []), { label: "New Link", labelAr: "رابط جديد", href: "#" }],
                            },
                          })
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {(config.footer.links || []).map((link, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={link.label}
                          onChange={(e) => {
                            const links = [...(config.footer.links || [])]
                            links[i] = { ...links[i], label: e.target.value }
                            updateConfig({ footer: { ...config.footer, links } })
                          }}
                          className="h-7 text-xs"
                          placeholder="Label"
                        />
                        <Input
                          value={link.href}
                          onChange={(e) => {
                            const links = [...(config.footer.links || [])]
                            links[i] = { ...links[i], href: e.target.value }
                            updateConfig({ footer: { ...config.footer, links } })
                          }}
                          className="h-7 text-xs"
                          placeholder="/path"
                        />
                        <button
                          className="p-1 text-destructive hover:bg-destructive/10 rounded shrink-0"
                          onClick={() => {
                            const links = (config.footer.links || []).filter((_, idx) => idx !== i)
                            updateConfig({ footer: { ...config.footer, links } })
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Live Preview */}
        <div className="flex-1 bg-gray-100 overflow-y-auto p-6">
          <div
            className={`mx-auto bg-white shadow-xl rounded-xl overflow-hidden transition-all duration-300 ${
              previewMode === "mobile" ? "max-w-[375px]" : "max-w-[1200px]"
            }`}
            style={{
              border: previewMode === "mobile" ? "8px solid #1f2937" : undefined,
              borderRadius: previewMode === "mobile" ? "24px" : "12px",
            }}
          >
            <BlockPreview
              blocks={enabledBlocks}
              styles={config.styles}
              settings={settings}
              navbar={config.navbar}
              footer={config.footer}
              previewMode={previewMode}
              platformLogo={platformLogo}
            />
          </div>
        </div>
      </div>

      {/* ── Block Editor Sheet (Right Side) ── */}
      <Sheet open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
        <SheetContent className="w-[420px] sm:w-[440px] overflow-y-auto">
          {editingBlockData && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>{landingBlockLabels[editingBlockData.type]?.en || editingBlockData.type}</span>
                  <Badge variant={editingBlockData.enabled ? "default" : "secondary"} className="text-xs">
                    {editingBlockData.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </SheetTitle>
              </SheetHeader>
              <BlockEditor
                block={editingBlockData}
                onUpdate={(updates) => updateBlock(editingBlockData.id, updates)}
                pageStyles={config.styles}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
