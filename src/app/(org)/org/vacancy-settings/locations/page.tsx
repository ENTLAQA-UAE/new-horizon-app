// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { supabaseInsert, supabaseUpdate, supabaseDelete, supabaseSelect } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, MapPin } from "lucide-react"

interface Location {
  id: string
  name: string
  name_ar: string | null
  address: string | null
  city: string | null
  country: string | null
  is_active: boolean
}

export default function LocationsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>([])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    address: "",
    city: "",
    country: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get current user
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error("No user found")
        setIsLoading(false)
        return
      }

      // Get user's org_id from profiles
      const { data: profileData, error: profileError } = await supabaseSelect<{ org_id: string }[]>(
        "profiles",
        {
          select: "org_id",
          filter: [{ column: "id", operator: "eq", value: user.id }],
          limit: 1
        }
      )

      if (profileError || !profileData?.[0]?.org_id) {
        console.error("Error loading profile:", profileError)
        setIsLoading(false)
        return
      }

      const orgId = profileData[0].org_id
      setOrganizationId(orgId)

      // Get locations using auth-fetch
      const { data, error } = await supabaseSelect<Location[]>(
        "locations",
        {
          select: "*",
          filter: [{ column: "org_id", operator: "eq", value: orgId }],
          order: { column: "name", ascending: true },
        }
      )

      if (error) throw new Error(error.message)
      setLocations(data || [])
    } catch (error: any) {
      console.error("Error loading locations:", error)
      toast.error(error.message || "Failed to load locations")
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setFormData({
        name: location.name,
        name_ar: location.name_ar || "",
        address: location.address || "",
        city: location.city || "",
        country: location.country || "",
      })
    } else {
      setEditingLocation(null)
      setFormData({ name: "", name_ar: "", address: "", city: "", country: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!organizationId) {
      toast.error("Organization not found. Please refresh the page and try again.")
      return
    }
    if (!formData.name) {
      toast.error("Please enter a location name")
      return
    }

    setIsSaving(true)
    try {
      if (editingLocation) {
        const { error } = await supabaseUpdate(
          "locations",
          {
            name: formData.name,
            name_ar: formData.name_ar || null,
            address: formData.address || null,
            city: formData.city || null,
            country: formData.country || null,
            updated_at: new Date().toISOString(),
          },
          { column: "id", value: editingLocation.id }
        )

        if (error) throw error
        toast.success("Location updated successfully")
      } else {
        const { error } = await supabaseInsert("locations", {
          org_id: organizationId,
          name: formData.name,
          name_ar: formData.name_ar || null,
          address: formData.address || null,
          city: formData.city || null,
          country: formData.country || null,
          is_active: true,
        })

        if (error) throw error
        toast.success("Location created successfully")
      }

      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Error saving location:", error)
      toast.error("Failed to save location")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (location: Location) => {
    try {
      const { error } = await supabaseUpdate(
        "locations",
        { is_active: !location.is_active },
        { column: "id", value: location.id }
      )

      if (error) throw error
      setLocations(locations.map(l => l.id === location.id ? { ...l, is_active: !l.is_active } : l))
      toast.success(`Location ${!location.is_active ? "activated" : "deactivated"}`)
    } catch (error) {
      toast.error("Failed to update location")
    }
  }

  const openDeleteDialog = (location: Location) => {
    setDeletingLocation(location)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingLocation) return

    setIsSaving(true)
    try {
      const { error } = await supabaseDelete(
        "locations",
        { column: "id", value: deletingLocation.id }
      )

      if (error) throw error
      toast.success("Location deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeletingLocation(null)
      loadData()
    } catch (error) {
      toast.error("Failed to delete location")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Location</h2>
          <p className="text-muted-foreground">
            Configure office locations for job postings
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No locations found. Add your first location.
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{location.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{location.city || "—"}</TableCell>
                  <TableCell>{location.country || "—"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={location.is_active}
                      onCheckedChange={() => handleToggleActive(location)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(location)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(location)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription>
              {editingLocation ? "Update location details" : "Create a new location"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="loc-name">Name (English) *</Label>
              <Input
                id="loc-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Head Office"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-name-ar">Name (Arabic)</Label>
              <Input
                id="loc-name-ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="المكتب الرئيسي"
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loc-city">City</Label>
                <Input
                  id="loc-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Riyadh"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc-country">Country</Label>
                <Input
                  id="loc-country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Saudi Arabia"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-address">Address</Label>
              <Input
                id="loc-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLocation ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this location?
            </DialogDescription>
          </DialogHeader>
          {deletingLocation && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">{deletingLocation.name}</p>
                {deletingLocation.city && (
                  <p className="text-sm text-muted-foreground">{deletingLocation.city}, {deletingLocation.country}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
