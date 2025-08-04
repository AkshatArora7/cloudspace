import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import crypto from "crypto"

const prisma = new PrismaClient()

// Simple encryption for storing credentials
const encrypt = (text: string) => {
  const algorithm = "aes-256-cbc"
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, "salt", 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(algorithm, key)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  return iv.toString("hex") + ":" + encrypted
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { accessKeyId, secretAccessKey, region, bucketName } = await request.json()

    // Validate input
    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Encrypt sensitive data
    const encryptedSecretKey = encrypt(secretAccessKey)

    // Save or update S3 configuration
    await prisma.s3Config.upsert({
      where: { userId: decoded.userId },
      update: {
        accessKeyId,
        secretAccessKey: encryptedSecretKey,
        region,
        bucketName,
      },
      create: {
        userId: decoded.userId,
        accessKeyId,
        secretAccessKey: encryptedSecretKey,
        region,
        bucketName,
      },
    })

    return NextResponse.json({ message: "Configuration saved successfully" })
  } catch (error) {
    console.error("S3 config error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
