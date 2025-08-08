import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          s3Configs: true,
        },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        bucketLimit: user.bucketLimit,
        hasS3Config: user.s3Configs.length > 0,
        bucketCount: user.s3Configs.length,
      })
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("Profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
