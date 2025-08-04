import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    jwt.verify(token, process.env.JWT_SECRET!)

    const { accessKeyId, secretAccessKey, region, bucketName } = await request.json()

    // Test S3 connection
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    try {
      await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 1,
        }),
      )

      return NextResponse.json({ message: "Connection successful!" })
    } catch (s3Error: any) {
      console.error("S3 test error:", s3Error)
      return NextResponse.json({ error: `S3 Error: ${s3Error.message}` }, { status: 400 })
    }
  } catch (error) {
    console.error("Test connection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
