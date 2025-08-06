import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
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
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "File key is required" }, { status: 400 })
    }

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

    // Get the object
    const command = new GetObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
    })

    const response = await s3Client.send(command)

    if (!response.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Convert stream to buffer
    const chunks = []
    const reader = response.Body.transformToWebStream().getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))

    // Set appropriate headers
    const fileName = key.split("/").pop() || "download"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
