"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderPlus } from "lucide-react"
import { Spinner } from "./Spinner"

interface CreateFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentPath?: string
}

export function CreateFolderModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentPath = "" 
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!folderName.trim()) {
      setError("Folder name is required")
      return
    }

    if (!/^[a-zA-Z0-9_\-\s]+$/.test(folderName)) {
      setError("Invalid folder name. Use only letters, numbers, spaces, hyphens, and underscores.")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/s3/folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          folderName: folderName.trim(),
          parentPath: currentPath,
        }),
      })

      if (response.ok) {
        setFolderName("")
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create folder")
      }
    } catch (error) {
      console.error("Error creating folder:", error)
      setError("Failed to create folder")
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setFolderName("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-blue-600" />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            {currentPath 
              ? `Create a new folder in "${currentPath}"`
              : "Create a new folder in the root directory"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              disabled={isCreating}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !folderName.trim()}
            >
              {isCreating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Folder
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
