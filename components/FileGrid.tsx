"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { File, ImageIcon, Download, Share, Trash2, MoreHorizontal, Calendar, HardDrive, Folder } from "lucide-react"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DeleteConfirmationModal } from "./DeleteConfirmationModal"

interface FileItem {
  key: string
  name: string
  size: number
  lastModified: string
  type: string
  url?: string
  isFolder?: boolean
}

interface FileGridProps {
  viewMode: "grid" | "list"
  searchQuery: string
  fileType: "all" | "images" | "documents"
  currentPath?: string
  onFolderClick?: (folderPath: string) => void
  onRefresh?: () => void
}

export function FileGrid({ 
  viewMode, 
  searchQuery, 
  fileType, 
  currentPath = "",
  onFolderClick,
  onRefresh 
}: FileGridProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; file: FileItem | null }>({
    isOpen: false,
    file: null
  })
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`/api/s3/files?type=${fileType}&search=${searchQuery}&path=${encodeURIComponent(currentPath)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setFiles(data.files || [])
        }
      } catch (error) {
        console.error("Error fetching files:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [fileType, searchQuery, currentPath])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isImage = (type: string) => {
    return type.startsWith("image/")
  }

  const handleDownload = async (file: FileItem) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/s3/download?key=${encodeURIComponent(file.key)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading file:", error)
    }
  }

  const handleShare = async (file: FileItem) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/s3/share?key=${encodeURIComponent(file.key)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        navigator.clipboard.writeText(data.url)
        // You could add a toast notification here
      }
    } catch (error) {
      console.error("Error sharing file:", error)
    }
  }

  const handleDeleteClick = (file: FileItem) => {
    setDeleteModal({ isOpen: true, file })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.file) return
    
    setIsDeleting(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/s3/delete?key=${encodeURIComponent(deleteModal.file.key)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setFiles(files.filter(f => f.key !== deleteModal.file?.key))
        setDeleteModal({ isOpen: false, file: null })
      } else {
        console.error("Failed to delete file")
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, file: null })
  }

  const handleDelete = async (file: FileItem) => {
    handleDeleteClick(file)
  }

  const handleFolderClick = (folderPath: string) => {
    if (onFolderClick) {
      onFolderClick(folderPath)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
        <p className="text-gray-500">
          {searchQuery ? `No files match "${searchQuery}"` : "Upload some files to get started"}
        </p>
      </div>
    )
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        {files.map((file) => (
          <Card key={file.key} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {file.isFolder ? (
                    <div 
                      className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors"
                      onClick={() => handleFolderClick(file.key)}
                    >
                      <Folder className="h-5 w-5 text-blue-600" />
                    </div>
                  ) : isImage(file.type) ? (
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <File className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p 
                    className={`text-sm font-medium text-gray-900 truncate ${file.isFolder ? 'cursor-pointer hover:text-blue-600' : ''}`}
                    onClick={() => file.isFolder && handleFolderClick(file.key)}
                  >
                    {file.name}
                  </p>
                  {!file.isFolder && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <HardDrive className="h-3 w-3 mr-1" />
                        {formatFileSize(file.size)}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(file.lastModified)}
                      </span>
                    </div>
                  )}
                </div>

                {!file.isFolder && (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleShare(file)}>
                      <Share className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDelete(file)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <Card key={file.key} className="group hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div 
                className={`aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative ${file.isFolder ? 'cursor-pointer' : ''}`}
                onClick={() => file.isFolder && handleFolderClick(file.key)}
              >
                {file.isFolder ? (
                  <div className="w-full h-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <Folder className="h-16 w-16 text-blue-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                ) : isImage(file.type) && file.url ? (
                  <Image
                    src={file.url || "/placeholder.svg"}
                    alt={file.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <File className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                {!file.isFolder && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => handleDownload(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleShare(file)}>
                        <Share className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(file)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 
                  className={`font-medium text-sm text-gray-900 truncate ${file.isFolder ? 'cursor-pointer hover:text-blue-600' : ''}`}
                  onClick={() => file.isFolder && handleFolderClick(file.key)}
                >
                  {file.name}
                </h3>
                {!file.isFolder && (
                  <>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.lastModified)}</span>
                    </div>
                    {isImage(file.type) && (
                      <Badge variant="secondary" className="text-xs">
                        Image
                      </Badge>
                    )}
                  </>
                )}
                {file.isFolder && (
                  <Badge variant="outline" className="text-xs">
                    Folder
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        fileName={deleteModal.file?.name || ""}
        isDeleting={isDeleting}
      />
    </>
  )
}
