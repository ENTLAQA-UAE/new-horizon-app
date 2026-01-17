"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Search,
  Building2,
  Globe,
  Filter,
  ChevronRight,
  Home,
} from "lucide-react"

interface Job {
  id: string
  title: string
  title_ar: string | null
  description: string | null
  description_ar: string | null
  location: string | null
  department: string | null
  employment_type: string | null
  experience_level: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  remote_allowed: boolean | null
  published_at: string | null
  closes_at: string | null
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface Branding {
  primary_color: string | null
  logo_url: string | null
  cover_image_url: string | null
  career_page_title: string | null
  career_page_description: string | null
}

interface CareerPageClientProps {
  organization: Organization
  jobs: Job[]
  branding: Branding | null
}

const employmentTypeLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
}

const experienceLevelLabels: Record<string, string> = {
  entry: "Entry Level",
  junior: "Junior",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead",
  manager: "Manager",
  director: "Director",
  executive: "Executive",
}

export function CareerPageClient({ organization, jobs, branding }: CareerPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const primaryColor = branding?.primary_color || "#3b82f6"

  // Get unique departments
  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))]

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDepartment =
      departmentFilter === "all" || job.department === departmentFilter

    const matchesType =
      typeFilter === "all" || job.employment_type === typeFilter

    return matchesSearch && matchesDepartment && matchesType
  })

  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return null
    const currency = job.salary_currency || "SAR"
    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
    }
    if (job.salary_min) {
      return `From ${currency} ${job.salary_min.toLocaleString()}`
    }
    return `Up to ${currency} ${job.salary_max?.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="relative h-64 md:h-80"
        style={{
          backgroundColor: primaryColor,
          backgroundImage: branding?.cover_image_url
            ? `url(${branding.cover_image_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={organization.name}
                className="h-16 w-16 rounded-lg bg-white p-2 object-contain"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {branding?.career_page_title || `Careers at ${organization.name}`}
              </h1>
              <p className="text-white/80 mt-1">
                {branding?.career_page_description || "Join our team and make an impact"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept!}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Briefcase className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(employmentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Job Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredJobs.length} {filteredJobs.length === 1 ? "position" : "positions"} available
          </p>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No open positions</h3>
                <p className="text-muted-foreground">
                  {searchQuery || departmentFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your filters to see more results"
                    : "Check back later for new opportunities"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        {job.remote_allowed && (
                          <Badge variant="outline" className="shrink-0">
                            <Globe className="mr-1 h-3 w-3" />
                            Remote
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        )}
                        {job.department && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.department}
                          </span>
                        )}
                        {job.employment_type && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {employmentTypeLabels[job.employment_type] || job.employment_type}
                          </span>
                        )}
                        {job.experience_level && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {experienceLevelLabels[job.experience_level] || job.experience_level}
                          </span>
                        )}
                      </div>

                      {formatSalary(job) && (
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600 mb-3">
                          <DollarSign className="h-4 w-4" />
                          {formatSalary(job)}
                        </div>
                      )}

                      {job.description && (
                        <p className="text-muted-foreground line-clamp-2">
                          {job.description.replace(/<[^>]*>/g, "").substring(0, 200)}...
                        </p>
                      )}
                    </div>

                    <div className="flex md:flex-col gap-2">
                      <Link href={`/careers/${organization.slug}/jobs/${job.id}`}>
                        <Button style={{ backgroundColor: primaryColor }}>
                          View & Apply
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      {job.closes_at && (
                        <p className="text-xs text-muted-foreground text-center">
                          Closes {new Date(job.closes_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {organization.name}. All rights reserved.</p>
          <p className="text-sm mt-2">Powered by Jadarat ATS</p>
        </div>
      </footer>
    </div>
  )
}
