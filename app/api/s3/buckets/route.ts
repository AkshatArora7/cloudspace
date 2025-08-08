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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const buckets = await prisma.s3Config.findMany({
      where: { userId: decoded.userId },
      select: {
        id: true,
        name: true,
        bucketName: true,
        region: true,
        isDefault: true,
        createdAt: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ buckets })
  } catch (error) {
    console.error("Buckets fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch buckets" }, { status: 500 })
  }
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

    // Check user's bucket limit and existing buckets
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { s3Configs: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check for duplicate bucket name
    const existingBucket = user.s3Configs.find(bucket => bucket.bucketName === bucketName)
    if (existingBucket) {
      return NextResponse.json({ 
        error: "A bucket with this name already exists in your account. Please use a different bucket name.",
        code: "DUPLICATE_BUCKET"
      }, { status: 400 })
    }

    // Check bucket limit
    if (user.bucketLimit !== -1 && user.s3Configs.length >= user.bucketLimit) {
      return NextResponse.json({ 
        error: `Bucket limit reached. You can only have ${user.bucketLimit} buckets.`,
        code: "BUCKET_LIMIT_EXCEEDED",
        currentCount: user.s3Configs.length,
        maxAllowed: user.bucketLimit
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

    try {
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
        message: "Bucket added successfully",
        bucket: {
          id: bucket.id,
          name: bucket.name,
          bucketName: bucket.bucketName,
          region: bucket.region,
          isDefault: bucket.isDefault,
          createdAt: bucket.createdAt,
        }
      })
    } catch (dbError: any) {
      if (dbError.code === 'P2002') {
        return NextResponse.json({ 
          error: "A bucket with this name already exists in your account. Please use a different bucket name.",
          code: "DUPLICATE_BUCKET"
        }, { status: 400 })
      }
      throw dbError
    }
  } catch (error) {
    console.error("Bucket creation error:", error)
    return NextResponse.json({ 
      error: "Failed to add bucket. Please try again.",
      code: "SERVER_ERROR"
    }, { status: 500 })
  }
}
