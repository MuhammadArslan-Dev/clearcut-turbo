import { promises as fs } from 'fs'
import path from 'path'

export type Product = {
  id: string
  name: string
  price: number
  category: string
}

function getDataFilePath() {
  // Works in both dev and prod where CWD is project root
  return path.join(process.cwd(), 'src', 'data', 'products.json')
}

export async function getCourses(): Promise<Product[]> {
  const file = getDataFilePath()
  try {
    const raw = await fs.readFile(file, 'utf8')
    const data = JSON.parse(raw) as Product[]
    return Array.isArray(data) ? data : []
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException
    if (e && e.code === 'ENOENT') return []
    throw err
  }
}

export async function addProduct(input: Product): Promise<Product> {
  // Minimal validation for Option B schema
  if (!input?.id || !input?.name || typeof input.price !== 'number' || !input?.category) {
    throw new Error('Invalid product payload')
  }
  const file = getDataFilePath()
  const list = await getProducts()
  if (list.some(p => p.id === input.id)) {
    throw new Error('Product with this id already exists')
  }
  const updated = [input, ...list]
  await fs.writeFile(file, JSON.stringify(updated, null, 2) + '\n', 'utf8')
  return input
}
