// Commande d'administration : définit le mot de passe d'un compte, éventuellement en le renommant.
// Sans e-mail, c'est la seule façon de dépanner un oubli. Toutes les sessions du compte sont fermées.
//   docker exec -it emploi-backend node dist/auth/set-password.js <compte> [nouveau-nom]
import { createInterface } from 'node:readline/promises'
import { prisma } from '../shared/db.js'
import { hashPassword } from './password.js'

async function main(): Promise<void> {
  const [username, rename] = process.argv.slice(2)
  if (!username) throw new Error('Usage : set-password.js <compte> [nouveau-nom]')
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw new Error(`Compte introuvable : ${username}`)
  const newName = rename?.trim().toLowerCase()
  if (newName && !/^[a-z0-9._-]{3,32}$/.test(newName)) throw new Error('Nouveau nom invalide (3 à 32 caractères)')
  const prompt = createInterface({ input: process.stdin, output: process.stdout })
  const password = await prompt.question('Nouveau mot de passe (8 caractères minimum) : ')
  prompt.close()
  if (password.length < 8) throw new Error('Mot de passe trop court')
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password), ...(newName ? { username: newName } : {}) },
  })
  await prisma.session.deleteMany({ where: { userId: user.id } })
  console.log(`Mot de passe défini pour ${newName ?? username}. Ses sessions ont été fermées.`)
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => void prisma.$disconnect())
