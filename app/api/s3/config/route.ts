import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import crypto from "crypto"

const prisma = new PrismaClient()

const encrypt = (text: string) => {
  const algorithm = "aes-256-cbc"
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, "salt", 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
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

    const { name, accessKeyId, secretAccessKey, region, bucketName, isDefault = false } = await request.json()

    if (!name || !accessKeyId || !secretAccessKey || !region || !bucketName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check user's bucket limit
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { s3Configs: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.bucketLimit !== -1 && user.s3Configs.length >= user.bucketLimit) {
      return NextResponse.json({ 
        error: `Bucket limit reached. You can only have ${user.bucketLimit} buckets.` 
      }, { status: 400 })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.s3Config.updateMany({
        where: { userId: decoded.userId },
        data: { isDefault: false }
      })
    }

    const encryptedSecretKey = encrypt(secretAccessKey)

    // Check if this is the user's first bucket
    const isFirstBucket = user.s3Configs.length === 0

    const bucket = await prisma.s3Config.create({
      data: {
        userId: decoded.userId,
        name,
        accessKeyId,
        secretAccessKey: encryptedSecretKey,
        region,
        bucketName,
        isDefault: isDefault || isFirstBucket,
      },
    })

    return NextResponse.json({ 
      message: "Configuration saved successfully",
      bucket: {
        id: bucket.id,
        name: bucket.name,
        bucketName: bucket.bucketName,
        region: bucket.region,
        isDefault: bucket.isDefault,
      }
    })
  } catch (error) {
    console.error("S3 config error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const { searchParams } = new URL(request.url)
    const bucketId = searchParams.get("bucketId")

    if (bucketId) {
      // Delete specific bucket
      await prisma.s3Config.delete({
        where: { 
          id: bucketId,
          userId: decoded.userId 
        },
      })
    } else {
      // Delete all buckets (legacy support)
      await prisma.s3Config.deleteMany({
        where: { userId: decoded.userId },
      })
    }

    return NextResponse.json({ message: "Configuration deleted successfully" })
  } catch (error) {
    console.error("S3 config delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
