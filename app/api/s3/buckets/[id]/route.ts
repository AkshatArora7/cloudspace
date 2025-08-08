import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function DELETE(
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

    await prisma.s3Config.delete({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    })

    return NextResponse.json({ message: "Bucket removed successfully" })
  } catch (error) {
    console.error("Bucket deletion error:", error)
    return NextResponse.json({ error: "Failed to remove bucket" }, { status: 500 })
  }
}
