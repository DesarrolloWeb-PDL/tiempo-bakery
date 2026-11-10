import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Recetas y Tips de Masa Madre | Tiempo Masa Madre',
  description:
    'Recetas, tips y consejos para elaborar productos con masa madre: hidratación, horneado, conservación y más.',
}

export const dynamic = 'force-dynamic'

async function getRecipes() {
  try {
    return await prisma.recipe.findMany({
      where: { published: true },
      orderBy: [{ isTip: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        difficulty: true,
        prepTime: true,
        isTip: true,
      },
    })
  } catch {
    return []
  }
}

export default async function RecetasPage() {
  const recipes = await getRecipes()
  const tips = recipes.filter((r) => r.isTip)
  const recetas = recipes.filter((r) => !r.isTip)

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-brand-gold-dark">
          Recetas y Tips
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Elaborados con masa madre: recetas paso a paso y consejos para tu pan de casa.
        </p>
      </header>

      {recipes.length === 0 ? (
        <div className="border border-brand-gold/20 bg-white p-10 text-center">
          <p className="text-gray-600">
            Estamos preparando el material. ¡Volvé pronto!
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {recetas.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-brand-gold-dark border-b border-brand-gold/20 pb-2 mb-6">
                Recetas
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {recetas.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    accentClass="bg-brand-gold text-[#2C2C2C]"
                  />
                ))}
              </div>
            </section>
          )}

          {tips.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-brand-gold-dark border-b border-brand-gold/20 pb-2 mb-6">
                Tips
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {tips.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    accentClass="bg-[#2C2C2C] text-brand-gold"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  )
}

function RecipeCard({
  recipe,
  accentClass,
}: {
  recipe: {
    id: string
    title: string
    slug: string
    summary: string
    difficulty: string | null
    prepTime: number | null
    isTip: boolean
  }
  accentClass: string
}) {
  return (
    <article className="group border border-brand-gold/20 bg-white overflow-hidden transition-colors hover:border-brand-gold">
      <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wide ${accentClass}`}>
        {recipe.isTip ? 'Tip' : 'Receta'}
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-brand-gold-dark">{recipe.title}</h3>
        <p className="mt-2 text-sm text-gray-600">{recipe.summary}</p>

        {(recipe.difficulty || recipe.prepTime) && (
          <p className="mt-3 text-xs font-semibold text-gray-500 uppercase">
            {recipe.difficulty && <span>{recipe.difficulty}</span>}
            {recipe.difficulty && recipe.prepTime && <span> · </span>}
            {recipe.prepTime && <span>{recipe.prepTime} min</span>}
          </p>
        )}

        <Link
          href={`/recetas/${recipe.slug}`}
          className="mt-4 inline-block border border-[#2C2C2C] bg-brand-gold px-4 py-2 text-sm font-bold uppercase text-[#2C2C2C] transition-colors hover:bg-brand-gold-dark hover:text-white"
        >
          Ver receta
        </Link>
      </div>
    </article>
  )
}