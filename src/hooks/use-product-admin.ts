'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface ProductRow {
  id: string
  name: string
  slug: string
  imageUrl: string
  price: number
  stockType: string
  weeklyStock: number
  isActive: boolean
  published: boolean
  description: string
  ingredients: string
  allergens: string[]
  riskNote: string | null
  imageAlt: string
  weight: number | null
  allowSlicing: boolean
  images: Array<{ id: string; url: string; altText: string | null; order: number }>
  currentWeekStock: {
    weekId: string
    maxStock: number
    currentStock: number
    reservedStock: number
    available: number
    sold: number
  } | null
  category: { id: string; name: string }
  _count: { orderItems: number; images: number }
}

export interface CategoryOption {
  id: string
  name: string
  description?: string
}

export interface ProductFormState {
  name: string
  slug: string
  description: string
  price: string
  weight: string
  ingredients: string
  allergens: string
  riskNote: string
  imageUrl: string
  imageAlt: string
  stockType: 'WEEKLY' | 'UNLIMITED'
  weeklyStock: string
  allowSlicing: boolean
  isActive: boolean
  published: boolean
  categoryId: string
  images: Array<{ url: string; altText: string }>
}

export type ProductFormField = keyof ProductFormState
export type ProductFormErrors = Partial<Record<ProductFormField, string>>

export const EMPTY_FORM: ProductFormState = {
  name: '',
  slug: '',
  description: '',
  price: '',
  weight: '',
  ingredients: '',
  allergens: '',
  riskNote: '',
  imageUrl: '',
  imageAlt: '',
  stockType: 'WEEKLY',
  weeklyStock: '0',
  allowSlicing: true,
  isActive: true,
  published: false,
  categoryId: '',
  images: [],
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

export function formatWeekId(weekId: string) {
  return weekId.replace('-W', ' / Sem ')
}

function mapProductToForm(product: ProductRow): ProductFormState {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: String(product.price),
    weight: product.weight == null ? '' : String(product.weight),
    ingredients: product.ingredients,
    allergens: (product.allergens ?? []).join(', '),
    riskNote: product.riskNote ?? '',
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
    stockType: product.stockType === 'UNLIMITED' ? 'UNLIMITED' : 'WEEKLY',
    weeklyStock: String(product.weeklyStock),
    allowSlicing: product.allowSlicing,
    isActive: product.isActive,
    published: product.published,
    categoryId: product.category.id,
    images: (product.images ?? [])
      .filter((image) => image.order > 0)
      .map((image) => ({
        url: image.url,
        altText: image.altText ?? '',
      })),
  }
}

function validateForm(values: ProductFormState): ProductFormErrors {
  const nextErrors: ProductFormErrors = {}

  if (values.name.trim().length < 2) nextErrors.name = 'Mínimo 2 caracteres'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim())) {
    nextErrors.slug = 'Usa minúsculas, números y guiones'
  }
  if (!values.categoryId) nextErrors.categoryId = 'Selecciona una categoría'

  const price = Number(values.price)
  if (!Number.isFinite(price) || price <= 0) nextErrors.price = 'Debe ser mayor a 0'

  if (values.weight.trim() !== '') {
    const weight = Number(values.weight)
    if (!Number.isFinite(weight) || weight <= 0) nextErrors.weight = 'Debe ser mayor a 0'
  }

  const weeklyStock = Number(values.weeklyStock)
  if (!Number.isFinite(weeklyStock) || weeklyStock < 0) {
    nextErrors.weeklyStock = 'Debe ser 0 o mayor'
  }

  if (values.description.trim().length < 5) nextErrors.description = 'Mínimo 5 caracteres'
  if (values.ingredients.trim().length < 2) nextErrors.ingredients = 'Mínimo 2 caracteres'
  if (!values.imageUrl.trim()) nextErrors.imageUrl = 'La imagen es obligatoria'
  if (!values.imageAlt.trim()) nextErrors.imageAlt = 'El texto alt es obligatorio'

  return nextErrors
}

function buildPayload(form: ProductFormState) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    weight: form.weight.trim() === '' ? null : Number(form.weight),
    ingredients: form.ingredients.trim(),
    allergens: form.allergens
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    riskNote: form.riskNote.trim() === '' ? null : form.riskNote.trim(),
    imageUrl: form.imageUrl.trim(),
    imageAlt: form.imageAlt.trim(),
    stockType: form.stockType,
    weeklyStock: Number(form.weeklyStock),
    allowSlicing: form.allowSlicing,
    isActive: form.isActive,
    published: form.published,
    categoryId: form.categoryId,
    images: form.images
      .map((image) => ({
        url: image.url.trim(),
        altText: image.altText.trim() || form.imageAlt.trim(),
      }))
      .filter((image) => image.url && image.url !== form.imageUrl.trim()),
  }
}

export function useProductAdmin() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<ProductFormErrors>({})
  const [slugTouched, setSlugTouched] = useState(false)

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', description: '' })
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [categorySaving, setCategorySaving] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/productos')
      if (!res.ok) {
        const raw = await res.text()
        let data: { error?: string; details?: string } = {}
        try {
          data = JSON.parse(raw)
        } catch {
          data = {}
        }
        const fallbackDetails = raw
          ? `HTTP ${res.status}: ${raw.replace(/\s+/g, ' ').slice(0, 180)}`
          : `HTTP ${res.status}`
        throw new Error(data.error || data.details || fallbackDetails)
      }
      const data = await res.json()
      setProducts(data.products ?? [])
      setCategories(data.categories ?? [])
    } catch (err) {
      setProducts([])
      setCategories([])
      setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormOpen(false)
    setError(null)
    setFieldErrors({})
    setSlugTouched(false)
  }, [])

  const setFieldValue = useCallback(
    <K extends ProductFormField>(field: K, value: ProductFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      setFieldErrors((prev) => {
        if (!prev[field]) return prev
        const next = { ...prev }
        delete next[field]
        return next
      })
    },
    [],
  )

  const handleNameChange = useCallback(
    (value: string) => {
      const nextSlug = slugify(value)
      if (slugTouched) {
        setForm((prev) => ({ ...prev, name: value }))
        setFieldErrors((prev) => {
          if (!prev.name) return prev
          const next = { ...prev }
          delete next.name
          return next
        })
        return
      }
      setForm((prev) => ({ ...prev, name: value, slug: nextSlug }))
      setFieldErrors((prev) => {
        if (!prev.name && !prev.slug) return prev
        const next = { ...prev }
        delete next.name
        delete next.slug
        return next
      })
    },
    [slugTouched],
  )

  const handleSlugChange = useCallback((value: string) => {
    setSlugTouched(true)
    setForm((prev) => ({ ...prev, slug: slugify(value) }))
    setFieldErrors((prev) => {
      if (!prev.slug) return prev
      const next = { ...prev }
      delete next.slug
      return next
    })
  }, [])

  const handleCreate = useCallback(() => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormOpen(true)
    setError(null)
    setFieldErrors({})
    setSlugTouched(false)
  }, [])

  const handleEdit = useCallback((product: ProductRow) => {
    setForm(mapProductToForm(product))
    setEditingId(product.id)
    setFormOpen(true)
    setError(null)
    setFieldErrors({})
    setSlugTouched(true)
  }, [])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()

      const nextErrors = validateForm(form)
      setFieldErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) {
        setError('Revisa los campos marcados en rojo')
        return
      }

      setSaving(true)
      setError(null)

      try {
        const payload = buildPayload(form)
        const endpoint = editingId
          ? `/api/admin/productos/${editingId}`
          : '/api/admin/productos'
        const method = editingId ? 'PUT' : 'POST'

        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const apiFieldErrors = data?.details?.fieldErrors as
            | Record<string, string[]>
            | undefined
          if (apiFieldErrors) {
            const mapped: ProductFormErrors = {}
            for (const key of Object.keys(apiFieldErrors)) {
              const first = apiFieldErrors[key]?.[0]
              if (first && key in form) {
                mapped[key as ProductFormField] = first
              }
            }
            setFieldErrors(mapped)
          }
          throw new Error(data.error || 'No se pudo guardar el producto')
        }

        resetForm()
        await fetchProducts()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo guardar el producto')
      } finally {
        setSaving(false)
      }
    },
    [form, editingId, resetForm],
  )

  const handleDelete = useCallback(
    async (product: ProductRow) => {
      if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`))
        return
      setDeletingId(product.id)
      try {
        const res = await fetch(`/api/admin/productos/${product.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
        setProducts((prev) => prev.filter((p) => p.id !== product.id))
      } catch {
        setError('No se pudo eliminar el producto')
      } finally {
        setDeletingId(null)
      }
    },
    [],
  )

  const handlePublishToggle = useCallback(
    async (product: ProductRow) => {
      try {
        const res = await fetch(`/api/admin/productos/${product.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published: !product.published }),
        })
        if (!res.ok) throw new Error()
        await fetchProducts()
      } catch {
        setError(`No se pudo ${product.published ? 'despublicar' : 'publicar'} el producto`)
      }
    },
    [],
  )

  const handleExtraImageUpload = useCallback((url: string) => {
    setForm((prev) => {
      const normalizedUrl = url.trim()
      if (!normalizedUrl || normalizedUrl === prev.imageUrl.trim()) return prev
      if (prev.images.some((image) => image.url.trim() === normalizedUrl)) return prev
      return {
        ...prev,
        images: [
          ...prev.images,
          {
            url: normalizedUrl,
            altText: prev.imageAlt.trim() || prev.name.trim(),
          },
        ],
      }
    })
  }, [])

  const handleExtraImageChange = useCallback(
    (index: number, field: 'url' | 'altText', value: string) => {
      setForm((prev) => ({
        ...prev,
        images: prev.images.map((image, imageIndex) =>
          imageIndex === index ? { ...image, [field]: value } : image,
        ),
      }))
    },
    [],
  )

  const handleRemoveExtraImage = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, imageIndex) => imageIndex !== index),
    }))
  }, [])

  const handleMoveExtraImage = useCallback((index: number, direction: -1 | 1) => {
    setForm((prev) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= prev.images.length) return prev
      const nextImages = [...prev.images]
      const [movedImage] = nextImages.splice(index, 1)
      nextImages.splice(nextIndex, 0, movedImage)
      return { ...prev, images: nextImages }
    })
  }, [])

  const handleSetAsPrimaryImage = useCallback((index: number) => {
    setForm((prev) => {
      const selectedImage = prev.images[index]
      if (!selectedImage) return prev
      const currentPrimary = { url: prev.imageUrl, altText: prev.imageAlt }
      return {
        ...prev,
        imageUrl: selectedImage.url,
        imageAlt: selectedImage.altText || prev.imageAlt,
        images: prev.images
          .filter((_, imageIndex) => imageIndex !== index)
          .concat(currentPrimary.url.trim() ? [currentPrimary] : []),
      }
    })
  }, [])

  const handleCreateCategory = useCallback(async () => {
    const name = newCategoryName.trim()
    if (name.length < 2) {
      setError('La categoría debe tener al menos 2 caracteres')
      return
    }
    setCreatingCategory(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la categoría')
      setCategories((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'es')),
      )
      setForm((prev) => ({ ...prev, categoryId: data.id }))
      setNewCategoryName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la categoría')
    } finally {
      setCreatingCategory(false)
    }
  }, [newCategoryName])

  const handleCategorySubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setCategorySaving(true)
      setCategoryError(null)
      try {
        const method = editingCategoryId ? 'PUT' : 'POST'
        const endpoint = editingCategoryId
          ? `/api/admin/categorias/${editingCategoryId}`
          : '/api/admin/categorias'
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryForm.name, description: categoryForm.description }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'No se pudo guardar la categoría')
        if (editingCategoryId) {
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategoryId ? data : c)),
          )
        } else {
          setCategories((prev) =>
            [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'es')),
          )
        }
        setCategoryForm({ id: '', name: '', description: '' })
        setEditingCategoryId(null)
      } catch (err) {
        setCategoryError(err instanceof Error ? err.message : 'No se pudo guardar la categoría')
      } finally {
        setCategorySaving(false)
      }
    },
    [editingCategoryId, categoryForm],
  )

  const handleDeleteCategory = useCallback(
    async (cat: CategoryOption) => {
      if (!window.confirm(`¿Eliminar la categoría "${cat.name}"?`)) return
      setCategorySaving(true)
      try {
        const res = await fetch(`/api/admin/categorias/${cat.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('No se pudo eliminar')
        setCategories((prev) => prev.filter((c) => c.id !== cat.id))
        if (editingCategoryId === cat.id) {
          setEditingCategoryId(null)
          setCategoryForm({ id: '', name: '', description: '' })
        }
      } catch {
        setCategoryError('Error al eliminar la categoría')
      } finally {
        setCategorySaving(false)
      }
    },
    [editingCategoryId],
  )

  const inputClass = useCallback(
    (field: ProductFormField) =>
      cn(
        'px-3 py-2 rounded-lg border text-sm bg-gray-900 text-white',
        fieldErrors[field]
          ? 'border-red-800 bg-red-900/30 text-red-300 placeholder:text-red-400'
          : 'border-gray-700',
      ),
    [fieldErrors],
  )

  return {
    products,
    categories,
    loading,
    error,
    saving,
    deletingId,
    fetchProducts,
    setError,

    formOpen,
    setFormOpen,
    editingId,
    form,
    setForm,
    fieldErrors,
    setFieldValue,
    handleCreate,
    handleEdit,
    handleSubmit,
    handleDelete,
    handlePublishToggle,
    resetForm,
    handleNameChange,
    handleSlugChange,
    inputClass,

    handleExtraImageUpload,
    handleExtraImageChange,
    handleRemoveExtraImage,
    handleMoveExtraImage,
    handleSetAsPrimaryImage,

    newCategoryName,
    setNewCategoryName,
    creatingCategory,
    handleCreateCategory,

    categoryModalOpen,
    setCategoryModalOpen,
    categoryForm,
    setCategoryForm,
    categoryError,
    categorySaving,
    editingCategoryId,
    setEditingCategoryId,
    handleCategorySubmit,
    handleDeleteCategory,
  }
}
