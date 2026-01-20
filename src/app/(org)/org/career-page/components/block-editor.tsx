"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"
import {
  CareerPageBlock,
  CareerPageStyles,
  BlockStyles,
  ContentItem,
} from "@/lib/career-page/types"

interface BlockEditorProps {
  block: CareerPageBlock
  onUpdate: (updates: Partial<CareerPageBlock>) => void
  pageStyles: CareerPageStyles
}

const iconOptions = [
  "Heart", "Star", "Users", "Briefcase", "Building2", "Rocket",
  "Globe", "Award", "GraduationCap", "Clock", "Shield", "Zap",
  "Target", "TrendingUp", "Lightbulb", "Coffee", "Gift", "Smile",
]

export function BlockEditor({ block, onUpdate, pageStyles }: BlockEditorProps) {
  const [activeTab, setActiveTab] = useState("content")

  const updateContent = (updates: any) => {
    onUpdate({ content: { ...block.content, ...updates } })
  }

  const updateStyles = (updates: Partial<BlockStyles>) => {
    onUpdate({ styles: { ...block.styles, ...updates } })
  }

  const addItem = () => {
    const items = block.content.items || []
    const newItem: ContentItem = {
      id: crypto.randomUUID(),
      title: "New Item",
      titleAr: "عنصر جديد",
      description: "Description here",
      descriptionAr: "الوصف هنا",
      icon: "Star",
    }
    updateContent({ items: [...items, newItem] })
  }

  const updateItem = (itemId: string, updates: Partial<ContentItem>) => {
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 mt-4">
          {/* Common fields */}
          {["hero", "about", "values", "benefits", "team", "testimonials", "jobs", "stats", "gallery", "cta", "contact"].includes(block.type) && (
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
              <Separator />
              <div className="space-y-2">
                <Label>Background Image URL</Label>
                <Input
                  value={block.content.backgroundImage || ""}
                  onChange={(e) => updateContent({ backgroundImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CTA Button (EN)</Label>
                  <Input
                    value={block.content.ctaText || ""}
                    onChange={(e) => updateContent({ ctaText: e.target.value })}
                    placeholder="View Jobs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button (AR)</Label>
                  <Input
                    value={block.content.ctaTextAr || ""}
                    onChange={(e) => updateContent({ ctaTextAr: e.target.value })}
                    placeholder="عرض الوظائف"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>CTA Link</Label>
                <Input
                  value={block.content.ctaLink || ""}
                  onChange={(e) => updateContent({ ctaLink: e.target.value })}
                  placeholder="#jobs or /apply"
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

          {/* About specific */}
          {block.type === "about" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Description (English)</Label>
                <Textarea
                  value={block.content.description || ""}
                  onChange={(e) => updateContent({ description: e.target.value })}
                  placeholder="Tell your company story..."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Arabic)</Label>
                <Textarea
                  value={block.content.descriptionAr || ""}
                  onChange={(e) => updateContent({ descriptionAr: e.target.value })}
                  placeholder="اكتب قصة شركتك..."
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
                    placeholder="Apply Now"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Text (AR)</Label>
                  <Input
                    value={block.content.ctaTextAr || ""}
                    onChange={(e) => updateContent({ ctaTextAr: e.target.value })}
                    placeholder="قدم الآن"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input
                  value={block.content.ctaLink || ""}
                  onChange={(e) => updateContent({ ctaLink: e.target.value })}
                  placeholder="#jobs"
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
                  placeholder="careers@company.com"
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

          {/* Items (for values, benefits, team, testimonials, stats) */}
          {["values", "benefits", "team", "testimonials", "stats"].includes(block.type) && (
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
                      {block.type !== "stats" && (
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

                      {block.type === "stats" ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Value (EN)</Label>
                              <Input
                                value={item.value || ""}
                                onChange={(e) =>
                                  updateItem(item.id, { value: e.target.value })
                                }
                                placeholder="500+"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Value (AR)</Label>
                              <Input
                                value={item.valueAr || ""}
                                onChange={(e) =>
                                  updateItem(item.id, { valueAr: e.target.value })
                                }
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
                                onChange={(e) =>
                                  updateItem(item.id, { label: e.target.value })
                                }
                                placeholder="Employees"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Label (AR)</Label>
                              <Input
                                value={item.labelAr || ""}
                                onChange={(e) =>
                                  updateItem(item.id, { labelAr: e.target.value })
                                }
                                placeholder="موظف"
                                className="h-8"
                                dir="rtl"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Title (EN)</Label>
                              <Input
                                value={item.title || ""}
                                onChange={(e) =>
                                  updateItem(item.id, { title: e.target.value })
                                }
                                placeholder="Title"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Title (AR)</Label>
                              <Input
                                value={item.titleAr || ""}
                                onChange={(e) =>
                                  updateItem(item.id, { titleAr: e.target.value })
                                }
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
                              onChange={(e) =>
                                updateItem(item.id, { description: e.target.value })
                              }
                              placeholder="Description"
                              className="h-16 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description (AR)</Label>
                            <Textarea
                              value={item.descriptionAr || ""}
                              onChange={(e) =>
                                updateItem(item.id, { descriptionAr: e.target.value })
                              }
                              placeholder="الوصف"
                              className="h-16 text-sm"
                              dir="rtl"
                            />
                          </div>
                        </>
                      )}

                      {block.type === "team" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Image URL</Label>
                            <Input
                              value={item.image || ""}
                              onChange={(e) =>
                                updateItem(item.id, { image: e.target.value })
                              }
                              placeholder="https://..."
                              className="h-8"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Role (EN)</Label>
                              <Input
                                value={item.role || ""}
                                onChange={(e) =>
                                  updateItem(item.id, { role: e.target.value })
                                }
                                placeholder="CEO"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Role (AR)</Label>
                              <Input
                                value={item.roleAr || ""}
                                onChange={(e) =>
                                  updateItem(item.id, { roleAr: e.target.value })
                                }
                                placeholder="الرئيس التنفيذي"
                                className="h-8"
                                dir="rtl"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {block.type === "testimonials" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Author Name</Label>
                            <Input
                              value={item.author || ""}
                              onChange={(e) =>
                                updateItem(item.id, { author: e.target.value })
                              }
                              placeholder="John Doe"
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Author Role</Label>
                            <Input
                              value={item.authorRole || ""}
                              onChange={(e) =>
                                updateItem(item.id, { authorRole: e.target.value })
                              }
                              placeholder="Software Engineer"
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Photo URL</Label>
                            <Input
                              value={item.image || ""}
                              onChange={(e) =>
                                updateItem(item.id, { image: e.target.value })
                              }
                              placeholder="https://..."
                              className="h-8"
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

          {["values", "benefits", "team", "stats", "gallery"].includes(block.type) && (
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
                    <SelectItem value="carousel">Carousel</SelectItem>
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
