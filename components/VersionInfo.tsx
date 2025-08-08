"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Info, GitCommit, Calendar, Code } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface VersionData {
  version: string
  buildDate: string
  commit: string
  branch: string
  environment: string
  timestamp: string
}

export function VersionInfo() {
  const [versionData, setVersionData] = useState<VersionData | null>(null)

  useEffect(() => {
    fetch("/api/version")
      .then(res => res.json())
      .then(data => setVersionData(data))
      .catch(err => console.error("Failed to load version:", err))
  }, [])

  if (!versionData) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          <Info className="h-3 w-3 mr-1" />
          v{versionData.version}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">CloudSpace</h4>
            <Badge variant="outline">v{versionData.version}</Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <GitCommit className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600">Commit:</span>
              <code className="text-xs bg-gray-100 px-1 rounded">
                {versionData.commit.substring(0, 8)}
              </code>
            </div>
            
            <div className="flex items-center gap-2">
              <Code className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600">Branch:</span>
              <Badge variant="secondary" className="text-xs">
                {versionData.branch}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600">Built:</span>
              <span className="text-xs">
                {new Date(versionData.buildDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="pt-2 border-t text-xs text-gray-500">
            Environment: {versionData.environment}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
