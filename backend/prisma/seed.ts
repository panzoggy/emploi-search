import { PrismaClient, JobSource } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')
  
  const user = await prisma.user.upsert({
    where: { email: 'personal@local' },
    update: { id: 'personal-user' },
    create: {
      id: 'personal-user',
      email: 'personal@local',
      name: 'Personal User',
    },
  })
  
  console.log('Created user:', user.email)
  
  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      keywords: ['développeur', 'software engineer', 'fullstack', 'react', 'node.js'],
      locations: ['Paris', 'Lyon', 'Remote', 'Télétravail'],
      contractTypes: ['CDI', 'Freelance', 'CDD'],
      remoteOnly: false,
      salaryMin: 40000,
      salaryMax: 80000,
      experienceLevel: 'mid',
    },
  })
  
  console.log('Created user preferences')
  
  const sampleJobs = [
    {
      externalId: 'indeed-1',
      source: JobSource.INDEED,
      title: 'Développeur Full Stack React/Node.js',
      company: 'TechCorp',
      location: 'Paris',
      description: 'Nous recherchons un développeur Full Stack expérimenté pour rejoindre notre équipe...',
      url: 'https://fr.indeed.com/jobs/view/indeed-1',
      salaryMin: 45000,
      salaryMax: 65000,
      contractType: 'CDI',
      experienceLevel: 'mid',
      remoteType: 'Hybride',
      postedAt: new Date(),
    },
    {
      externalId: 'hellowork-1',
      source: JobSource.HELLOWORK,
      title: 'Ingénieur Logiciel Senior',
      company: 'StartupXYZ',
      location: 'Lyon',
      description: 'Poste de développeur senior dans une startup en forte croissance...',
      url: 'https://www.hellowork.com/offre-emploi/hellowork-1',
      salaryMin: 55000,
      salaryMax: 75000,
      contractType: 'CDI',
      experienceLevel: 'senior',
      remoteType: 'Télétravail partiel',
      postedAt: new Date(Date.now() - 86400000),
    },
    {
      externalId: 'linkedin-1',
      source: JobSource.LINKEDIN,
      title: 'Frontend Developer React',
      company: 'DigitalAgency',
      location: 'Remote',
      description: 'Rejoignez notre équipe en full remote pour développer des interfaces modernes...',
      url: 'https://www.linkedin.com/jobs/view/linkedin-1',
      salaryMin: 40000,
      salaryMax: 60000,
      contractType: 'CDI',
      experienceLevel: 'junior',
      remoteType: 'Full Remote',
      postedAt: new Date(Date.now() - 172800000),
    },
  ]
  
  for (const job of sampleJobs) {
    await prisma.job.upsert({
      where: { externalId_source: { externalId: job.externalId, source: job.source } },
      update: job,
      create: job,
    })
  }
  
  console.log('Created sample jobs')
  console.log('Seeding completed!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })