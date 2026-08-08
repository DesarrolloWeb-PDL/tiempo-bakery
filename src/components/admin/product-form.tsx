'use client'

import { FormEvent, RefObject } from 'react'
import { ArrowUp, ArrowDown, Trash2, Star, Save, X } from 'lucide-react'
import { normalizePublicAssetUrl } from '@/lib/url-normalizer'
import { cn } from '@/lib/utils'
import ImagenUploadAdmin from '@/components/productos/imagen-upload-admin'
import {
  ProductFormField,
  ProductFormState,
  ProductFormErrors,
  CategoryOption,
} from '@/hooks/use-product-admin'

interface ProductFormProps {
  editingId: string | null
  form: ProductFormState
  fieldErrors: ProductFormErrors
  categories: CategoryOption[]
  saving: boolean
  uploadingImage: boolean
  creatingCategory: boolean
  error: string | null
  fileInputRef: RefObject<HTMLInputElement>
  localPreviewUrl: string | null
  newCategoryName: string
  onFieldChange: <K extends ProductFormField>(field: K, value: ProductFormState[K]) => void
  onFormChange: (updater: (prev: ProductFormState) => ProductFormState) => void
  onNameChange: (value: string) => void
  onSlugChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
  onReset: () => void
  onImageFileSelect: (file: File) => void
  onExtraImageUpload: (url: string) => void
  onExtraImageChange: (index: number, field: 'url' | 'altText', value: string) => void
  onRemoveExtraImage: (index: number) => void
  onMoveExtraImage: (index: number, direction: -1 | 1) => void
  onSetAsPrimaryImage: (index: number) => void
  onNewCategoryNameChange: (name: string) => void
  onCreateCategory: () => void
  inputClass: (field: ProductFormField) => string
}

export default function ProductForm({
  editingId,
  form,
  fieldErrors,
  categories,
  saving,
  uploadingImage,
  creatingCategory,
  error,
  fileInputRef,
  localPreviewUrl,
  newCategoryName,
  onFieldChange,
  onFormChange,
  onNameChange,
  onSlugChange,
  onSubmit,
  onReset,
  onImageFileSelect,
  onExtraImageUpload,
  onExtraImageChange,
  onRemoveExtraImage,
  onMoveExtraImage,
  onSetAsPrimaryImage,
  onNewCategoryNameChange,
  onCreateCategory,
  inputClass,
}: ProductFormProps) {
  return (
    <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {editingId ? 'Editar producto' : 'Crear producto'}
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="p-1.5 text-gray-400 hover:bg-gray-700 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <input
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nombre"
            className={inputClass('name')}
            required
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
          )}
        </div>
        <div>
          <input
            value={form.slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="Slug"
            className={inputClass('slug')}
            required
          />
          {fieldErrors.slug && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.slug}</p>
          )}
        </div>
        <div>
          <select
            value={form.categoryId}
            onChange={(e) => onFieldChange('categoryId', e.target.value)}
            className={inputClass('categoryId')}
            required
          >
            <option value="">Categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldErrors.categoryId && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.categoryId}</p>
          )}
        </div>

        <div>
          <input
            value={form.price}
            onChange={(e) => onFieldChange('price', e.target.value)}
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio (AR$)"
            className={inputClass('price')}
            required
          />
          {fieldErrors.price && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.price}</p>
          )}
        </div>
        <div>
          <input
            value={form.weight}
            onChange={(e) => onFieldChange('weight', e.target.value)}
            type="number"
            min="0"
            placeholder="Peso (g)"
            className={inputClass('weight')}
          />
          {fieldErrors.weight && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.weight}</p>
          )}
        </div>
        <div>
          <input
            value={form.weeklyStock}
            onChange={(e) => onFieldChange('weeklyStock', e.target.value)}
            type="number"
            min="0"
            placeholder="Stock semanal"
            className={inputClass('weeklyStock')}
            required
          />
          {fieldErrors.weeklyStock && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.weeklyStock}</p>
          )}
        </div>

        <div className="md:col-span-2 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.currentTarget.value = ''
              if (file) {
                void onImageFileSelect(file)
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-3 py-2 text-sm font-medium text-white hover:bg-brand-gold-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploadingImage ? 'Subiendo portada...' : 'Subir portada'}
          </button>
          <input
            value={form.imageUrl}
            onChange={(e) => onFieldChange('imageUrl', e.target.value)}
            placeholder="URL imagen"
            className={cn(inputClass('imageUrl'), 'w-full')}
            required
          />
          {fieldErrors.imageUrl && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.imageUrl}</p>
          )}
        </div>
        <div>
          <input
            value={form.imageAlt}
            onChange={(e) => onFieldChange('imageAlt', e.target.value)}
            placeholder="Alt imagen"
            className={inputClass('imageAlt')}
            required
          />
          {fieldErrors.imageAlt && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.imageAlt}</p>
          )}
        </div>

        <div className="md:col-span-3">
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Acepta JPG, PNG o WEBP (máx. 5MB)</p>

            {(localPreviewUrl || form.imageUrl) && (
              <div className="p-3 bg-gray-700 rounded-lg border border-gray-700 flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localPreviewUrl ?? normalizePublicAssetUrl(form.imageUrl)}
                  alt={form.imageAlt || 'Preview'}
                  className="h-28 w-28 object-cover rounded-lg border border-gray-700 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="text-xs text-gray-400 space-y-1">
                  <p className="text-brand-gold-dark font-semibold">Portada actual</p>
                  {localPreviewUrl && !form.imageUrl && (
                    <p className="text-brand-gold font-medium">
                      Vista previa local — subiendo al servidor…
                    </p>
                  )}
                  {form.imageUrl && (
                    <p className="text-green-400 font-medium">Imagen guardada en servidor</p>
                  )}
                  {form.imageUrl && (
                    <p className="break-all text-gray-400">{form.imageUrl}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-3 rounded-xl border border-gray-700 bg-gray-700 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Banco de imágenes extra</p>
              <p className="text-xs text-gray-400">
                La portada sigue siendo la imagen principal. Acá sumás fotos secundarias para la
                ficha del producto.
              </p>
            </div>
            <ImagenUploadAdmin onUpload={onExtraImageUpload} />
          </div>

          {form.images.length === 0 ? (
            <p className="text-sm text-gray-400">Todavía no cargaste imágenes extra.</p>
          ) : (
            <div className="space-y-3">
              {form.images.map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  className="grid grid-cols-1 md:grid-cols-[112px,1fr,auto] gap-3 rounded-lg border border-gray-700 bg-gray-800 p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={normalizePublicAssetUrl(image.url) || '/img/espiga.png'}
                    alt={image.altText || `Imagen extra ${index + 1}`}
                    className="h-24 w-24 rounded-lg border border-gray-700 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-gray-400">
                        Orden {index + 2}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSetAsPrimaryImage(index)}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-gold/10 px-2 py-1 text-xs font-medium text-brand-gold-dark hover:bg-brand-gold/20"
                      >
                        <Star className="w-3 h-3" />
                        Usar como portada
                      </button>
                    </div>
                    <input
                      value={image.url}
                      onChange={(e) => onExtraImageChange(index, 'url', e.target.value)}
                      placeholder="URL imagen extra"
                      className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
                    />
                    <input
                      value={image.altText}
                      onChange={(e) => onExtraImageChange(index, 'altText', e.target.value)}
                      placeholder="Alt imagen extra"
                      className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
                    />
                  </div>
                  <div className="flex items-start justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onMoveExtraImage(index, -1)}
                      disabled={index === 0}
                      className="p-2 text-gray-300 hover:bg-gray-700 rounded-lg disabled:opacity-40"
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveExtraImage(index, 1)}
                      disabled={index === form.images.length - 1}
                      className="p-2 text-gray-300 hover:bg-gray-700 rounded-lg disabled:opacity-40"
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveExtraImage(index)}
                      className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg"
                      title="Quitar imagen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <textarea
          value={form.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="Descripción"
          className={cn(inputClass('description'), 'w-full min-h-20')}
          required
        />
        {fieldErrors.description && (
          <p className="mt-1 text-xs text-red-400">{fieldErrors.description}</p>
        )}
      </div>
      <div>
        <textarea
          value={form.ingredients}
          onChange={(e) => onFieldChange('ingredients', e.target.value)}
          placeholder="Ingredientes"
          className={cn(inputClass('ingredients'), 'w-full min-h-16')}
          required
        />
        {fieldErrors.ingredients && (
          <p className="mt-1 text-xs text-red-400">{fieldErrors.ingredients}</p>
        )}
      </div>
      <input
        value={form.allergens}
        onChange={(e) => onFieldChange('allergens', e.target.value)}
        placeholder="Alérgenos (separados por coma)"
        className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
      />
      <input
        value={form.riskNote}
        onChange={(e) => onFieldChange('riskNote', e.target.value)}
        placeholder="Nota de riesgo (opcional)"
        className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select
          value={form.stockType}
          onChange={(e) =>
            onFormChange((f) => ({
              ...f,
              stockType: e.target.value as 'WEEKLY' | 'UNLIMITED',
            }))
          }
          className="px-3 py-2 rounded-lg border border-gray-700 text-sm"
        >
          <option value="WEEKLY">Stock semanal</option>
          <option value="UNLIMITED">Stock ilimitado</option>
        </select>
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.allowSlicing}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, allowSlicing: e.target.checked }))
              }
            />
            Permitir rebanado
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, isActive: e.target.checked }))
              }
            />
            Activo
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, published: e.target.checked }))
              }
            />
            Publicado
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input
          value={newCategoryName}
          onChange={(e) => onNewCategoryNameChange(e.target.value)}
          placeholder="Nueva categoría rápida"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
        />
        <button
          type="button"
          onClick={onCreateCategory}
          disabled={creatingCategory || newCategoryName.trim().length < 2}
          className="px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {creatingCategory ? 'Creando...' : 'Crear'}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-2 text-sm border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || uploadingImage || creatingCategory}
          className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-brand-gold rounded-lg hover:bg-brand-gold-dark disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}
