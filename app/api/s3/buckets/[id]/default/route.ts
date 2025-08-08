import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Unset all defaults for this user
    await prisma.s3Config.updateMany({
      where: { userId: decoded.userId },
      data: { isDefault: false }
    })

    // Set new default
    await prisma.s3Config.update({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
      data: { isDefault: true }
    })

    return NextResponse.json({ message: "Default bucket updated successfully" })
  } catch (error) {
    console.error("Default bucket update error:", error)
    return NextResponse.json({ error: "Failed to update default bucket" }, { status: 500 })
  }
}
