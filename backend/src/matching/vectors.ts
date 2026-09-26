// Stockage des vecteurs en BLOB SQLite et opérations de base (vecteurs déjà normalisés)
export const toBytes = (vector: Float32Array): Buffer => Buffer.from(vector.slice().buffer)

// Copie obligatoire : le Buffer renvoyé par SQLite n'est pas forcément aligné sur 4 octets
export const fromBytes = (bytes: Uint8Array): Float32Array => new Float32Array(Uint8Array.from(bytes).buffer)

export const cosine = (a: Float32Array, b: Float32Array): number => {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}

export function centroid(vectors: Float32Array[]): Float32Array | undefined {
  if (vectors.length === 0) return undefined
  const sum = new Float32Array(vectors[0].length)
  for (const v of vectors) for (let i = 0; i < v.length; i++) sum[i] += v[i]
  const norm = Math.hypot(...sum)
  return norm > 0 ? sum.map(x => x / norm) : undefined
}
