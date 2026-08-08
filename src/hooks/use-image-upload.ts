'use client'

import { useCallback, useRef, useState } from 'react'

interface UseImageUploadReturn {
  fileInputRef: React.RefObject<HTMLInputElement>
  localPreviewUrl: string | null
  uploadingImage: boolean
  handleImageSelected: (file: File) => Promise<{ url: string } | { error: string }>
  clearPreview: () => void
}

export function useImageUpload(): UseImageUploadReturn {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const clearPreview = useCallback(() => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl)
      setLocalPreviewUrl(null)
    }
  }, [localPreviewUrl])

  const handleImageSelected = useCallback(
    async (file: File): Promise<{ url: string } | { error: string }> => {
      const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
      if (!ALLOWED_MIME.has(file.type)) {
        return { error: `Formato no soportado: ${file.type}. Usa JPG, PNG o WEBP` }
      }
      const MAX_SIZE = 5 * 1024 * 1024
      if (file.size > MAX_SIZE) {
        return {
          error: `La imagen supera 5MB (tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        }
      }

      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
      const blobUrl = URL.createObjectURL(file)
      setLocalPreviewUrl(blobUrl)

      setUploadingImage(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/admin/uploads', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(data.error || `Error del servidor (${res.status})`)
        }

        if (typeof data.url !== 'string') {
          throw new Error('La respuesta del servidor no contiene una URL válida')
        }

        URL.revokeObjectURL(blobUrl)
        setLocalPreviewUrl(null)
        return { url: data.url }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'No se pudo subir la imagen'
        return { error: errorMsg }
      } finally {
        setUploadingImage(false)
      }
    },
    [localPreviewUrl],
  )

  return { fileInputRef, localPreviewUrl, uploadingImage, handleImageSelected, clearPreview }
}
