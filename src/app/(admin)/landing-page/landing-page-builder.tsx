"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Save,
  RefreshCw,
  CheckCircle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  Palette,
  Settings,
  LayoutList,
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
  GripVertical,
} from "lucide-react"
import { toast } from "sonner"
import {
  LandingPageBlock,
  LandingPageConfig,
  LandingBlockType,
  LandingBlockContent,
  LandingContentItem,
  defaultLandingBlocks,
  landingBlockLabels,
  defaultLandingConfig,
} from "@/lib/landing-page/types"

const blockIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Image, Sparkles, Building2, BarChart3, MessageSquare,
  CreditCard, Building, ListOrdered, MousePointer,
  HelpCircle, Mail, Code,
}

interface BuilderProps {
  initialBlocks: LandingPageBlock[]
  initialConfig: LandingPageConfig
}

export function LandingPageBuilder({ initialBlocks, initialConfig }: BuilderProps) {
  const [blocks, setBlocks] = useState<LandingPageBlock[]>(initialBlocks)
  const [config, setConfig] = useState<LandingPageConfig>(initialConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("blocks")

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
    setEditingBlock(newBlock.id)
  }

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id))
    if (editingBlock === id) setEditingBlock(null)
  }

  const toggleBlock = (id: string) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)))
  }

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id)
    if (direction === "up" && index > 0) {
      const newBlocks = [...blocks]
      ;[newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]]
      setBlocks(newBlocks)
    } else if (direction === "down" && index < blocks.length - 1) {
      const newBlocks = [...blocks]
      ;[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]]
      setBlocks(newBlocks)
    }
  }

  const updateBlockContent = (id: string, content: Partial<LandingBlockContent>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b)))
  }

  const updateBlockItem = (blockId: string, itemId: string, updates: Partial<LandingContentItem>) => {
    setBlocks(blocks.map((b) => {
      if (b.id !== blockId) return b
      const items = (b.content.items || []).map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
      return { ...b, content: { ...b.content, items } }
    }))
  }

  const addBlockItem = (blockId: string) => {
    setBlocks(blocks.map((b) => {
      if (b.id !== blockId) return b
      const items = [...(b.content.items || []), { id: crypto.randomUUID(), title: 'New Item', description: '' }]
      return { ...b, content: { ...b.content, items } }
    }))
  }

  const removeBlockItem = (blockId: string, itemId: string) => {
    setBlocks(blocks.map((b) => {
      if (b.id !== blockId) return b
      const items = (b.content.items || []).filter((item) => item.id !== itemId)
      return { ...b, content: { ...b.content, items } }
    }))
  }

  const getIcon = (iconName: string) => {
    return blockIcons[iconName] || Globe
  }

  const editingBlockData = blocks.find((b) => b.id === editingBlock)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Landing Page Builder</h2>
          <p className="text-muted-foreground">
            Customize the public landing page for Kawadir
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={config.published ? "default" : "secondary"}>
            {config.published ? "Published" : "Draft"}
          </Badge>
          <Button
            variant="outline"
            onClick={() => setConfig({ ...config, published: !config.published })}
          >
            {config.published ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {config.published ? "Unpublish" : "Publish"}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("/landing", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="blocks" className="gap-2">
            <LayoutList className="h-4 w-4" />
            Blocks
          </TabsTrigger>
          <TabsTrigger value="styling" className="gap-2">
            <Palette className="h-4 w-4" />
            Styling & SEO
          </TabsTrigger>
          <TabsTrigger value="navbar-footer" className="gap-2">
            <Settings className="h-4 w-4" />
            Navbar & Footer
          </TabsTrigger>
        </TabsList>

        {/* ── Blocks Tab ── */}
        <TabsContent value="blocks" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Block List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Page Sections</h3>
                <Select onValueChange={(v) => addBlock(v as LandingBlockType)}>
                  <SelectTrigger className="w-[180px]">
                    <Plus className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Add section" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(landingBlockLabels).map(([type, label]) => (
                      <SelectItem key={type} value={type}>
                        {label.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {blocks.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <LayoutList className="h-10 w-10 mb-3" />
                    <p className="font-medium">No sections yet</p>
                    <p className="text-sm">Add your first section to get started</p>
                  </CardContent>
                </Card>
              )}

              {blocks.map((block, index) => {
                const label = landingBlockLabels[block.type]
                const IconComp = getIcon(label?.icon || 'Globe')
                return (
                  <Card
                    key={block.id}
                    className={`cursor-pointer transition-all ${
                      editingBlock === block.id
                        ? "ring-2 ring-primary border-primary"
                        : "hover:border-primary/50"
                    } ${!block.enabled ? "opacity-60" : ""}`}
                    onClick={() => setEditingBlock(block.id)}
                  >
                    <CardContent className="flex items-center gap-3 py-3 px-4">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <IconComp className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{label?.en || block.type}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {block.content.title || 'No title set'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleBlock(block.id)}
                        >
                          {block.enabled ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === 0}
                          onClick={() => moveBlock(block.id, "up")}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === blocks.length - 1}
                          onClick={() => moveBlock(block.id, "down")}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeBlock(block.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Right: Block Editor */}
            <div>
              {editingBlockData ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Edit: {landingBlockLabels[editingBlockData.type]?.en}
                    </CardTitle>
                    <CardDescription>Configure the content for this section</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <BlockEditor
                      block={editingBlockData}
                      onUpdateContent={(content) => updateBlockContent(editingBlockData.id, content)}
                      onUpdateItem={(itemId, updates) => updateBlockItem(editingBlockData.id, itemId, updates)}
                      onAddItem={() => addBlockItem(editingBlockData.id)}
                      onRemoveItem={(itemId) => removeBlockItem(editingBlockData.id, itemId)}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <MousePointer className="h-10 w-10 mb-3" />
                    <p className="font-medium">Select a section to edit</p>
                    <p className="text-sm">Click on any section from the list</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Styling & SEO Tab ── */}
        <TabsContent value="styling" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Colors & Typography</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.styles.primaryColor}
                        onChange={(e) => setConfig({ ...config, styles: { ...config.styles, primaryColor: e.target.value } })}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={config.styles.primaryColor}
                        onChange={(e) => setConfig({ ...config, styles: { ...config.styles, primaryColor: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.styles.secondaryColor}
                        onChange={(e) => setConfig({ ...config, styles: { ...config.styles, secondaryColor: e.target.value } })}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={config.styles.secondaryColor}
                        onChange={(e) => setConfig({ ...config, styles: { ...config.styles, secondaryColor: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.styles.backgroundColor}
                        onChange={(e) => setConfig({ ...config, styles: { ...config.styles, backgroundColor: e.target.value } })}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={config.styles.backgroundColor}
                        onChange={(e) => setConfig({ ...config, styles: { ...config.styles, backgroundColor: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.styles.textColor}
                        onChange={(e) => setConfig({ ...config, styles: { ...config.styles, textColor: e.target.value } })}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={config.styles.textColor}
                        onChange={(e) => setConfig({ ...config, styles: { ...config.styles, textColor: e.target.value } })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Border Radius</Label>
                  <Select
                    value={config.styles.borderRadius}
                    onValueChange={(v) => setConfig({ ...config, styles: { ...config.styles, borderRadius: v } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0px">Square (0px)</SelectItem>
                      <SelectItem value="6px">Small (6px)</SelectItem>
                      <SelectItem value="12px">Medium (12px)</SelectItem>
                      <SelectItem value="16px">Large (16px)</SelectItem>
                      <SelectItem value="24px">Extra Large (24px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Search engine optimization for the landing page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Page Title (EN)</Label>
                  <Input
                    value={config.seo.title || ''}
                    onChange={(e) => setConfig({ ...config, seo: { ...config.seo, title: e.target.value } })}
                    placeholder="Kawadir - AI-Powered Recruitment"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Page Title (AR)</Label>
                  <Input
                    dir="rtl"
                    value={config.seo.titleAr || ''}
                    onChange={(e) => setConfig({ ...config, seo: { ...config.seo, titleAr: e.target.value } })}
                    placeholder="كوادر - منصة التوظيف"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description (EN)</Label>
                  <Textarea
                    value={config.seo.description || ''}
                    onChange={(e) => setConfig({ ...config, seo: { ...config.seo, description: e.target.value } })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description (AR)</Label>
                  <Textarea
                    dir="rtl"
                    value={config.seo.descriptionAr || ''}
                    onChange={(e) => setConfig({ ...config, seo: { ...config.seo, descriptionAr: e.target.value } })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>OG Image URL</Label>
                  <Input
                    value={config.seo.ogImage || ''}
                    onChange={(e) => setConfig({ ...config, seo: { ...config.seo, ogImage: e.target.value } })}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Navbar & Footer Tab ── */}
        <TabsContent value="navbar-footer" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Navbar</CardTitle>
                <CardDescription>Configure the top navigation bar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.navbar.showLogo}
                    onChange={(e) => setConfig({ ...config, navbar: { ...config.navbar, showLogo: e.target.checked } })}
                    className="rounded"
                  />
                  <Label>Show Logo</Label>
                </div>
                <div className="space-y-2">
                  <Label>Logo URL (optional override)</Label>
                  <Input
                    value={config.navbar.logoUrl || ''}
                    onChange={(e) => setConfig({ ...config, navbar: { ...config.navbar, logoUrl: e.target.value } })}
                    placeholder="Uses platform logo by default"
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA Button Text (EN)</Label>
                    <Input
                      value={config.navbar.ctaText || ''}
                      onChange={(e) => setConfig({ ...config, navbar: { ...config.navbar, ctaText: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Button Text (AR)</Label>
                    <Input
                      dir="rtl"
                      value={config.navbar.ctaTextAr || ''}
                      onChange={(e) => setConfig({ ...config, navbar: { ...config.navbar, ctaTextAr: e.target.value } })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>CTA Button Link</Label>
                  <Input
                    value={config.navbar.ctaLink || ''}
                    onChange={(e) => setConfig({ ...config, navbar: { ...config.navbar, ctaLink: e.target.value } })}
                  />
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Navigation Links</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const links = [...(config.navbar.links || []), { label: 'New Link', href: '#' }]
                        setConfig({ ...config, navbar: { ...config.navbar, links } })
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Link
                    </Button>
                  </div>
                  {(config.navbar.links || []).map((link, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        value={link.label}
                        onChange={(e) => {
                          const links = [...(config.navbar.links || [])]
                          links[i] = { ...links[i], label: e.target.value }
                          setConfig({ ...config, navbar: { ...config.navbar, links } })
                        }}
                        placeholder="Label"
                        className="flex-1"
                      />
                      <Input
                        value={link.href}
                        onChange={(e) => {
                          const links = [...(config.navbar.links || [])]
                          links[i] = { ...links[i], href: e.target.value }
                          setConfig({ ...config, navbar: { ...config.navbar, links } })
                        }}
                        placeholder="#section"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive"
                        onClick={() => {
                          const links = (config.navbar.links || []).filter((_, j) => j !== i)
                          setConfig({ ...config, navbar: { ...config.navbar, links } })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Footer</CardTitle>
                <CardDescription>Configure the bottom footer section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name (EN)</Label>
                    <Input
                      value={config.footer.companyName || ''}
                      onChange={(e) => setConfig({ ...config, footer: { ...config.footer, companyName: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Name (AR)</Label>
                    <Input
                      dir="rtl"
                      value={config.footer.companyNameAr || ''}
                      onChange={(e) => setConfig({ ...config, footer: { ...config.footer, companyNameAr: e.target.value } })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description (EN)</Label>
                  <Textarea
                    value={config.footer.description || ''}
                    onChange={(e) => setConfig({ ...config, footer: { ...config.footer, description: e.target.value } })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (AR)</Label>
                  <Textarea
                    dir="rtl"
                    value={config.footer.descriptionAr || ''}
                    onChange={(e) => setConfig({ ...config, footer: { ...config.footer, descriptionAr: e.target.value } })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Copyright (EN)</Label>
                    <Input
                      value={config.footer.copyright || ''}
                      onChange={(e) => setConfig({ ...config, footer: { ...config.footer, copyright: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Copyright (AR)</Label>
                    <Input
                      dir="rtl"
                      value={config.footer.copyrightAr || ''}
                      onChange={(e) => setConfig({ ...config, footer: { ...config.footer, copyrightAr: e.target.value } })}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Footer Links</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const links = [...(config.footer.links || []), { label: 'New Link', href: '#' }]
                        setConfig({ ...config, footer: { ...config.footer, links } })
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Link
                    </Button>
                  </div>
                  {(config.footer.links || []).map((link, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        value={link.label}
                        onChange={(e) => {
                          const links = [...(config.footer.links || [])]
                          links[i] = { ...links[i], label: e.target.value }
                          setConfig({ ...config, footer: { ...config.footer, links } })
                        }}
                        placeholder="Label"
                        className="flex-1"
                      />
                      <Input
                        value={link.href}
                        onChange={(e) => {
                          const links = [...(config.footer.links || [])]
                          links[i] = { ...links[i], href: e.target.value }
                          setConfig({ ...config, footer: { ...config.footer, links } })
                        }}
                        placeholder="/page"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive"
                        onClick={() => {
                          const links = (config.footer.links || []).filter((_, j) => j !== i)
                          setConfig({ ...config, footer: { ...config.footer, links } })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Block Editor Component ─────────────────────────────────────────
interface BlockEditorProps {
  block: LandingPageBlock
  onUpdateContent: (content: Partial<LandingBlockContent>) => void
  onUpdateItem: (itemId: string, updates: Partial<LandingContentItem>) => void
  onAddItem: () => void
  onRemoveItem: (itemId: string) => void
}

function BlockEditor({ block, onUpdateContent, onUpdateItem, onAddItem, onRemoveItem }: BlockEditorProps) {
  const hasItems = ['features', 'stats', 'testimonials', 'pricing', 'clients', 'how_it_works', 'faq'].includes(block.type)

  return (
    <div className="space-y-4">
      {/* Common Fields */}
      {block.type !== 'custom' && (
        <>
          {block.type === 'hero' && block.content.badge !== undefined && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Badge (EN)</Label>
                <Input
                  value={block.content.badge || ''}
                  onChange={(e) => onUpdateContent({ badge: e.target.value })}
                  placeholder="Badge text"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Badge (AR)</Label>
                <Input
                  dir="rtl"
                  value={block.content.badgeAr || ''}
                  onChange={(e) => onUpdateContent({ badgeAr: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title (EN)</Label>
              <Input
                value={block.content.title || ''}
                onChange={(e) => onUpdateContent({ title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Title (AR)</Label>
              <Input
                dir="rtl"
                value={block.content.titleAr || ''}
                onChange={(e) => onUpdateContent({ titleAr: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Subtitle (EN)</Label>
              <Textarea
                value={block.content.subtitle || ''}
                onChange={(e) => onUpdateContent({ subtitle: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subtitle (AR)</Label>
              <Textarea
                dir="rtl"
                value={block.content.subtitleAr || ''}
                onChange={(e) => onUpdateContent({ subtitleAr: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {block.type === 'about' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Description (EN)</Label>
                <Textarea
                  value={block.content.description || ''}
                  onChange={(e) => onUpdateContent({ description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description (AR)</Label>
                <Textarea
                  dir="rtl"
                  value={block.content.descriptionAr || ''}
                  onChange={(e) => onUpdateContent({ descriptionAr: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* CTA Fields */}
          {(block.type === 'hero' || block.type === 'cta') && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary Button (EN)</Label>
                  <Input
                    value={block.content.ctaText || ''}
                    onChange={(e) => onUpdateContent({ ctaText: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary Button (AR)</Label>
                  <Input
                    dir="rtl"
                    value={block.content.ctaTextAr || ''}
                    onChange={(e) => onUpdateContent({ ctaTextAr: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Primary Button Link</Label>
                <Input
                  value={block.content.ctaLink || ''}
                  onChange={(e) => onUpdateContent({ ctaLink: e.target.value })}
                  placeholder="/signup"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Secondary Button (EN)</Label>
                  <Input
                    value={block.content.secondaryCtaText || ''}
                    onChange={(e) => onUpdateContent({ secondaryCtaText: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Secondary Button (AR)</Label>
                  <Input
                    dir="rtl"
                    value={block.content.secondaryCtaTextAr || ''}
                    onChange={(e) => onUpdateContent({ secondaryCtaTextAr: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Secondary Button Link</Label>
                <Input
                  value={block.content.secondaryCtaLink || ''}
                  onChange={(e) => onUpdateContent({ secondaryCtaLink: e.target.value })}
                  placeholder="#contact"
                />
              </div>
            </>
          )}

          {/* Hero Background */}
          {block.type === 'hero' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Background Image URL</Label>
              <Input
                value={block.content.backgroundImage || ''}
                onChange={(e) => onUpdateContent({ backgroundImage: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}

          {/* Contact Fields */}
          {block.type === 'contact' && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={block.content.email || ''}
                    onChange={(e) => onUpdateContent({ email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={block.content.phone || ''}
                    onChange={(e) => onUpdateContent({ phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Address (EN)</Label>
                    <Input
                      value={block.content.address || ''}
                      onChange={(e) => onUpdateContent({ address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Address (AR)</Label>
                    <Input
                      dir="rtl"
                      value={block.content.addressAr || ''}
                      onChange={(e) => onUpdateContent({ addressAr: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Custom HTML */}
      {block.type === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">HTML (EN)</Label>
            <Textarea
              value={block.content.html || ''}
              onChange={(e) => onUpdateContent({ html: e.target.value })}
              rows={8}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">HTML (AR)</Label>
            <Textarea
              dir="rtl"
              value={block.content.htmlAr || ''}
              onChange={(e) => onUpdateContent({ htmlAr: e.target.value })}
              rows={8}
              className="font-mono text-xs"
            />
          </div>
        </div>
      )}

      {/* Items Editor */}
      {hasItems && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Items ({(block.content.items || []).length})</Label>
            <Button variant="outline" size="sm" onClick={onAddItem}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {(block.content.items || []).map((item, idx) => (
              <Card key={item.id} className="bg-muted/30">
                <CardContent className="py-3 px-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {block.type === 'how_it_works' ? `Step ${idx + 1}` : `Item ${idx + 1}`}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Icon field for feature-type items */}
                  {['features', 'how_it_works'].includes(block.type) && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Icon (Lucide name)</Label>
                      <Input
                        value={item.icon || ''}
                        onChange={(e) => onUpdateItem(item.id, { icon: e.target.value })}
                        placeholder="e.g. Zap, Users, Shield"
                        className="text-xs"
                      />
                    </div>
                  )}

                  {/* Image field for testimonials, clients */}
                  {['testimonials', 'clients'].includes(block.type) && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Image URL</Label>
                      <Input
                        value={item.image || item.authorImage || ''}
                        onChange={(e) => onUpdateItem(item.id, block.type === 'testimonials' ? { authorImage: e.target.value } : { image: e.target.value })}
                        placeholder="https://..."
                        className="text-xs"
                      />
                    </div>
                  )}

                  {/* Stats: value + label */}
                  {block.type === 'stats' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={item.value || ''}
                          onChange={(e) => onUpdateItem(item.id, { value: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={item.label || ''}
                          onChange={(e) => onUpdateItem(item.id, { label: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Value (AR)</Label>
                        <Input
                          dir="rtl"
                          value={item.valueAr || ''}
                          onChange={(e) => onUpdateItem(item.id, { valueAr: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Label (AR)</Label>
                        <Input
                          dir="rtl"
                          value={item.labelAr || ''}
                          onChange={(e) => onUpdateItem(item.id, { labelAr: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Title + Description for non-stats */}
                  {block.type !== 'stats' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Title (EN)</Label>
                          <Input
                            value={item.title || ''}
                            onChange={(e) => onUpdateItem(item.id, { title: e.target.value })}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Title (AR)</Label>
                          <Input
                            dir="rtl"
                            value={item.titleAr || ''}
                            onChange={(e) => onUpdateItem(item.id, { titleAr: e.target.value })}
                            className="text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Description (EN)</Label>
                          <Textarea
                            value={item.description || ''}
                            onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                            rows={2}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description (AR)</Label>
                          <Textarea
                            dir="rtl"
                            value={item.descriptionAr || ''}
                            onChange={(e) => onUpdateItem(item.id, { descriptionAr: e.target.value })}
                            rows={2}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Testimonial author */}
                  {block.type === 'testimonials' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Author</Label>
                        <Input
                          value={item.author || ''}
                          onChange={(e) => onUpdateItem(item.id, { author: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Author Role</Label>
                        <Input
                          value={item.authorRole || ''}
                          onChange={(e) => onUpdateItem(item.id, { authorRole: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pricing fields */}
                  {block.type === 'pricing' && (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Price</Label>
                          <Input
                            value={item.price || ''}
                            onChange={(e) => onUpdateItem(item.id, { price: e.target.value })}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Period</Label>
                          <Input
                            value={item.period || ''}
                            onChange={(e) => onUpdateItem(item.id, { period: e.target.value })}
                            className="text-xs"
                            placeholder="/month"
                          />
                        </div>
                        <div className="flex items-end gap-2 pb-0.5">
                          <input
                            type="checkbox"
                            checked={item.featured || false}
                            onChange={(e) => onUpdateItem(item.id, { featured: e.target.checked })}
                            className="rounded"
                          />
                          <Label className="text-xs">Featured</Label>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Features (one per line)</Label>
                        <Textarea
                          value={(item.features || []).join('\n')}
                          onChange={(e) => onUpdateItem(item.id, { features: e.target.value.split('\n') })}
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
