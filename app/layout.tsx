import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CloudSpace - Manage Your S3 Files with Simplicity",
  description:
    "Transform your AWS S3 bucket into a beautiful, intuitive file management system. Upload, organize, and share your files with an Apple-inspired interface.",
  keywords: "AWS S3, file management, cloud storage, file upload, Next.js",
  authors: [{ name: "CloudSpace Team" }],
  openGraph: {
    title: "CloudSpace - S3 File Management Made Simple",
    description: "Beautiful file management for your AWS S3 bucket",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
