'use client'

import { useCallback } from 'react'
import { RefreshCw, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProductAdmin } from '@/hooks/use-product-admin'
import { useImageUpload } from '@/hooks/use-image-upload'
import ProductList from '@/components/admin/product-list'
import ProductForm from '@/components/admin/product-form'
import CategoryManager from '@/components/admin/category-manager'

export default function AdminProductosPage() {
  const admin = useProductAdmin()
  const imageUpload = useImageUpload()

  const handleImageFileSelect = useCallback(
    async (file: File) => {
      admin.setError(null)
      admin.setFieldValue('imageUrl', '')
      const uploadResult = await imageUpload.handleImageSelected(file)
      if ('url' in uploadResult) {
        admin.setFieldValue('imageUrl', uploadResult.url)
        const currentForm = admin.form
        if (!currentForm.imageAlt.trim() && currentForm.name.trim()) {
          admin.setFieldValue('imageAlt', currentForm.name.trim())
        }
      } else {
        admin.setError(uploadResult.error)
      }
    },
    [admin, imageUpload],
  )

  const handleResetForm = useCallback(() => {
    imageUpload.clearPreview()
    admin.resetForm()
  }, [admin, imageUpload])

  const handleCreate = useCallback(() => {
    imageUpload.clearPreview()
    admin.handleCreate()
  }, [admin, imageUpload])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Productos</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {admin.products.length} productos en catálogo
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-brand-gold rounded-lg hover:bg-brand-gold-dark"
          >
            <Plus className="w-4 h-4" />
            Nuevo producto
          </button>
          <button
            onClick={() => admin.setCategoryModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nueva categoría
          </button>
          <button
            onClick={admin.fetchProducts}
            disabled={admin.loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-white border border-gray-700 rounded-lg hover:bg-gray-700"
          >
            <RefreshCw className={cn('w-4 h-4', admin.loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <CategoryManager
        open={admin.categoryModalOpen}
        categories={admin.categories}
        categoryForm={admin.categoryForm}
        editingCategoryId={admin.editingCategoryId}
        saving={admin.categorySaving}
        error={admin.categoryError}
        onClose={() => admin.setCategoryModalOpen(false)}
        onCategoryFormChange={admin.setCategoryForm}
        onStartEdit={(cat) => {
          admin.setEditingCategoryId(cat.id)
          admin.setCategoryForm({ id: cat.id, name: cat.name, description: cat.description || '' })
        }}
        onCancelEdit={() => {
          admin.setEditingCategoryId(null)
          admin.setCategoryForm({ id: '', name: '', description: '' })
        }}
        onSubmit={admin.handleCategorySubmit}
        onDelete={admin.handleDeleteCategory}
      />

      {admin.formOpen && (
        <ProductForm
          editingId={admin.editingId}
          form={admin.form}
          fieldErrors={admin.fieldErrors}
          categories={admin.categories}
          saving={admin.saving}
          uploadingImage={imageUpload.uploadingImage}
          creatingCategory={admin.creatingCategory}
          error={admin.error}
          fileInputRef={imageUpload.fileInputRef}
          localPreviewUrl={imageUpload.localPreviewUrl}
          newCategoryName={admin.newCategoryName}
          onFieldChange={admin.setFieldValue}
          onFormChange={admin.setForm}
          onNameChange={admin.handleNameChange}
          onSlugChange={admin.handleSlugChange}
          onSubmit={admin.handleSubmit}
          onReset={handleResetForm}
          onImageFileSelect={handleImageFileSelect}
          onExtraImageUpload={admin.handleExtraImageUpload}
          onExtraImageChange={admin.handleExtraImageChange}
          onRemoveExtraImage={admin.handleRemoveExtraImage}
          onMoveExtraImage={admin.handleMoveExtraImage}
          onSetAsPrimaryImage={admin.handleSetAsPrimaryImage}
          onNewCategoryNameChange={admin.setNewCategoryName}
          onCreateCategory={admin.handleCreateCategory}
          inputClass={admin.inputClass}
        />
      )}

      {!admin.formOpen && admin.error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
          {admin.error}
        </div>
      )}

      <ProductList
        products={admin.products}
        loading={admin.loading}
        error={admin.error}
        deletingId={admin.deletingId}
        onEdit={admin.handleEdit}
        onDelete={admin.handleDelete}
        onPublishToggle={admin.handlePublishToggle}
      />
    </div>
  )
}
