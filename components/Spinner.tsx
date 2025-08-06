import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showLogo?: boolean
}

export function Spinner({ size = "md", className, showLogo = false }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  const logoSizes = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {showLogo && (
        <Image
          src="/logo.png"
          alt="CloudSpace Logo"
          width={logoSizes[size].width}
          height={logoSizes[size].height}
          className="object-contain"
        />
      )}
      <AiOutlineLoading3Quarters 
        className={cn("animate-spin", sizeClasses[size], className)} 
      />
    </div>
  )
}
