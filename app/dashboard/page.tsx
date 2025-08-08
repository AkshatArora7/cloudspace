"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Cloud, ImageIcon, File, FolderPlus, Settings, LogOut, Grid, List, Search, Filter, ChevronRight, Home, Database } from "lucide-react"
import { useRouter } from "next/navigation"
import { S3ConfigForm } from "@/components/S3ConfigForm"
import { FileUpload } from "@/components/FileUpload"
import { FileGrid } from "@/components/FileGrid"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/Spinner"
import Image from "next/image"
import { CreateFolderModal } from "@/components/CreateFolderModal"
import { BucketDrawer } from "@/components/BucketDrawer"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  hasS3Config: boolean
}

interface S3Bucket {
  id: string
  name: string
  bucketName: string
  region: string
  isDefault: boolean
  createdAt: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [currentPath, setCurrentPath] = useState("")
  const [currentBucket, setCurrentBucket] = useState<S3Bucket | null>(null)
  const [buckets, setBuckets] = useState<S3Bucket[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          router.push("/auth/signin")
          return
        }

        // Fetch user profile
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          
          // Fetch buckets if user has S3 config
          if (userData.hasS3Config) {
            const bucketsResponse = await fetch("/api/s3/buckets", {
              headers: { Authorization: `Bearer ${token}` },
            })
            
            if (bucketsResponse.ok) {
              const bucketsData = await bucketsResponse.json()
              setBuckets(bucketsData.buckets)
              const defaultBucket = bucketsData.buckets.find((b: S3Bucket) => b.isDefault)
              setCurrentBucket(defaultBucket || bucketsData.buckets[0] || null)
            }
          }
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
    router.push("/settings")
  }

  const handleCreateFolder = () => {
    setShowCreateFolder(true)
  }

  const handleFolderCreated = () => {
    // Refresh the file grid
    window.location.reload()
  }

  const handleFolderClick = (folderPath: string) => {
    setCurrentPath(folderPath)
  }

  const handleNavigateUp = () => {
    const pathParts = currentPath.split('/').filter(Boolean)
    pathParts.pop()
    setCurrentPath(pathParts.join('/'))
  }

  const getBreadcrumbs = () => {
    if (!currentPath) return []
    return currentPath.split('/').filter(Boolean)
  }

  const handleResetS3Config = async () => {
    if (!confirm("Are you sure you want to reset your S3 configuration? You'll need to re-enter your credentials.")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/s3/config", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setUser((prev) => (prev ? { ...prev, hasS3Config: false } : null))
      }
    } catch (error) {
      console.error("Error resetting S3 config:", error)
    }
  }

  const handleBucketChange = (bucket: S3Bucket | null) => {
    setCurrentBucket(bucket)
    // Reset current path when switching buckets
    if (bucket) {
      setCurrentPath("")
    }
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
              {currentBucket && (
                <BucketDrawer
                  currentBucket={currentBucket}
                  onBucketChange={handleBucketChange}
                >
                  <Badge variant="secondary" className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200">
                    {currentBucket.name}
                  </Badge>
                </BucketDrawer>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {buckets.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your AWS S3 Bucket</h1>
              <p className="text-lg text-gray-600">
                To get started, you'll need to configure your AWS S3 credentials. Don't worry, we'll guide you through
                the process.
              </p>
            </div>
            <BucketDrawer
              currentBucket={currentBucket}
              onBucketChange={handleBucketChange}
            >
              <Button className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Add Your First S3 Bucket
              </Button>
            </BucketDrawer>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Your Files</h1>
                <p className="text-gray-600">Manage and organize your S3 files</p>
                
                {/* Breadcrumb Navigation */}
                {currentPath && (
                  <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPath("")}
                      className="p-0 h-auto font-normal"
                    >
                      <Home className="h-4 w-4 mr-1" />
                      Home
                    </Button>
                    {getBreadcrumbs().map((folder, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <ChevronRight className="h-4 w-4" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const pathToFolder = getBreadcrumbs().slice(0, index + 1).join('/')
                            setCurrentPath(pathToFolder)
                          }}
                          className="p-0 h-auto font-normal"
                        >
                          {folder}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
                  {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
                <Button onClick={handleCreateFolder}>
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
                <FileGrid 
                  viewMode={viewMode} 
                  searchQuery={searchQuery} 
                  fileType="all" 
                  currentPath={currentPath}
                  onFolderClick={handleFolderClick}
                  onRefresh={handleFolderCreated}
                />
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <FileGrid 
                  viewMode={viewMode} 
                  searchQuery={searchQuery} 
                  fileType="images" 
                  currentPath={currentPath}
                  onFolderClick={handleFolderClick}
                  onRefresh={handleFolderCreated}
                />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <FileGrid 
                  viewMode={viewMode} 
                  searchQuery={searchQuery} 
                  fileType="documents" 
                  currentPath={currentPath}
                  onFolderClick={handleFolderClick}
                  onRefresh={handleFolderCreated}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onSuccess={handleFolderCreated}
        currentPath={currentPath}
      />
    </div>
  )
}
