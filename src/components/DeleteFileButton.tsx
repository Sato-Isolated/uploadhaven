'use client'

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface DeleteFileButtonProps {
  filename: string
  fileName: string
}

export default function DeleteFileButton({ filename, fileName }: DeleteFileButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/files/${filename}/delete`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('File deleted successfully')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-600 hover:text-red-700"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
