import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const versionPath = path.join(process.cwd(), "version.json")
    const packagePath = path.join(process.cwd(), "package.json")
    
    let versionData = {
      version: "0.1.0",
      buildDate: new Date().toISOString(),
      commit: "unknown",
      branch: "main"
    }

    // Try to read version.json
    if (fs.existsSync(versionPath)) {
      const versionFile = fs.readFileSync(versionPath, "utf8")
      versionData = JSON.parse(versionFile)
    } else if (fs.existsSync(packagePath)) {
      // Fallback to package.json
      const packageFile = fs.readFileSync(packagePath, "utf8")
      const packageData = JSON.parse(packageFile)
      versionData.version = packageData.version
    }

    return NextResponse.json({
      ...versionData,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Version API error:", error)
    return NextResponse.json({
      version: "unknown",
      error: "Failed to load version information"
    }, { status: 500 })
  }
}
