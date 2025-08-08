"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, AlertTriangle, Database } from "lucide-react"
import { MdWarning } from "react-icons/md"
import { Spinner } from "./Spinner"

interface DeleteBucketModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  bucketName: string
  displayName: string
  isDeleting?: boolean
}

export function DeleteBucketModal({
  isOpen,
  onClose,
  onConfirm,
  bucketName,
  displayName,
  isDeleting = false
}: DeleteBucketModalProps) {
  const [confirmText, setConfirmText] = useState("")

  const handleClose = () => {
    setConfirmText("")
    onClose()
  }

  const handleConfirm = () => {
    if (confirmText === bucketName) {
      onConfirm()
    }
  }

  const isConfirmValid = confirmText === bucketName

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Remove S3 Bucket
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <Database className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">{displayName}</p>
                <p className="text-sm text-red-600">{bucketName}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm">
                This will remove the bucket configuration from your CloudSpace account.
              </p>
              <p className="text-sm text-red-600 font-medium flex items-center gap-2">
                <MdWarning className="h-4 w-4 flex-shrink-0" />
                This will not delete the actual S3 bucket or its contents.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmText" className="text-sm font-medium">
                Type <span className="font-mono bg-gray-100 px-1 rounded">{bucketName}</span> to confirm:
              </Label>
              <Input
                id="confirmText"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Enter bucket name to confirm"
                disabled={isDeleting}
                autoComplete="off"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || !isConfirmValid}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Spinner size="sm" className="mr-2 text-white" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Bucket
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
