"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Key,
  Globe,
  Database,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react"

interface S3ConfigFormProps {
  onComplete: () => void
}

export function S3ConfigForm({ onComplete }: S3ConfigFormProps) {
  const [formData, setFormData] = useState({
    accessKeyId: "",
    secretAccessKey: "",
    region: "",
    bucketName: "",
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState("")
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/s3/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        onComplete()
      } else {
        setError(data.error || "Failed to save configuration")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/s3/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      setTestResult({
        success: response.ok,
        message: data.message || (response.ok ? "Connection successful!" : "Connection failed"),
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: "Network error. Please try again.",
      })
    } finally {
      setTesting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">How to get your AWS credentials</CardTitle>
                  <CardDescription>Step-by-step guide to retrieve your S3 access keys</CardDescription>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${showInstructions ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Step 1: Access AWS Console</h4>
                  <p className="text-blue-800 text-sm mb-2">
                    Go to the AWS Management Console and sign in to your account.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://console.aws.amazon.com" target="_blank" rel="noopener noreferrer">
                      Open AWS Console
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Step 2: Create IAM User</h4>
                  <ol className="text-green-800 text-sm space-y-1 list-decimal list-inside">
                    <li>Navigate to IAM (Identity and Access Management)</li>
                    <li>Click "Users" in the left sidebar</li>
                    <li>Click "Create user"</li>
                    <li>Enter a username (e.g., "cloudspace-user")</li>
                    <li>Select "Programmatic access"</li>
                  </ol>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Step 3: Set Permissions</h4>
                  <p className="text-purple-800 text-sm mb-2">Attach the following policy to your user:</p>
                  <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">S3 Policy JSON</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}`)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <pre>{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject", 
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}`}</pre>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Step 4: Get Access Keys</h4>
                  <ol className="text-orange-800 text-sm space-y-1 list-decimal list-inside">
                    <li>Complete the user creation process</li>
                    <li>Download the CSV file with your credentials</li>
                    <li>Copy the Access Key ID and Secret Access Key</li>
                    <li>Keep these credentials secure and never share them</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>AWS S3 Configuration</CardTitle>
          <CardDescription>Enter your AWS credentials to connect your S3 bucket</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accessKeyId">Access Key ID</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="accessKeyId"
                    name="accessKeyId"
                    type="text"
                    placeholder="AKIA..."
                    value={formData.accessKeyId}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretAccessKey">Secret Access Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="secretAccessKey"
                    name="secretAccessKey"
                    type={showSecretKey ? "text" : "password"}
                    placeholder="Enter secret key"
                    value={formData.secretAccessKey}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                  >
                    {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="region"
                    name="region"
                    type="text"
                    placeholder="us-east-1"
                    value={formData.region}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bucketName">Bucket Name</Label>
                <div className="relative">
                  <Database className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="bucketName"
                    name="bucketName"
                    type="text"
                    placeholder="my-bucket-name"
                    value={formData.bucketName}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={
                  testing ||
                  !formData.accessKeyId ||
                  !formData.secretAccessKey ||
                  !formData.region ||
                  !formData.bucketName
                }
              >
                {testing ? "Testing..." : "Test Connection"}
              </Button>
              <Button type="submit" disabled={loading || !testResult?.success} className="flex-1">
                {loading ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
