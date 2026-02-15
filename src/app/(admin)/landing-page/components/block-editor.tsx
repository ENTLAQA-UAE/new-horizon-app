"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Trash2,
  GripVertical,
  Upload,
  Image as ImageIcon,
  Loader2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { getAccessToken } from "@/lib/supabase/auth-fetch"
import {
  LandingPageBlock,
  LandingPageStyles,
  LandingBlockStyles,
  LandingContentItem,
} from "@/lib/landing-page/types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

interface BlockEditorProps {
  block: LandingPageBlock
  onUpdate: (updates: Partial<LandingPageBlock>) => void
  pageStyles: LandingPageStyles
}

const iconOptions = [
  "Zap", "Users", "BarChart3", "Globe", "Shield", "Briefcase",
  "Heart", "Rocket", "UserPlus", "FileText", "CheckCircle", "Star",
  "Target", "TrendingUp", "Lightbulb", "Clock", "Award", "Layers",
  "MousePointer", "Gift", "Coffee", "Smile",
]

export function BlockEditor({ block, onUpdate, pageStyles }: BlockEditorProps) {
  const [activeTab, setActiveTab] = useState("content")
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const itemImageInputRef = useRef<HTMLInputElement>(null)
  const [pendingItemUpload, setPendingItemUpload] = useState<{ itemId: string; field: "authorImage" | "image" } | null>(null)

  const updateContent = (updates: any) => {
    onUpdate({ content: { ...block.content, ...updates } })
  }

  const updateStyles = (updates: Partial<LandingBlockStyles>) => {
    onUpdate({ styles: { ...block.styles, ...updates } })
  }

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      toast.error("Session expired. Please refresh.")
      return null
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `landing-page/${folder}-${crypto.randomUUID()}.${fileExt}`

    const uploadFormData = new FormData()
    uploadFormData.append("", file)
    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/organization-assets/${fileName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY || "",
          "x-upsert": "true",
        },
        body: uploadFormData,
      }
    )

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text()
      throw new Error(errText || `Upload failed: ${uploadResponse.status}`)
    }

    return `${SUPABASE_URL}/storage/v1/object/public/organization-assets/${fileName}`
  }

  const handleItemImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !pendingItemUpload) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, or WebP)")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB")
      return
    }

    const { itemId, field } = pendingItemUpload
    setUploadingItemId(itemId)
    try {
      const folder = field === "authorImage" ? "testimonial" : "client"
      const publicUrl = await uploadImage(file, folder)
      if (publicUrl) {
        updateItem(itemId, { [field]: publicUrl })
        toast.success("Image uploaded successfully")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
    } finally {
      setUploadingItemId(null)
      setPendingItemUpload(null)
      if (itemImageInputRef.current) itemImageInputRef.current.value = ""
    }
  }

  const triggerItemImageUpload = (itemId: string, field: "authorImage" | "image") => {
    setPendingItemUpload({ itemId, field })
    setTimeout(() => itemImageInputRef.current?.click(), 0)
  }

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, or WebP)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setIsUploadingBanner(true)
    try {
      const publicUrl = await uploadImage(file, "hero-banner")
      if (publicUrl) {
        updateContent({ backgroundImage: publicUrl })
        toast.success("Banner image uploaded successfully")
      }
    } catch (error) {
      console.error("Error uploading banner:", error)
      toast.error("Failed to upload banner image")
    } finally {
      setIsUploadingBanner(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ""
    }
  }

  const addItem = () => {
    const items = block.content.items || []
    const newItem: LandingContentItem = {
      id: crypto.randomUUID(),
      title: "New Item",
      titleAr: "عنصر جديد",
      description: "Description here",
      descriptionAr: "الوصف هنا",
      icon: "Star",
    }
    updateContent({ items: [...items, newItem] })
  }

  const updateItem = (itemId: string, updates: Partial<LandingContentItem>) => {
    const items = (block.content.items || []).map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    )
    updateContent({ items })
  }

  const removeItem = (itemId: string) => {
    const items = (block.content.items || []).filter((item) => item.id !== itemId)
    updateContent({ items })
  }

  return (
    <div className="mt-6">
      {/* Hidden file input for item image uploads (testimonials, clients) */}
      <input
        ref={itemImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleItemImageUpload}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 mt-4">
          {/* Common title fields for most block types */}
          {["hero", "features", "about", "stats", "testimonials", "pricing", "clients", "how_it_works", "cta", "faq", "contact"].includes(block.type) && (
            <>
              <div className="space-y-2">
                <Label>Title (English)</Label>
                <Input
                  value={block.content.title || ""}
                  onChange={(e) => updateContent({ title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>
              <div className="space-y-2">
                <Label>Title (Arabic)</Label>
                <Input
                  value={block.content.titleAr || ""}
                  onChange={(e) => updateContent({ titleAr: e.target.value })}
                  placeholder="أدخل العنوان"
                  dir="rtl"
                />
              </div>
            </>
          )}

          {/* Hero specific */}
          {block.type === "hero" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Badge Text (English)</Label>
                <Input
                  value={block.content.badge || ""}
                  onChange={(e) => updateContent({ badge: e.target.value })}
                  placeholder="AI-Powered Platform"
                />
              </div>
              <div className="space-y-2">
                <Label>Badge Text (Arabic)</Label>
                <Input
                  value={block.content.badgeAr || ""}
                  onChange={(e) => updateContent({ badgeAr: e.target.value })}
                  placeholder="منصة مدعومة بالذكاء الاصطناعي"
                  dir="rtl"
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Subtitle (English)</Label>
                <Textarea
                  value={block.content.subtitle || ""}
                  onChange={(e) => updateContent({ subtitle: e.target.value })}
                  placeholder="Enter subtitle"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle (Arabic)</Label>
                <Textarea
                  value={block.content.subtitleAr || ""}
                  onChange={(e) => updateContent({ subtitleAr: e.target.value })}
                  placeholder="أدخل العنوان الفرعي"
                  dir="rtl"
                  rows={3}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Hero Banner Image</Label>
                <p className="text-xs text-muted-foreground">
                  Recommended: 1920 × 600px. Max file size: 5MB. JPG, PNG, or WebP.
                </p>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBannerUpload}
                />
                {block.content.backgroundImage ? (
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={block.content.backgroundImage}
                      alt="Hero banner preview"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={isUploadingBanner}
                      >
                        {isUploadingBanner ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3 mr-1" />
                        )}
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 text-xs"
                        onClick={() => updateContent({ backgroundImage: "" })}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="w-full h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingBanner ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-xs">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6" />
                        <span className="text-xs font-medium">Click to upload banner image</span>
                        <span className="text-xs opacity-60">1920 × 600px recommended</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CTA Button (EN)</Label>
                  <Input
                    value={block.content.ctaText || ""}
                    onChange={(e) => updateContent({ ctaText: e.target.value })}
                    placeholder="Get Started"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button (AR)</Label>
                  <Input
                    value={block.content.ctaTextAr || ""}
                    onChange={(e) => updateContent({ ctaTextAr: e.target.value })}
                    placeholder="ابدأ الآن"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>CTA Link</Label>
                <Input
                  value={block.content.ctaLink || ""}
                  onChange={(e) => updateContent({ ctaLink: e.target.value })}
                  placeholder="/signup"
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Secondary CTA (EN)</Label>
                  <Input
                    value={block.content.secondaryCtaText || ""}
                    onChange={(e) => updateContent({ secondaryCtaText: e.target.value })}
                    placeholder="Learn More"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary CTA (AR)</Label>
                  <Input
                    value={block.content.secondaryCtaTextAr || ""}
                    onChange={(e) => updateContent({ secondaryCtaTextAr: e.target.value })}
                    placeholder="اعرف المزيد"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary CTA Link</Label>
                <Input
                  value={block.content.secondaryCtaLink || ""}
                  onChange={(e) => updateContent({ secondaryCtaLink: e.target.value })}
                  placeholder="#about"
                />
              </div>
            </>
          )}

          {/* Features / About subtitle */}
          {["features", "how_it_works", "pricing"].includes(block.type) && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Subtitle (English)</Label>
                <Input
                  value={block.content.subtitle || ""}
                  onChange={(e) => updateContent({ subtitle: e.target.value })}
                  placeholder="Enter subtitle"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle (Arabic)</Label>
                <Input
                  value={block.content.subtitleAr || ""}
                  onChange={(e) => updateContent({ subtitleAr: e.target.value })}
                  placeholder="أدخل العنوان الفرعي"
                  dir="rtl"
                />
              </div>
            </>
          )}

          {/* About description */}
          {block.type === "about" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Description (English)</Label>
                <Textarea
                  value={block.content.description || ""}
                  onChange={(e) => updateContent({ description: e.target.value })}
                  placeholder="Tell your story..."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Arabic)</Label>
                <Textarea
                  value={block.content.descriptionAr || ""}
                  onChange={(e) => updateContent({ descriptionAr: e.target.value })}
                  placeholder="اكتب قصتك..."
                  dir="rtl"
                  rows={5}
                />
              </div>
            </>
          )}

          {/* CTA specific */}
          {block.type === "cta" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Subtitle (English)</Label>
                <Input
                  value={block.content.subtitle || ""}
                  onChange={(e) => updateContent({ subtitle: e.target.value })}
                  placeholder="Start your journey today"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle (Arabic)</Label>
                <Input
                  value={block.content.subtitleAr || ""}
                  onChange={(e) => updateContent({ subtitleAr: e.target.value })}
                  placeholder="ابدأ رحلتك اليوم"
                  dir="rtl"
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Button Text (EN)</Label>
                  <Input
                    value={block.content.ctaText || ""}
                    onChange={(e) => updateContent({ ctaText: e.target.value })}
                    placeholder="Get Started"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Text (AR)</Label>
                  <Input
                    value={block.content.ctaTextAr || ""}
                    onChange={(e) => updateContent({ ctaTextAr: e.target.value })}
                    placeholder="ابدأ الآن"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input
                  value={block.content.ctaLink || ""}
                  onChange={(e) => updateContent({ ctaLink: e.target.value })}
                  placeholder="/signup"
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Secondary CTA (EN)</Label>
                  <Input
                    value={block.content.secondaryCtaText || ""}
                    onChange={(e) => updateContent({ secondaryCtaText: e.target.value })}
                    placeholder="Talk to Sales"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary CTA (AR)</Label>
                  <Input
                    value={block.content.secondaryCtaTextAr || ""}
                    onChange={(e) => updateContent({ secondaryCtaTextAr: e.target.value })}
                    placeholder="تحدث مع المبيعات"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary CTA Link</Label>
                <Input
                  value={block.content.secondaryCtaLink || ""}
                  onChange={(e) => updateContent({ secondaryCtaLink: e.target.value })}
                  placeholder="#contact"
                />
              </div>
            </>
          )}

          {/* Contact specific */}
          {block.type === "contact" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={block.content.email || ""}
                  onChange={(e) => updateContent({ email: e.target.value })}
                  placeholder="support@company.com"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={block.content.phone || ""}
                  onChange={(e) => updateContent({ phone: e.target.value })}
                  placeholder="+966 XX XXX XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Address (English)</Label>
                <Textarea
                  value={block.content.address || ""}
                  onChange={(e) => updateContent({ address: e.target.value })}
                  placeholder="123 Business Street..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Address (Arabic)</Label>
                <Textarea
                  value={block.content.addressAr || ""}
                  onChange={(e) => updateContent({ addressAr: e.target.value })}
                  placeholder="123 شارع الأعمال..."
                  dir="rtl"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Custom HTML */}
          {block.type === "custom" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>HTML Content (English)</Label>
                <Textarea
                  value={block.content.html || ""}
                  onChange={(e) => updateContent({ html: e.target.value })}
                  placeholder="<div>...</div>"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>HTML Content (Arabic)</Label>
                <Textarea
                  value={block.content.htmlAr || ""}
                  onChange={(e) => updateContent({ htmlAr: e.target.value })}
                  placeholder="<div>...</div>"
                  rows={8}
                  className="font-mono text-sm"
                  dir="rtl"
                />
              </div>
            </>
          )}

          {/* Items for features, stats, testimonials, pricing, how_it_works, faq, clients */}
          {["features", "stats", "testimonials", "pricing", "how_it_works", "faq", "clients"].includes(block.type) && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Items</Label>
                <Button size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-3 mt-3">
                {(block.content.items || []).map((item, index) => (
                  <Card key={item.id}>
                    <CardHeader className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <span className="text-sm font-medium flex-1">
                          Item {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 px-3 pb-3">
                      {/* Icon picker for non-stats/pricing blocks */}
                      {!["stats", "pricing", "faq"].includes(block.type) && (
                        <div className="space-y-1">
                          <Label className="text-xs">Icon</Label>
                          <Select
                            value={item.icon || "Star"}
                            onValueChange={(v) => updateItem(item.id, { icon: v })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {iconOptions.map((icon) => (
                                <SelectItem key={icon} value={icon}>
                                  {icon}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Stats block */}
                      {block.type === "stats" ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Value (EN)</Label>
                              <Input
                                value={item.value || ""}
                                onChange={(e) => updateItem(item.id, { value: e.target.value })}
                                placeholder="500+"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Value (AR)</Label>
                              <Input
                                value={item.valueAr || ""}
                                onChange={(e) => updateItem(item.id, { valueAr: e.target.value })}
                                placeholder="+500"
                                className="h-8"
                                dir="rtl"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Label (EN)</Label>
                              <Input
                                value={item.label || ""}
                                onChange={(e) => updateItem(item.id, { label: e.target.value })}
                                placeholder="Companies"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Label (AR)</Label>
                              <Input
                                value={item.labelAr || ""}
                                onChange={(e) => updateItem(item.id, { labelAr: e.target.value })}
                                placeholder="شركة"
                                className="h-8"
                                dir="rtl"
                              />
                            </div>
                          </div>
                        </>
                      ) : block.type === "pricing" ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Plan Name (EN)</Label>
                              <Input
                                value={item.title || ""}
                                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                placeholder="Starter"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Plan Name (AR)</Label>
                              <Input
                                value={item.titleAr || ""}
                                onChange={(e) => updateItem(item.id, { titleAr: e.target.value })}
                                placeholder="المبتدئ"
                                className="h-8"
                                dir="rtl"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Description (EN)</Label>
                              <Input
                                value={item.description || ""}
                                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                placeholder="For small teams"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Description (AR)</Label>
                              <Input
                                value={item.descriptionAr || ""}
                                onChange={(e) => updateItem(item.id, { descriptionAr: e.target.value })}
                                placeholder="للفرق الصغيرة"
                                className="h-8"
                                dir="rtl"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Price</Label>
                              <Input
                                value={item.price || ""}
                                onChange={(e) => updateItem(item.id, { price: e.target.value })}
                                placeholder="$49"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Period</Label>
                              <Input
                                value={item.period || ""}
                                onChange={(e) => updateItem(item.id, { period: e.target.value })}
                                placeholder="/month"
                                className="h-8"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Featured / Popular</Label>
                            <Switch
                              checked={item.featured || false}
                              onCheckedChange={(v) => updateItem(item.id, { featured: v })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Features (one per line, EN)</Label>
                            <Textarea
                              value={(item.features || []).join("\n")}
                              onChange={(e) => updateItem(item.id, { features: e.target.value.split("\n").filter(Boolean) })}
                              placeholder="Unlimited jobs&#10;AI screening&#10;Priority support"
                              className="h-20 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Features (one per line, AR)</Label>
                            <Textarea
                              value={(item.featuresAr || []).join("\n")}
                              onChange={(e) => updateItem(item.id, { featuresAr: e.target.value.split("\n").filter(Boolean) })}
                              placeholder="وظائف غير محدودة&#10;فرز بالذكاء الاصطناعي"
                              className="h-20 text-sm"
                              dir="rtl"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">CTA Text (EN)</Label>
                              <Input
                                value={item.ctaText || ""}
                                onChange={(e) => updateItem(item.id, { ctaText: e.target.value })}
                                placeholder="Get Started"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">CTA Text (AR)</Label>
                              <Input
                                value={item.ctaTextAr || ""}
                                onChange={(e) => updateItem(item.id, { ctaTextAr: e.target.value })}
                                placeholder="ابدأ الآن"
                                className="h-8"
                                dir="rtl"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">CTA Link</Label>
                            <Input
                              value={item.ctaLink || ""}
                              onChange={(e) => updateItem(item.id, { ctaLink: e.target.value })}
                              placeholder="/signup"
                              className="h-8"
                            />
                          </div>
                        </>
                      ) : (
                        // Default: title + description for features, faq, how_it_works, testimonials, clients
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Title (EN)</Label>
                              <Input
                                value={item.title || ""}
                                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                placeholder="Title"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Title (AR)</Label>
                              <Input
                                value={item.titleAr || ""}
                                onChange={(e) => updateItem(item.id, { titleAr: e.target.value })}
                                placeholder="العنوان"
                                className="h-8"
                                dir="rtl"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description (EN)</Label>
                            <Textarea
                              value={item.description || ""}
                              onChange={(e) => updateItem(item.id, { description: e.target.value })}
                              placeholder="Description"
                              className="h-16 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description (AR)</Label>
                            <Textarea
                              value={item.descriptionAr || ""}
                              onChange={(e) => updateItem(item.id, { descriptionAr: e.target.value })}
                              placeholder="الوصف"
                              className="h-16 text-sm"
                              dir="rtl"
                            />
                          </div>
                        </>
                      )}

                      {/* How it works step number */}
                      {block.type === "how_it_works" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Step Number</Label>
                          <Input
                            type="number"
                            value={item.step || index + 1}
                            onChange={(e) => updateItem(item.id, { step: parseInt(e.target.value) || index + 1 })}
                            className="h-8"
                          />
                        </div>
                      )}

                      {/* Client logo upload */}
                      {block.type === "clients" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Logo</Label>
                          {item.image ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={item.image}
                                alt="Client logo"
                                className="h-10 w-20 object-contain border rounded bg-white p-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={uploadingItemId === item.id}
                                onClick={() => triggerItemImageUpload(item.id, "image")}
                              >
                                {uploadingItemId === item.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Upload className="h-3 w-3 mr-1" />
                                )}
                                Replace
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => updateItem(item.id, { image: "" })}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={uploadingItemId === item.id}
                              onClick={() => triggerItemImageUpload(item.id, "image")}
                              className="w-full h-10 border border-dashed rounded-md flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer disabled:opacity-50 text-xs"
                            >
                              {uploadingItemId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ImageIcon className="h-3 w-3" />
                              )}
                              Upload logo
                            </button>
                          )}
                        </div>
                      )}

                      {/* Testimonials extra fields */}
                      {block.type === "testimonials" && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Author Name</Label>
                              <Input
                                value={item.author || ""}
                                onChange={(e) => updateItem(item.id, { author: e.target.value })}
                                placeholder="John Doe"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Author Name (AR)</Label>
                              <Input
                                value={item.authorAr || ""}
                                onChange={(e) => updateItem(item.id, { authorAr: e.target.value })}
                                placeholder="أحمد"
                                className="h-8"
                                dir="rtl"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Author Role (EN)</Label>
                              <Input
                                value={item.authorRole || ""}
                                onChange={(e) => updateItem(item.id, { authorRole: e.target.value })}
                                placeholder="HR Director"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Author Role (AR)</Label>
                              <Input
                                value={item.authorRoleAr || ""}
                                onChange={(e) => updateItem(item.id, { authorRoleAr: e.target.value })}
                                placeholder="مدير الموارد البشرية"
                                className="h-8"
                                dir="rtl"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Author Photo</Label>
                            {item.authorImage ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={item.authorImage}
                                  alt="Author"
                                  className="h-10 w-10 rounded-full object-cover border"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={uploadingItemId === item.id}
                                  onClick={() => triggerItemImageUpload(item.id, "authorImage")}
                                >
                                  {uploadingItemId === item.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Upload className="h-3 w-3 mr-1" />
                                  )}
                                  Replace
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => updateItem(item.id, { authorImage: "" })}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={uploadingItemId === item.id}
                                onClick={() => triggerItemImageUpload(item.id, "authorImage")}
                                className="w-full h-10 border border-dashed rounded-md flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer disabled:opacity-50 text-xs"
                              >
                                {uploadingItemId === item.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Upload className="h-3 w-3" />
                                )}
                                Upload photo
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="style" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex gap-2">
              <div
                className="w-10 h-10 rounded border cursor-pointer"
                style={{ backgroundColor: block.styles.backgroundColor || "#FFFFFF" }}
              />
              <Input
                value={block.styles.backgroundColor || ""}
                onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                placeholder="transparent or #FFFFFF"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Text Color</Label>
            <div className="flex gap-2">
              <div
                className="w-10 h-10 rounded border cursor-pointer"
                style={{ backgroundColor: block.styles.textColor || "#000000" }}
              />
              <Input
                value={block.styles.textColor || ""}
                onChange={(e) => updateStyles({ textColor: e.target.value })}
                placeholder="#1F2937"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Padding</Label>
            <Select
              value={block.styles.padding || "medium"}
              onValueChange={(v: any) => updateStyles({ padding: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Alignment</Label>
            <Select
              value={block.styles.alignment || "left"}
              onValueChange={(v: any) => updateStyles({ alignment: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {["features", "stats", "pricing", "how_it_works", "clients", "testimonials"].includes(block.type) && (
            <>
              <div className="space-y-2">
                <Label>Layout</Label>
                <Select
                  value={block.styles.layout || "grid"}
                  onValueChange={(v: any) => updateStyles({ layout: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Columns</Label>
                <Select
                  value={String(block.styles.columns || 3)}
                  onValueChange={(v) => updateStyles({ columns: parseInt(v) as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Columns</SelectItem>
                    <SelectItem value="3">3 Columns</SelectItem>
                    <SelectItem value="4">4 Columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <Label>Show Divider</Label>
            <Switch
              checked={block.styles.showDivider || false}
              onCheckedChange={(v) => updateStyles({ showDivider: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Full Width</Label>
            <Switch
              checked={block.styles.fullWidth || false}
              onCheckedChange={(v) => updateStyles({ fullWidth: v })}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
