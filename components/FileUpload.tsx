"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"

interface UploadFile {
  file: File
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

export function FileUpload() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i]
      if (uploadFile.status !== "pending") continue

      try {
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f)))

        const formData = new FormData()
        formData.append("file", uploadFile.file)

        const token = localStorage.getItem("token")
        const response = await fetch("/api/s3/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (response.ok) {
          setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "success", progress: 100 } : f)))
        } else {
          const error = await response.text()
          setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "error", error } : f)))
        }
      } catch (error) {
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "error", error: "Upload failed" } : f)))
      }
    }

    setUploading(false)
  }

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status === "pending" || f.status === "uploading"))
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-2">Drag and drop files here, or click to select files</p>
                <p className="text-sm text-gray-500">Support for single or bulk uploads</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Upload Queue ({files.length})</h3>
              <div className="flex space-x-2">
                <Button
                  onClick={handleUploadFiles}
                  disabled={uploading || files.every((f) => f.status !== "pending")}
                  size="sm"
                >
                  {uploading ? "Uploading..." : "Upload All"}
                </Button>
                <Button
                  onClick={clearCompleted}
                  variant="outline"
                  size="sm"
                  disabled={!files.some((f) => f.status === "success" || f.status === "error")}
                >
                  Clear Completed
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {files.map((uploadFile, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <File className="h-5 w-5 text-gray-500 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{uploadFile.file.name}</p>
                    <p className="text-xs text-gray-500">{(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB</p>

                    {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="mt-2" />}

                    {uploadFile.status === "error" && uploadFile.error && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{uploadFile.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {uploadFile.status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {uploadFile.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploadFile.status === "uploading"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
