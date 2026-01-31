"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Clock,
} from "lucide-react"
import type { CandidateListStats, CandidateListItem } from "@/lib/analytics/candidates-list-stats"

interface CandidatesListProps {
  data: CandidateListStats
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-indigo-500 text-white" },
  screening: { label: "Screening", className: "bg-purple-500 text-white" },
  interviewing: { label: "Interviewing", className: "bg-cyan-500 text-white" },
  offered: { label: "Offered", className: "bg-amber-500 text-white" },
  hired: { label: "Hired", className: "bg-emerald-500 text-white" },
  rejected: { label: "Rejected", className: "bg-rose-500 text-white" },
  withdrawn: { label: "Withdrawn", className: "bg-slate-500 text-white" },
}

const PAGE_SIZE = 25

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ")
}

export function CandidatesList({ data }: CandidatesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)

  // Derive unique filter options from data
  const departments = useMemo(() => {
    const set = new Set(data.candidates.map((c) => c.department))
    return Array.from(set).sort()
  }, [data.candidates])

  const sources = useMemo(() => {
    const set = new Set(data.candidates.map((c) => c.source))
    return Array.from(set).sort()
  }, [data.candidates])

  const statuses = useMemo(() => {
    const set = new Set(data.candidates.map((c) => c.status))
    return Array.from(set).sort()
  }, [data.candidates])

  // Filtered candidates
  const filtered = useMemo(() => {
    let result = data.candidates

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.jobTitle.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter)
    }
    if (departmentFilter !== "all") {
      result = result.filter((c) => c.department === departmentFilter)
    }
    if (sourceFilter !== "all") {
      result = result.filter((c) => c.source === sourceFilter)
    }

    return result
  }, [data.candidates, searchQuery, statusFilter, departmentFilter, sourceFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedCandidates = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
  }

  // CSV Export
  const exportCSV = (exportAll: boolean) => {
    setIsExporting(true)

    const candidates = exportAll ? data.candidates : filtered
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Source",
      "Status",
      "Job Title",
      "Department",
      "Applied Date",
      "Last Updated",
    ]

    const rows = candidates.map((c) => [
      c.firstName,
      c.lastName,
      c.email,
      c.phone || "",
      c.source,
      c.status,
      c.jobTitle,
      c.department,
      c.appliedAt ? new Date(c.appliedAt).toLocaleDateString() : "",
      c.lastUpdated ? new Date(c.lastUpdated).toLocaleDateString() : "",
    ])

    // Escape CSV fields
    const escapeField = (field: string) => {
      if (field.includes(",") || field.includes('"') || field.includes("\n")) {
        return `"${field.replace(/"/g, '""')}"`
      }
      return field
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeField).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `candidates_${exportAll ? "all" : "filtered"}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)

    setTimeout(() => setIsExporting(false), 1000)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Candidates</p>
                <p className="text-4xl font-bold mt-1">{data.totalCount}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {(["new", "interviewing", "hired"] as const).map((status, idx) => {
          const colors = [
            "from-cyan-500 to-blue-600",
            "from-amber-500 to-orange-600",
            "from-emerald-500 to-teal-600",
          ]
          const textColors = ["text-cyan-100", "text-amber-100", "text-emerald-100"]
          const count = data.statusCounts[status] || 0

          return (
            <Card
              key={status}
              className={`relative overflow-hidden border-0 bg-gradient-to-br ${colors[idx]} text-white`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <CardContent className="pt-6 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`${textColors[idx]} text-sm font-medium`}>
                      {capitalizeFirst(status)}
                    </p>
                    <p className="text-4xl font-bold mt-1">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Candidate List
              </CardTitle>
              <CardDescription>
                {filtered.length === data.totalCount
                  ? `Showing all ${data.totalCount} candidates`
                  : `Showing ${filtered.length} of ${data.totalCount} candidates`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV(false)}
                disabled={isExporting || filtered.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Filtered
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV(true)}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export All
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, job title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {capitalizeFirst(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={handleFilterChange(setDepartmentFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={handleFilterChange(setSourceFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>
                    {capitalizeFirst(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Candidate</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Job</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Source</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Applied</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Updated</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCandidates.length > 0 ? (
                  paginatedCandidates.map((candidate) => {
                    const badgeInfo = STATUS_BADGE[candidate.status] || {
                      label: capitalizeFirst(candidate.status),
                      className: "bg-slate-500 text-white",
                    }

                    return (
                      <tr
                        key={candidate.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {candidate.firstName.charAt(0).toUpperCase()}
                              {candidate.lastName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium whitespace-nowrap">
                              {candidate.firstName} {candidate.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[180px]">{candidate.email}</span>
                            </div>
                            {candidate.phone && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span>{candidate.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="truncate max-w-[200px] inline-block">
                            {candidate.jobTitle}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-muted-foreground">{candidate.department}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{capitalizeFirst(candidate.source)}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={badgeInfo.className}>{badgeInfo.label}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(candidate.appliedAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">
                          {formatDate(candidate.lastUpdated)}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">
                        {searchQuery || statusFilter !== "all" || departmentFilter !== "all" || sourceFilter !== "all"
                          ? "No candidates match your filters"
                          : "No candidates found"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
