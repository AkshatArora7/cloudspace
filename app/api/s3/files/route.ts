import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import crypto from "crypto"

const prisma = new PrismaClient()

const decrypt = (text: string) => {
  const algorithm = "aes-256-cbc"
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, "salt", 32)
  const textParts = text.split(":")
  const iv = Buffer.from(textParts.shift()!, "hex")
  const encryptedText = textParts.join(":")
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encryptedText, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { searchParams } = new URL(request.url)
    const fileType = searchParams.get("type") || "all"
    const searchQuery = searchParams.get("search") || ""
    const currentPath = searchParams.get("path") || ""
    const bucketId = searchParams.get("bucketId")

    // Get user's S3 configuration
    let s3Config;
    if (bucketId) {
      s3Config = await prisma.s3Config.findFirst({
        where: { 
          id: bucketId,
          userId: decoded.userId 
        },
      })
    } else {
      // Fallback to default bucket or first available
      s3Config = await prisma.s3Config.findFirst({
        where: { userId: decoded.userId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' }
        ]
      })
    }

    if (!s3Config) {
      return NextResponse.json({ error: "S3 configuration not found" }, { status: 400 })
    }

    // Decrypt secret key
    const secretAccessKey = decrypt(s3Config.secretAccessKey)

    // Create S3 client
    const s3Client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey,
      },
    })

    // List objects with optional prefix
    const prefix = currentPath ? `${currentPath}/` : ""
    const command = new ListObjectsV2Command({
      Bucket: s3Config.bucketName,
      Prefix: prefix,
      Delimiter: "/", // This helps separate folders from files
    })

    const response = await s3Client.send(command)
    
    const files = []
    
    // Add folders (CommonPrefixes)
    if (response.CommonPrefixes) {
      for (const folder of response.CommonPrefixes) {
        if (folder.Prefix) {
          const folderName = folder.Prefix.replace(prefix, "").replace("/", "")
          if (folderName) {
            files.push({
              key: folder.Prefix,
              name: folderName,
              size: 0,
              lastModified: new Date().toISOString(),
              type: "folder",
              isFolder: true,
            })
          }
        }
      }
    }

    // Add files
    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key && object.Key !== prefix && !object.Key.endsWith("/")) {
          const fileName = object.Key.replace(prefix, "")
          const fileExtension = fileName.split(".").pop()?.toLowerCase() || ""
          const mimeType = getMimeType(fileExtension)
          
          // Filter by file type if specified
          if (fileType !== "all") {
            if (fileType === "images" && !mimeType.startsWith("image/")) continue
            if (fileType === "documents" && mimeType.startsWith("image/")) continue
          }

          // Filter by search query
          if (searchQuery && !fileName.toLowerCase().includes(searchQuery.toLowerCase())) {
            continue
          }

          files.push({
            key: object.Key,
            name: fileName,
            size: object.Size || 0,
            lastModified: object.LastModified?.toISOString() || new Date().toISOString(),
            type: mimeType,
            isFolder: false,
          })
        }
      }
    }

    return NextResponse.json({ files })
  } catch (error) {
    console.error("List files error:", error)
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
  }
}

function getMimeType(extension: string): string {
  const mimeTypes: { [key: string]: string } = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    
    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    
    // Default
    default: "application/octet-stream",
  }
  
  return mimeTypes[extension] || mimeTypes.default
}
