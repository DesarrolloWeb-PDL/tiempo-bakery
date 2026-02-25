import { prisma } from '../lib/db'

async function main() {
  const productos = await prisma.product.findMany({
    where: {
      imageUrl: {
        not: '',
      },
    },
  })

  let count = 0
  for (const prod of productos) {
    if (
      prod.imageUrl &&
      !prod.imageUrl.startsWith('http') &&
      !prod.imageUrl.includes('cloudinary.com')
    ) {
      console.log(`Producto con imagen local: ${prod.name} (${prod.id}) -> ${prod.imageUrl}`)
      await prisma.product.update({
        where: { id: prod.id },
        data: { imageUrl: '' }, // Borra la URL para que se suba una nueva
      })
      count++
    }
  }
  console.log(`Corrigidos ${count} productos con imagen local.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
