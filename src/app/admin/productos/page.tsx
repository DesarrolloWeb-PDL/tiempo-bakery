'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { BarChart2, RefreshCw, Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductRow {
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
  category: { id: string; name: string }
  _count: { orderItems: number }
}

interface CategoryOption {
  id: string
  name: string
}

interface ProductFormState {
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
}

type ProductFormField = keyof ProductFormState
type ProductFormErrors = Partial<Record<ProductFormField, string>>

const EMPTY_FORM: ProductFormState = {
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
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', description: '' })
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [categorySaving, setCategorySaving] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ProductFormErrors>({})
  const [slugTouched, setSlugTouched] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  const resetForm = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl)
      setLocalPreviewUrl(null)
    }
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormOpen(false)
    setError(null)
    setFieldErrors({})
    setSlugTouched(false)
  }

  const setFieldValue = <K extends ProductFormField>(field: K, value: ProductFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateForm = (values: ProductFormState): ProductFormErrors => {
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

  const inputClass = (field: ProductFormField) =>
    cn(
      'px-3 py-2 rounded-lg border text-sm',
      fieldErrors[field]
        ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-400'
        : 'border-gray-200'
    )

  const mapProductToForm = (product: ProductRow): ProductFormState => ({
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
  })

  const handleCreate = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormOpen(true)
    setError(null)
    setFieldErrors({})
    setSlugTouched(false)
  }

  const handleEdit = (product: ProductRow) => {
    setForm(mapProductToForm(product))
    setEditingId(product.id)
    setFormOpen(true)
    setError(null)
    setFieldErrors({})
    setSlugTouched(true)
  }

  const handleNameChange = (value: string) => {
    const nextSlug = slugify(value)
    if (slugTouched) {
      setFieldValue('name', value)
      return
    }

    setForm((prev) => ({
      ...prev,
      name: value,
      slug: nextSlug,
    }))

    if (fieldErrors.name || fieldErrors.slug) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.name
        delete next.slug
        return next
      })
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugTouched(true)
    setFieldValue('slug', slugify(value))
  }

  const handleCreateCategory = async () => {
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
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear la categoría')
      }

      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'es')))
      setFieldValue('categoryId', data.id)
      setNewCategoryName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la categoría')
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleImageSelected = async (file: File) => {
    // Validar localmente antes de cualquier cosa
    const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (!ALLOWED_MIME.has(file.type)) {
      setError(`Formato no soportado: ${file.type}. Usa JPG, PNG o WEBP`)
      return
    }
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setError(`La imagen supera 5MB (tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      return
    }

    // Mostrar preview local inmediatamente (antes de subir al servidor)
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    const blobUrl = URL.createObjectURL(file)
    setLocalPreviewUrl(blobUrl)
    setFieldValue('imageUrl', '')

    setUploadingImage(true)
    setError(null)

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

      // Upload exitoso: reemplazar blob local por URL del servidor
      URL.revokeObjectURL(blobUrl)
      setLocalPreviewUrl(null)
      setFieldValue('imageUrl', data.url)
      if (!form.imageAlt.trim() && form.name.trim()) {
        setFieldValue('imageAlt', form.name.trim())
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'No se pudo subir la imagen'
      setError(errorMsg)
      // Mantener el preview local aunque haya fallado el servidor
    } finally {
      setUploadingImage(false)
    }
  }

  const buildPayload = () => ({
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
  })

  const handleSubmit = async (e: FormEvent) => {
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
      const payload = buildPayload()
      const endpoint = editingId ? `/api/admin/productos/${editingId}` : '/api/admin/productos'
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
  }

  const handleDelete = async (product: ProductRow) => {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return

    try {
      const res = await fetch(`/api/admin/productos/${product.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await fetchProducts()
    } catch {
      setError('No se pudo eliminar el producto')
    }
  }

  const handlePublishToggle = async (product: ProductRow) => {
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
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Productos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} productos en catálogo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo producto
          </button>
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nueva categoría
          </button>
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>
      {/* Modal para crear/editar/eliminar categoría */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Gestión de categorías</h3>
              <button type="button" onClick={() => setCategoryModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Listado de categorías */}
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 flex-1">{cat.name}</span>
                  <button
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                    onClick={() => {
                      setEditingCategoryId(cat.id);
                      setCategoryForm({ id: cat.id, name: cat.name, description: cat.description || '' });
                    }}
                  >Editar</button>
                  <button
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                    onClick={async () => {
                      if (!window.confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
                      setCategorySaving(true);
                      try {
                        const res = await fetch(`/api/admin/categorias/${cat.id}`, { method: 'DELETE' });
                        if (!res.ok) throw new Error('No se pudo eliminar');
                        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
                        if (editingCategoryId === cat.id) {
                          setEditingCategoryId(null);
                          setCategoryForm({ id: '', name: '', description: '' });
                        }
                      } catch (err) {
                        setCategoryError('Error al eliminar la categoría');
                      } finally {
                        setCategorySaving(false);
                      }
                    }}
                  >Eliminar</button>
                </div>
              ))}
            </div>
            {/* Formulario de crear/editar */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setCategorySaving(true);
                setCategoryError(null);
                try {
                  const method = editingCategoryId ? 'PUT' : 'POST';
                  const endpoint = editingCategoryId ? `/api/admin/categorias/${editingCategoryId}` : '/api/admin/categorias';
                  const res = await fetch(endpoint, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: categoryForm.name, description: categoryForm.description }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(data.error || 'No se pudo guardar la categoría');
                  if (editingCategoryId) {
                    setCategories((prev) => prev.map((c) => c.id === editingCategoryId ? data : c));
                  } else {
                    setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'es')));
                  }
                  setCategoryForm({ id: '', name: '', description: '' });
                  setEditingCategoryId(null);
                } catch (err) {
                  setCategoryError(err instanceof Error ? err.message : 'No se pudo guardar la categoría');
                } finally {
                  setCategorySaving(false);
                }
              }}
              className="space-y-3 mt-4"
            >
              <div>
                <input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nombre de la categoría"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  required
                />
              </div>
              <div>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción (opcional)"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  rows={3}
                />
              </div>
              {categoryError && <p className="text-sm text-red-600">{categoryError}</p>}
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => {
                  setCategoryForm({ id: '', name: '', description: '' });
                  setEditingCategoryId(null);
                }} className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={categorySaving} className="px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
                  {categorySaving ? 'Guardando...' : editingCategoryId ? 'Guardar cambios' : 'Crear categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {editingId ? 'Editar producto' : 'Crear producto'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Nombre" className={inputClass('name')} required />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
            </div>
            <div>
              <input value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="Slug" className={inputClass('slug')} required />
              {fieldErrors.slug && <p className="mt-1 text-xs text-red-600">{fieldErrors.slug}</p>}
            </div>
            <div>
              <select value={form.categoryId} onChange={(e) => setFieldValue('categoryId', e.target.value)} className={inputClass('categoryId')} required>
                <option value="">Categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {fieldErrors.categoryId && <p className="mt-1 text-xs text-red-600">{fieldErrors.categoryId}</p>}
            </div>

            <div>
              <input value={form.price} onChange={(e) => setFieldValue('price', e.target.value)} type="number" step="0.01" min="0" placeholder="Precio (AR$)" className={inputClass('price')} required />
              {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>}
            </div>
            <div>
              <input value={form.weight} onChange={(e) => setFieldValue('weight', e.target.value)} type="number" min="0" placeholder="Peso (g)" className={inputClass('weight')} />
              {fieldErrors.weight && <p className="mt-1 text-xs text-red-600">{fieldErrors.weight}</p>}
            </div>
            <div>
              <input value={form.weeklyStock} onChange={(e) => setFieldValue('weeklyStock', e.target.value)} type="number" min="0" placeholder="Stock semanal" className={inputClass('weeklyStock')} required />
              {fieldErrors.weeklyStock && <p className="mt-1 text-xs text-red-600">{fieldErrors.weeklyStock}</p>}
            </div>

            <div className="md:col-span-2">
              <input value={form.imageUrl} onChange={(e) => setFieldValue('imageUrl', e.target.value)} placeholder="URL imagen" className={cn(inputClass('imageUrl'), 'w-full')} required />
              {fieldErrors.imageUrl && <p className="mt-1 text-xs text-red-600">{fieldErrors.imageUrl}</p>}
            </div>
            <div>
              <input value={form.imageAlt} onChange={(e) => setFieldValue('imageAlt', e.target.value)} placeholder="Alt imagen" className={inputClass('imageAlt')} required />
              {fieldErrors.imageAlt && <p className="mt-1 text-xs text-red-600">{fieldErrors.imageAlt}</p>}
            </div>

            {/* Quitar creación de categoría desde el formulario de producto */}

            <div className="md:col-span-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  void handleImageSelected(file)
                  e.currentTarget.value = ''
                }}
              />
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
                  >
                    {uploadingImage ? 'Subiendo...' : (localPreviewUrl || form.imageUrl) ? 'Cambiar imagen' : 'Subir imagen'}
                  </button>
                  {uploadingImage && (
                    <span className="text-xs text-amber-600 animate-pulse">Guardando en servidor…</span>
                  )}
                  {!uploadingImage && form.imageUrl && (
                    <span className="text-xs text-green-600">✓ Guardada</span>
                  )}
                  {!uploadingImage && localPreviewUrl && !form.imageUrl && (
                    <span className="text-xs text-red-500">⚠ Error al subir, reintenta</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Acepta JPG, PNG o WEBP (máx. 5MB)</p>

                {(localPreviewUrl || form.imageUrl) && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start gap-4">
                    <img
                      src={localPreviewUrl ?? form.imageUrl}
                      alt={form.imageAlt || 'Preview'}
                      className="h-28 w-28 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="text-xs text-gray-500 space-y-1">
                      {localPreviewUrl && !form.imageUrl && (
                        <p className="text-amber-600 font-medium">Vista previa local — subiendo al servidor…</p>
                      )}
                      {form.imageUrl && (
                        <p className="text-green-700 font-medium">Imagen guardada en servidor</p>
                      )}
                      {form.imageUrl && (
                        <p className="break-all text-gray-400">{form.imageUrl}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <textarea value={form.description} onChange={(e) => setFieldValue('description', e.target.value)} placeholder="Descripción" className={cn(inputClass('description'), 'w-full min-h-20')} required />
            {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}
          </div>
          <div>
            <textarea value={form.ingredients} onChange={(e) => setFieldValue('ingredients', e.target.value)} placeholder="Ingredientes" className={cn(inputClass('ingredients'), 'w-full min-h-16')} required />
            {fieldErrors.ingredients && <p className="mt-1 text-xs text-red-600">{fieldErrors.ingredients}</p>}
          </div>
          <input value={form.allergens} onChange={(e) => setFieldValue('allergens', e.target.value)} placeholder="Alérgenos (separados por coma)" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          <input value={form.riskNote} onChange={(e) => setFieldValue('riskNote', e.target.value)} placeholder="Nota de riesgo (opcional)" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={form.stockType} onChange={(e) => setForm((f) => ({ ...f, stockType: e.target.value as 'WEEKLY' | 'UNLIMITED' }))} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="WEEKLY">Stock semanal</option>
              <option value="UNLIMITED">Stock ilimitado</option>
            </select>
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.allowSlicing} onChange={(e) => setForm((f) => ({ ...f, allowSlicing: e.target.checked }))} />
                Permitir rebanado
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Activo
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
                Publicado
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving || uploadingImage || creatingCategory} className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-60">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      )}

      {!formOpen && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay productos</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-4">Producto</div>
              <div className="col-span-2">Categoría</div>
              <div className="col-span-2">Precio</div>
              <div className="col-span-2">Stock semanal</div>
              <div className="col-span-1">Pedidos</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>
            <div className="divide-y divide-gray-50">
              {products.map((p) => (
                <div key={p.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-gray-50/50">
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    {/* Imagen actual */}
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = '/img/espiga.png'
                      }}
                    />
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    {/* Subida de imagen solo desde el formulario de edición/creación */}
                  </div>
                  <div className="col-span-2 hidden md:block">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {p.category.name}
                    </span>
                  </div>
                  <div className="col-span-2 hidden md:block">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(p.price)}</span>
                  </div>
                  <div className="col-span-2 hidden md:block">
                    <span className="text-sm text-gray-600">
                      {p.stockType === 'WEEKLY' ? `${p.weeklyStock} ud/semana` : '∞ Ilimitado'}
                    </span>
                  </div>
                  <div className="col-span-1 hidden md:block">
                    <span className="text-sm text-gray-600">{p._count.orderItems}</span>
                  </div>
                  <div className="col-span-1 hidden md:block">
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium',
                      p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="col-span-1 hidden md:flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        void handlePublishToggle(p)
                      }}
                      className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium transition-colors',
                        p.published
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      )}
                      title={p.published ? 'Despublicar' : 'Publicar'}
                    >
                      {p.published ? 'Publicado' : 'Borrador'}
                    </button>
                  </div>
                  <div className="col-span-1 hidden md:flex justify-end gap-1">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
