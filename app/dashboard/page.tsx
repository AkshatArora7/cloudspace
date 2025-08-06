"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Cloud, ImageIcon, File, FolderPlus, Settings, LogOut, Grid, List, Search, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { S3ConfigForm } from "@/components/S3ConfigForm"
import { FileUpload } from "@/components/FileUpload"
import { FileGrid } from "@/components/FileGrid"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/Spinner"
import Image from "next/image"

interface User {
  id: string
  name: string
  email: string
  hasS3Config: boolean
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          router.push("/auth/signin")
          return
        }

        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          localStorage.removeItem("token")
          router.push("/auth/signin")
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        router.push("/auth/signin")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  const handleS3ConfigComplete = () => {
    setUser((prev) => (prev ? { ...prev, hasS3Config: true } : null))
  }

  const handleSettings = () => {
    setShowSettings(!showSettings)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Image
                  src="/logo.png"
                  alt="CloudSpace Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
                <span className="text-xl font-semibold text-gray-900">CloudSpace</span>
              </div>
              {user.hasS3Config && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  S3 Connected
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Button variant="ghost" size="sm" onClick={handleSettings}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Settings</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-yellow-700">
                <span>User: {user.email}</span>
                <span>•</span>
                <span>S3 Status: {user.hasS3Config ? 'Connected' : 'Not Connected'}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSettings(false)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user.hasS3Config ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your AWS S3 Bucket</h1>
              <p className="text-lg text-gray-600">
                To get started, you'll need to configure your AWS S3 credentials. Don't worry, we'll guide you through
                the process.
              </p>
            </div>
            <S3ConfigForm onComplete={handleS3ConfigComplete} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Your Files</h1>
                <p className="text-gray-600">Manage and organize your S3 files</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
                  {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
                <Button>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* File Upload */}
            <FileUpload />

            {/* File Management Tabs */}
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="flex items-center space-x-2">
                  <File className="h-4 w-4" />
                  <span>All Files</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Images</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center space-x-2">
                  <File className="h-4 w-4" />
                  <span>Documents</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <FileGrid viewMode={viewMode} searchQuery={searchQuery} fileType="all" />
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <FileGrid viewMode={viewMode} searchQuery={searchQuery} fileType="images" />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <FileGrid viewMode={viewMode} searchQuery={searchQuery} fileType="documents" />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
