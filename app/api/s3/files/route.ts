import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"

const prisma = new PrismaClient()

const decrypt = (text: string) => {
  const algorithm = "aes-256-cbc"
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, "salt", 32)
  const textParts = text.split(":")
  const iv = Buffer.from(textParts.shift()!, "hex")
  const encryptedText = textParts.join(":")
  const decipher = crypto.createDecipher(algorithm, key)
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
    const search = searchParams.get("search") || ""

    // Get user's S3 configuration
    const s3Config = await prisma.s3Config.findUnique({
      where: { userId: decoded.userId },
    })

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

    // List objects
    const listCommand = new ListObjectsV2Command({
      Bucket: s3Config.bucketName,
      MaxKeys: 1000,
    })

    const response = await s3Client.send(listCommand)
    const objects = response.Contents || []

    // Filter and format files
    const files = await Promise.all(
      objects
        .filter((obj) => {
          if (!obj.Key) return false

          const fileName = obj.Key.split("/").pop() || ""

          // Filter by search query
          if (search && !fileName.toLowerCase().includes(search.toLowerCase())) {
            return false
          }

          // Filter by file type
          if (fileType === "images") {
            return obj.Key.startsWith("images/")
          } else if (fileType === "documents") {
            return obj.Key.startsWith("files/")
          }

          return true
        })
        .map(async (obj) => {
          const fileName = obj.Key!.split("/").pop() || obj.Key!
          const isImage = obj.Key!.startsWith("images/")

          let url = undefined
          if (isImage) {
            // Generate presigned URL for images
            try {
              url = await getSignedUrl(
                s3Client,
                new GetObjectCommand({
                  Bucket: s3Config.bucketName,
                  Key: obj.Key!,
                }),
                { expiresIn: 3600 }, // 1 hour
              )
            } catch (error) {
              console.error("Error generating presigned URL:", error)
            }
          }

          return {
            key: obj.Key!,
            name: fileName,
            size: obj.Size || 0,
            lastModified: obj.LastModified?.toISOString() || "",
            type: isImage ? "image/jpeg" : "application/octet-stream",
            url,
          }
        }),
    )

    return NextResponse.json({ files })
  } catch (error) {
    console.error("List files error:", error)
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
  }
}
