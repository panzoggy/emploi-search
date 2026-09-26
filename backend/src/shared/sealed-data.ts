import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// Chiffrement au repos des données sensibles (le CV). Clé serveur DATA_KEY (32 octets en base64),
// générée par start.sh. Protège une copie de la base (sauvegarde, fichier récupéré), pas un serveur compromis.
// Chaque chiffré est lié à son propriétaire (données associées) : impossible de le recoller sur un autre compte.
const MAGIC = Buffer.from('EMP1')
const TEXT_PREFIX = 'enc:v1:'

function dataKey(): Buffer {
  const key = Buffer.from(process.env.DATA_KEY ?? '', 'base64')
  if (key.length !== 32) throw new Error('DATA_KEY manquante ou invalide (32 octets en base64, voir .env.example)')
  return key
}

export const assertDataKey = (): void => void dataKey()

export function seal(plain: Buffer, owner: string): Buffer {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', dataKey(), iv)
  cipher.setAAD(Buffer.from(owner))
  const body = Buffer.concat([cipher.update(plain), cipher.final()])
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), body])
}

export const isSealed = (data: Buffer): boolean => data.subarray(0, 4).equals(MAGIC)

// Données écrites avant le chiffrement : rendues telles quelles, et rechiffrées au démarrage
export function unseal(data: Buffer, owner: string): Buffer {
  if (!isSealed(data)) return data
  const decipher = createDecipheriv('aes-256-gcm', dataKey(), data.subarray(4, 16))
  decipher.setAAD(Buffer.from(owner))
  decipher.setAuthTag(data.subarray(16, 32))
  return Buffer.concat([decipher.update(data.subarray(32)), decipher.final()])
}

export const sealText = (text: string, owner: string): string =>
  TEXT_PREFIX + seal(Buffer.from(text, 'utf8'), owner).toString('base64')

export const isSealedText = (text: string): boolean => text.startsWith(TEXT_PREFIX)

export const unsealText = (text: string, owner: string): string =>
  isSealedText(text) ? unseal(Buffer.from(text.slice(TEXT_PREFIX.length), 'base64'), owner).toString('utf8') : text
