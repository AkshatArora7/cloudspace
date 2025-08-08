"use client"

import { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { Spinner } from "./Spinner"

interface AddBucketModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface UserLimits {
  currentCount: number
  maxAllowed: number
  canAddMore: boolean
}

export function AddBucketModal({ isOpen, onClose, onSuccess }: AddBucketModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
    bucketName: "",
    isDefault: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchUserLimits()
    }
  }, [isOpen])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.accessKeyId || !formData.secretAccessKey || !formData.region || !formData.bucketName) {
      setError("All fields are required")
      return
    }

    // Frontend validation
    if (!userLimits?.canAddMore) {
      setError(`You have reached your bucket limit of ${userLimits?.maxAllowed} buckets.`)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/s3/buckets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        setFormData({
          name: "",
          accessKeyId: "",
          secretAccessKey: "",
          region: "us-east-1",
          bucketName: "",
          isDefault: false,
        })
      } else {
        // Handle specific error codes
        switch (data.code) {
          case "DUPLICATE_BUCKET":
            setError("A bucket with this name already exists in your account. Please use a different bucket name.")
            break
          case "BUCKET_LIMIT_EXCEEDED":
            setError(`Bucket limit reached. You can only have ${data.maxAllowed} buckets. (Currently: ${data.currentCount})`)
            break
          default:
            setError(data.error || "Failed to add bucket")
        }
      }
    } catch (error) {
      console.error("Error adding bucket:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: "",
      accessKeyId: "",
      secretAccessKey: "",
      region: "us-east-1",
      bucketName: "",
      isDefault: false,
    })
    setError("")
    onClose()
  }

  const getRemainingBuckets = () => {
    if (!userLimits) return 0
    if (userLimits.maxAllowed === -1) return "Unlimited"
    return userLimits.maxAllowed - userLimits.currentCount
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Add S3 Bucket
          </DialogTitle>
          <DialogDescription>
            Connect a new AWS S3 bucket to your CloudSpace account.
          </DialogDescription>
        </DialogHeader>

        {/* Bucket Limits Info */}
        {userLimits && (
          <div className="mb-4">
            {userLimits.canAddMore ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You can add {getRemainingBuckets()} more bucket{getRemainingBuckets() !== 1 && getRemainingBuckets() !== "Unlimited" ? "s" : ""}.
                  ({userLimits.currentCount}/{userLimits.maxAllowed === -1 ? "∞" : userLimits.maxAllowed})
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have reached your bucket limit of {userLimits.maxAllowed} buckets.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Production Bucket"
              disabled={isSubmitting || !userLimits?.canAddMore}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bucketName">Bucket Name *</Label>
            <Input
              id="bucketName"
              value={formData.bucketName}
              onChange={(e) => setFormData(prev => ({ ...prev, bucketName: e.target.value }))}
              placeholder="my-cloudspace-bucket"
              disabled={isSubmitting || !userLimits?.canAddMore}
            />
            <p className="text-xs text-gray-500">
              Must be unique across your account
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="us-east-1"
                disabled={isSubmitting || !userLimits?.canAddMore}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessKeyId">Access Key ID *</Label>
              <Input
                id="accessKeyId"
                value={formData.accessKeyId}
                onChange={(e) => setFormData(prev => ({ ...prev, accessKeyId: e.target.value }))}
                placeholder="AKIA..."
                disabled={isSubmitting || !userLimits?.canAddMore}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretAccessKey">Secret Access Key *</Label>
            <Input
              id="secretAccessKey"
              type="password"
              value={formData.secretAccessKey}
              onChange={(e) => setFormData(prev => ({ ...prev, secretAccessKey: e.target.value }))}
              placeholder="wJalrXUtnFEMI/K7MDENG..."
              disabled={isSubmitting || !userLimits?.canAddMore}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: !!checked }))}
              disabled={isSubmitting || !userLimits?.canAddMore}
            />
            <Label htmlFor="isDefault" className="text-sm">
              Set as default bucket
            </Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !userLimits?.canAddMore}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Add Bucket
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
