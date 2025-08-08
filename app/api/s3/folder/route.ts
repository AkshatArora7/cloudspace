import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { folderName, parentPath, bucketId } = await request.json()

    if (!folderName) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    // Validate folder name
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(folderName)) {
      return NextResponse.json({ error: "Invalid folder name. Use only letters, numbers, spaces, hyphens, and underscores." }, { status: 400 })
    }

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
      // Fallback to default bucket
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

    // Construct folder path
    const folderPath = parentPath ? `${parentPath}/${folderName}/` : `${folderName}/`

    // Create empty object to represent folder in S3
    const command = new PutObjectCommand({
      Bucket: s3Config.bucketName,
      Key: folderPath,
      Body: "",
      ContentType: "application/x-directory",
    })

    await s3Client.send(command)

    return NextResponse.json({ 
      message: "Folder created successfully",
      folderPath 
    })
  } catch (error) {
    console.error("Folder creation error:", error)
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  }
}
