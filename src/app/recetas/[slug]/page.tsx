import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getRecipe(slug: string) {
  try {
    return await prisma.recipe.findFirst({
      where: { slug, published: true },
      select: {
        title: true,
        summary: true,
        content: true,
        ingredients: true,
        difficulty: true,
        prepTime: true,
        isTip: true,
      },
    })
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const recipe = await getRecipe(params.slug)
  if (!recipe) return { title: 'Receta no encontrada | Tiempo Masa Madre' }
  return {
    title: `${recipe.title} | Recetas Tiempo Masa Madre`,
    description: recipe.summary,
  }
}

export default async function RecetaPage({ params }: { params: { slug: string } }) {
  const recipe = await getRecipe(params.slug)
  if (!recipe) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/recetas"
        className="inline-block border border-[#2C2C2C] bg-white px-3 py-1.5 text-xs font-bold uppercase transition-colors hover:bg-brand-gold"
      >
        ← Volver a recetas
      </Link>

      <header className="mt-6 border border-brand-gold/20 bg-white p-6 md:p-8">
        <p
          className={`inline-block px-3 py-1 text-xs font-bold uppercase ${
            recipe.isTip
              ? 'bg-[#2C2C2C] text-brand-gold'
              : 'bg-brand-gold text-[#2C2C2C]'
          }`}
        >
          {recipe.isTip ? 'Tip' : 'Receta'}
        </p>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold text-brand-gold-dark">
          {recipe.title}
        </h1>
        <p className="mt-3 text-gray-600">{recipe.summary}</p>

        {(recipe.difficulty || recipe.prepTime) && (
          <p className="mt-4 text-xs font-bold uppercase text-gray-500">
            {recipe.difficulty && <span>{recipe.difficulty}</span>}
            {recipe.difficulty && recipe.prepTime && <span> · </span>}
            {recipe.prepTime && <span>{recipe.prepTime} min</span>}
          </p>
        )}
      </header>

      {recipe.ingredients && (
        <section className="mt-6 border border-brand-gold/20 bg-white p-6 md:p-8">
          <h2 className="text-xl font-bold text-brand-gold-dark border-b border-brand-gold/20 pb-2">
            Ingredientes
          </h2>
          <p className="mt-4 whitespace-pre-line text-gray-700">{recipe.ingredients}</p>
        </section>
      )}

      <section className="mt-6 border border-brand-gold/20 bg-white p-6 md:p-8">
        <h2 className="text-xl font-bold text-brand-gold-dark border-b border-brand-gold/20 pb-2">
          Preparación
        </h2>
        <p className="mt-4 whitespace-pre-line text-gray-700">{recipe.content}</p>
      </section>
    </main>
  )
}