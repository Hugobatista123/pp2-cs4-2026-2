import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL não definida')

const adapter = new PrismaPg({ connectionString })
export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
})

prisma.$on('query', (event) => {
  console.log('Query: ' + event.query)
  console.log('Params: ' + event.params)
  console.log('Duration: ' + event.duration + 'ms')
})
