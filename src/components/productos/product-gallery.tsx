'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ProductGalleryImage {
  id: string
  url: string
  altText: string
}

function shouldSkipOptimization(url: string) {
  return url.includes('.supabase.co/storage/v1/object/public/')
}

function buildProductPlaceholder(productName: string) {
  const label = (productName || 'Producto artesanal').slice(0, 36)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="100%" stop-color="#fcd34d"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)"/>
      <rect x="48" y="48" width="1104" height="804" rx="36" fill="none" stroke="#92400e" stroke-width="6" opacity="0.35"/>
      <text x="600" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="#78350f">${label}</text>
      <text x="600" y="495" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#92400e">Imagen en actualización</text>
    </svg>
  `

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function ProductGallery({ images, productName }: { images: ProductGalleryImage[]; productName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [brokenUrls, setBrokenUrls] = useState<Record<string, true>>({})
  const placeholderSrc = useMemo(() => buildProductPlaceholder(productName), [productName])
  const selectedImage = images[selectedIndex] ?? images[0]

  if (!selectedImage) {
    return null
  }

  const markAsBroken = (url: string) => {
    if (!url || url.startsWith('data:image/svg+xml')) {
      return
    }

    setBrokenUrls((prev) => (prev[url] ? prev : { ...prev, [url]: true }))
  }

  const resolveImageSrc = (url: string) => {
    return brokenUrls[url] ? placeholderSrc : url
  }

  const selectedSrc = resolveImageSrc(selectedImage.url)

  return (
    <div className="space-y-3">
      <div className="relative h-80 md:h-[420px] w-full rounded-xl overflow-hidden bg-gray-100">
        <Image
          src={selectedSrc}
          alt={selectedImage.altText || productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={shouldSkipOptimization(selectedSrc)}
          onError={() => markAsBroken(selectedImage.url)}
          onLoadingComplete={(img) => {
            if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
              markAsBroken(selectedImage.url)
            }
          }}
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
                src={resolveImageSrc(image.url)}
                alt={image.altText || productName}
                fill
                className="object-cover"
                sizes="120px"
                unoptimized={shouldSkipOptimization(resolveImageSrc(image.url))}
                onError={() => markAsBroken(image.url)}
                onLoadingComplete={(img) => {
                  if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
                    markAsBroken(image.url)
                  }
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}