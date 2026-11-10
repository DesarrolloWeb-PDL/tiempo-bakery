'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'

type Recipe = {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  ingredients: string | null
  coverImage: string | null
  difficulty: string | null
  prepTime: number | null
  isTip: boolean
  published: boolean
  order: number
}

const emptyForm = {
  title: '',
  summary: '',
  content: '',
  ingredients: '',
  difficulty: '',
  prepTime: '',
  coverImage: '',
  isTip: false,
  published: false,
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border text-sm bg-gray-900 text-white placeholder:text-gray-400'

const inputOk = 'border-gray-600 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30'

const btnPrimary =
  'flex items-center gap-2 px-3 py-2 text-sm text-white bg-brand-gold rounded-lg hover:bg-brand-gold-dark'

const btnSecondary =
  'text-gray-300 bg-white border border-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-700'

export default function AdminRecetasPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/recetas')
      if (!res.ok) throw new Error('No se pudieron cargar las recetas')
      const data = await res.json()
      setRecipes(data.recipes ?? [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(recipe: Recipe) {
    setEditing(recipe)
    setForm({
      title: recipe.title,
      summary: recipe.summary,
      content: recipe.content,
      ingredients: recipe.ingredients ?? '',
      difficulty: recipe.difficulty ?? '',
      prepTime: recipe.prepTime != null ? String(recipe.prepTime) : '',
      coverImage: recipe.coverImage ?? '',
      isTip: recipe.isTip,
      published: recipe.published,
    })
    setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title,
        summary: form.summary,
        content: form.content,
        ingredients: form.ingredients.trim() || null,
        difficulty: form.difficulty.trim() || null,
        prepTime: form.prepTime ? Number(form.prepTime) : null,
        coverImage: form.coverImage.trim() || null,
        isTip: form.isTip,
        published: form.published,
        ...(editing
          ? { slug: editing.slug, order: editing.order }
          : {}),
      }

      const res = await fetch(
        editing ? `/api/admin/recetas/${editing.id}` : '/api/admin/recetas',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'No se pudo guardar')

      setShowForm(false)
      setEditing(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function remove(recipe: Recipe) {
    if (!confirm(`¿Eliminar "${recipe.title}"?`)) return
    try {
      const res = await fetch(`/api/admin/recetas/${recipe.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--brand-text-primary)' }}>
            Recetas y Tips
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            Contenido público en <span className="font-semibold">/recetas</span>
          </p>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus className="w-4 h-4" />
          Nueva receta
        </button>
      </div>

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={save}
          className="mt-6 border border-gray-700 bg-gray-800 rounded-xl p-4 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold" style={{ color: 'var(--brand-text-primary)' }}>
              {editing ? 'Editar receta' : 'Nueva receta'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase text-gray-400">Título</span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={`${inputClass} ${inputOk}`}
                placeholder="Pan de masa madre integral"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase text-gray-400">Dificultad</span>
              <input
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className={`${inputClass} ${inputOk}`}
                placeholder="Fácil / Media / Difícil"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase text-gray-400">Tiempo (min)</span>
              <input
                type="number"
                min={1}
                value={form.prepTime}
                onChange={(e) => setForm({ ...form, prepTime: e.target.value })}
                className={`${inputClass} ${inputOk}`}
                placeholder="180"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase text-gray-400">Imagen (URL)</span>
              <input
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                className={`${inputClass} ${inputOk}`}
                placeholder="https://..."
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase text-gray-400">Resumen</span>
            <input
              required
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className={`${inputClass} ${inputOk}`}
              placeholder="Una línea que resuma el resultado"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase text-gray-400">
              Ingredientes (uno por línea)
            </span>
            <textarea
              value={form.ingredients}
              onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              rows={4}
              className={`${inputClass} ${inputOk}`}
              placeholder={'500 g de harina\n350 g de agua\n100 g de masa madre'}
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase text-gray-400">Preparación</span>
            <textarea
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={10}
              className={`${inputClass} ${inputOk}`}
              placeholder={'1. Mezclar harina y agua.\n2. Agregar la masa madre.\n3. Reposar 4 horas.'}
            />
          </label>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.isTip}
                onChange={(e) => setForm({ ...form, isTip: e.target.checked })}
                className="h-4 w-4 accent-brand-gold"
              />
              Es un tip (consejo) y no una receta
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="h-4 w-4 accent-brand-gold"
              />
              Publicado (visible en /recetas)
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear receta'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={btnSecondary}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-gray-400">Cargando…</p>}

        {!loading && recipes.length === 0 && (
          <p className="text-sm text-gray-400">Todavía no hay recetas cargadas.</p>
        )}

        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-wrap items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold" style={{ color: 'var(--brand-text-primary)' }}>
                  {recipe.title}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    recipe.isTip
                      ? 'bg-[#2C2C2C] text-brand-gold border border-gray-600'
                      : 'bg-brand-gold text-[#2C2C2C]'
                  }`}
                >
                  {recipe.isTip ? 'Tip' : 'Receta'}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium border ${
                    recipe.published
                      ? 'bg-green-900/40 border-green-700 text-green-300'
                      : 'bg-gray-700 border-gray-600 text-gray-300'
                  }`}
                >
                  {recipe.published ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">{recipe.summary}</p>
              <p className="text-xs text-gray-500 mt-1">/recetas/{recipe.slug}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEdit(recipe)}
                className="p-1.5 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700"
                aria-label={`Editar ${recipe.title}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => remove(recipe)}
                className="p-1.5 text-red-400 border border-red-900 rounded-lg hover:bg-red-900/30"
                aria-label={`Eliminar ${recipe.title}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}