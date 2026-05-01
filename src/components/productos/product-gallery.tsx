'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ProductGalleryImage {
  id: string
  url: string
  altText: string
}

export function ProductGallery({ images, productName }: { images: ProductGalleryImage[]; productName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedImage = images[selectedIndex] ?? images[0]

  if (!selectedImage) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="relative h-80 md:h-[420px] w-full rounded-xl overflow-hidden bg-gray-100">
        <Image
          src={selectedImage.url}
          alt={selectedImage.altText || productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg border bg-gray-100 transition-colors',
                index === selectedIndex ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200 hover:border-gray-300'
              )}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
            >
              <Image
                src={image.url}
                alt={image.altText || productName}
                fill
                className="object-cover"
                sizes="120px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}