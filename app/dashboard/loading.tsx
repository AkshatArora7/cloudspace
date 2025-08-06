import { Spinner } from "@/components/Spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="text-blue-600" showLogo={true} />
        <p className="text-gray-600 mt-4">Loading...</p>
      </div>
    </div>
  )
}
