"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Plus, Trash2, Star, StarOff, AlertTriangle, Info } from "lucide-react"
import { AddBucketModal } from "./AddBucketModal"
import { DeleteBucketModal } from "./DeleteBucketModal"

interface S3Bucket {
  id: string
  name: string
  bucketName: string
  region: string
  isDefault: boolean
  createdAt: string
}

interface BucketDrawerProps {
  currentBucket: S3Bucket | null
  onBucketChange: (bucket: S3Bucket) => void
  children: React.ReactNode
}

interface UserLimits {
  currentCount: number
  maxAllowed: number
  canAddMore: boolean
}

export function BucketDrawer({ currentBucket, onBucketChange, children }: BucketDrawerProps) {
  const [buckets, setBuckets] = useState<S3Bucket[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null)
  const [error, setError] = useState("")
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    bucket: S3Bucket | null
  }>({
    isOpen: false,
    bucket: null
  })
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchBuckets()
    fetchUserLimits()
  }, [])

  const fetchUserLimits = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const userData = await response.json()
        const canAddMore = userData.bucketLimit === -1 || userData.bucketCount < userData.bucketLimit
        
        setUserLimits({
          currentCount: userData.bucketCount || 0,
          maxAllowed: userData.bucketLimit,
          canAddMore
        })
      }
    } catch (error) {
      console.error("Error fetching user limits:", error)
    }
  }

  const fetchBuckets = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/s3/buckets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBuckets(data.buckets)
        
        // Set current bucket to default if none selected
        if (!currentBucket && data.buckets.length > 0) {
          const defaultBucket = data.buckets.find((b: S3Bucket) => b.isDefault) || data.buckets[0]
          onBucketChange(defaultBucket)
        }
      }
    } catch (error) {
      console.error("Error fetching buckets:", error)
      setError("Failed to load buckets")
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (bucketId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/s3/buckets/${bucketId}/default`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchBuckets()
        // Update current bucket if it's the one being set as default
        const updatedBucket = buckets.find(b => b.id === bucketId)
        if (updatedBucket) {
          onBucketChange({ ...updatedBucket, isDefault: true })
        }
      } else {
        setError("Failed to set default bucket")
      }
    } catch (error) {
      console.error("Error setting default bucket:", error)
      setError("Failed to set default bucket")
    }
  }

  const handleDeleteClick = (bucket: S3Bucket) => {
    setDeleteModal({ isOpen: true, bucket })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.bucket) return
    
    setIsDeleting(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/s3/buckets/${deleteModal.bucket.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setBuckets(prev => prev.filter(b => b.id !== deleteModal.bucket?.id))
        
        // Update user limits
        if (userLimits) {
          setUserLimits({
            ...userLimits,
            currentCount: userLimits.currentCount - 1,
            canAddMore: userLimits.maxAllowed === -1 || (userLimits.currentCount - 1) < userLimits.maxAllowed
          })
        }
        
        // If deleted bucket was current, switch to another
        if (currentBucket?.id === deleteModal.bucket.id) {
          const remaining = buckets.filter(b => b.id !== deleteModal.bucket?.id)
          if (remaining.length > 0) {
            onBucketChange(remaining[0])
          } else {
            // Pass null but handle it properly in the parent component
            onBucketChange(remaining[0] || null as any)
          }
        }
        
        setDeleteModal({ isOpen: false, bucket: null })
      } else {
        setError("Failed to remove bucket")
      }
    } catch (error) {
      console.error("Error deleting bucket:", error)
      setError("Failed to remove bucket")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, bucket: null })
  }

  const getRemainingBuckets = () => {
    if (!userLimits) return 0
    if (userLimits.maxAllowed === -1) return "Unlimited"
    return userLimits.maxAllowed - userLimits.currentCount
  }

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Manage S3 Buckets
            </SheetTitle>
            <SheetDescription>
              Add and manage multiple S3 buckets for your file storage needs.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Bucket Limits Info */}
            {userLimits && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Buckets: {userLimits.currentCount}/{userLimits.maxAllowed === -1 ? "∞" : userLimits.maxAllowed}
                  {userLimits.canAddMore && ` (${getRemainingBuckets()} remaining)`}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Your Buckets ({buckets.length})</h3>
              <Button 
                size="sm" 
                onClick={() => setShowAddModal(true)}
                disabled={!userLimits?.canAddMore}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Bucket
              </Button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : buckets.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Database className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 text-center mb-4">
                    No S3 buckets configured yet. Add your first bucket to get started.
                  </p>
                  <Button 
                    onClick={() => setShowAddModal(true)}
                    disabled={!userLimits?.canAddMore}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Bucket
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {buckets.map((bucket) => (
                  <Card 
                    key={bucket.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      currentBucket?.id === bucket.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => onBucketChange(bucket)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {bucket.name}
                          {bucket.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSetDefault(bucket.id)
                            }}
                            className="h-8 w-8 p-0"
                            disabled={bucket.isDefault}
                          >
                            {bucket.isDefault ? (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            ) : (
                              <StarOff className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(bucket)
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Bucket: {bucket.bucketName}</div>
                        <div>Region: {bucket.region}</div>
                        <div>Added: {new Date(bucket.createdAt).toLocaleDateString()}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AddBucketModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchBuckets()
          fetchUserLimits()
          setShowAddModal(false)
        }}
      />

      <DeleteBucketModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        bucketName={deleteModal.bucket?.bucketName || ""}
        displayName={deleteModal.bucket?.name || ""}
        isDeleting={isDeleting}
      />
    </>
  )
}
