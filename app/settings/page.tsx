"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  User, 
  Database, 
  Shield, 
  Bell, 
  Trash2,
  Save,
  Plus
} from "lucide-react"
import Image from "next/image"
import { Spinner } from "@/components/Spinner"
import { BucketDrawer } from "@/components/BucketDrawer"
import { VersionInfo } from "@/components/VersionInfo"

interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

interface S3Bucket {
  id: string
  name: string
  bucketName: string
  region: string
  isDefault: boolean
  createdAt: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [buckets, setBuckets] = useState<S3Bucket[]>([])
  const [loading, setLoading] = useState(true)
  const [currentBucket, setCurrentBucket] = useState<S3Bucket | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth/signin")
        return
      }

      // Fetch user profile
      const userResponse = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData)
      }

      // Fetch buckets
      const bucketsResponse = await fetch("/api/s3/buckets", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (bucketsResponse.ok) {
        const bucketsData = await bucketsResponse.json()
        setBuckets(bucketsData.buckets)
        const defaultBucket = bucketsData.buckets.find((b: S3Bucket) => b.isDefault)
        setCurrentBucket(defaultBucket || bucketsData.buckets[0] || null)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBucketChange = (bucket: S3Bucket | null) => {
    setCurrentBucket(bucket)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" className="text-blue-600" showLogo={true} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="CloudSpace Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-xl font-semibold text-gray-900">Settings</span>
              <VersionInfo />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Manage your account information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={user?.name || ""} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} readOnly />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Account Created</Label>
                <Input 
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""} 
                  readOnly 
                />
              </div>
              <Button disabled>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* S3 Bucket Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                S3 Bucket Management
              </CardTitle>
              <CardDescription>
                Manage your AWS S3 bucket connections and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Connected Buckets</p>
                  <p className="text-xs text-gray-500">{buckets.length} bucket(s) configured</p>
                </div>
                <BucketDrawer
                  currentBucket={currentBucket}
                  onBucketChange={handleBucketChange}
                >
                  <Button>
                    <Database className="h-4 w-4 mr-2" />
                    Manage Buckets
                  </Button>
                </BucketDrawer>
              </div>

              {currentBucket && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{currentBucket.name}</h4>
                    <Badge variant="secondary">Default</Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Bucket: {currentBucket.bucketName}</div>
                    <div>Region: {currentBucket.region}</div>
                  </div>
                </div>
              )}

              {buckets.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No S3 buckets configured</p>
                  <BucketDrawer
                    currentBucket={currentBucket}
                    onBucketChange={handleBucketChange}
                  >
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Bucket
                    </Button>
                  </BucketDrawer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and privacy settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline" disabled>
                  Enable 2FA
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">API Keys</p>
                  <p className="text-sm text-gray-500">Manage API access keys for programmatic access</p>
                </div>
                <Button variant="outline" disabled>
                  Manage Keys
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications about your files and account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates about file operations</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Storage Alerts</p>
                    <p className="text-sm text-gray-500">Get notified when approaching storage limits</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <p className="font-medium text-red-800">Delete Account</p>
                  <p className="text-sm text-red-600">Permanently delete your account and all associated data</p>
                </div>
                <Button variant="destructive" disabled>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
