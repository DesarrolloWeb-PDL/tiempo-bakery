'use client'

import { FormEvent } from 'react'
import { X } from 'lucide-react'
import { CategoryOption } from '@/hooks/use-product-admin'

interface CategoryManagerProps {
  open: boolean
  categories: CategoryOption[]
  categoryForm: { id: string; name: string; description: string }
  editingCategoryId: string | null
  saving: boolean
  error: string | null
  onClose: () => void
  onCategoryFormChange: (form: { id: string; name: string; description: string }) => void
  onStartEdit: (category: CategoryOption) => void
  onCancelEdit: () => void
  onSubmit: (e: FormEvent) => void
  onDelete: (category: CategoryOption) => void
}

export default function CategoryManager({
  open,
  categories,
  categoryForm,
  editingCategoryId,
  saving,
  error,
  onClose,
  onCategoryFormChange,
  onStartEdit,
  onCancelEdit,
  onSubmit,
  onDelete,
}: CategoryManagerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md space-y-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Gestión de categorías</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <span className="font-medium text-white flex-1">{cat.name}</span>
              <button
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                onClick={() => onStartEdit(cat)}
              >
                Editar
              </button>
              <button
                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                onClick={() => void onDelete(cat)}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-3 mt-4">
          <div>
            <input
              value={categoryForm.name}
              onChange={(e) => onCategoryFormChange({ ...categoryForm, name: e.target.value })}
              placeholder="Nombre de la categoría"
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
              required
            />
          </div>
          <div>
            <textarea
              value={categoryForm.description}
              onChange={(e) =>
                onCategoryFormChange({ ...categoryForm, description: e.target.value })
              }
              placeholder="Descripción (opcional)"
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3 py-2 text-sm border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {saving
                ? 'Guardando...'
                : editingCategoryId
                  ? 'Guardar cambios'
                  : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
