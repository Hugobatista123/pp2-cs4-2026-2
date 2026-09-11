import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { once } from 'node:events'
import type { Server } from 'node:http'

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'Defina TEST_DATABASE_URL apontando para um PostgreSQL de teste com as migrations aplicadas.',
  )
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
const { default: app } = await import('../src/app.js')
const { prisma } = await import('../src/database/client.js')
let server: Server
let baseUrl: string
const createdIds: number[] = []
const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`
const customer = {
  name: 'Mariana Alves Pereira',
  ident_document: `test-${suffix}`,
  birth_date: '1992-04-18T00:00:00.000Z',
  street_name: 'Rua das Acácias',
  house_number: '145',
  complements: 'Apto 32',
  district: 'Jardim América',
  municipality: 'Franca',
  state: 'SP',
  phone: '16991234567',
  email: `mariana-${suffix}@example.com`,
}

async function request(path: string, method = 'GET', body?: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  try {
    await prisma.customer.deleteMany({ where: { id: { in: createdIds } } })
  } finally {
    await prisma.$disconnect()
    if (server)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      )
  }
})

test('CRUD por HTTP grava no PostgreSQL, mantém campos e retorna os status do roteiro', async () => {
  const createdResponse = await request('/customers', 'POST', customer)
  assert.equal(createdResponse.status, 201)
  const created = await createdResponse.json()
  createdIds.push(created.id)
  assert.ok(Number.isInteger(created.id))
  assert.deepEqual(created, { id: created.id, ...customer })

  const persisted = await prisma.customer.findUniqueOrThrow({
    where: { id: created.id },
  })
  assert.equal(persisted.name, customer.name)
  assert.equal(persisted.birth_date?.toISOString(), customer.birth_date)

  const fetched = await request(`/customers/${created.id}`)
  assert.equal(fetched.status, 200)
  assert.deepEqual(await fetched.json(), created)
  const list = await request('/customers')
  assert.equal(list.status, 200)
  const rows = await list.json()
  assert.ok(rows.some((row: { id: number }) => row.id === created.id))
  const orderedIds = (
    await prisma.customer.findMany({ orderBy: { name: 'asc' } })
  ).map((row) => row.id)
  assert.deepEqual(
    rows.map((row: { id: number }) => row.id),
    orderedIds,
  )

  const duplicateDocument = await request('/customers', 'POST', {
    ...customer,
    email: `other-${suffix}@example.com`,
  })
  assert.equal(duplicateDocument.status, 409)
  const duplicateEmail = await request('/customers', 'POST', {
    ...customer,
    ident_document: `other-${suffix}`,
  })
  assert.equal(duplicateEmail.status, 409)

  const updated = await request(`/customers/${created.id}`, 'PUT', {
    house_number: '146',
    birth_date: null,
    complements: null,
  })
  assert.equal(updated.status, 200)
  assert.deepEqual(await updated.json(), {
    ...created,
    house_number: '146',
    birth_date: null,
    complements: null,
  })

  const removed = await request(`/customers/${created.id}`, 'DELETE')
  assert.equal(removed.status, 204)
  assert.equal(await removed.text(), '')
  assert.equal(
    await prisma.customer.findUnique({ where: { id: created.id } }),
    null,
  )
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const response = await request(
      `/customers/${created.id}`,
      method,
      method === 'PUT' ? { name: 'Ausente' } : undefined,
    )
    assert.equal(response.status, 404)
    assert.match((await response.json()).message, /não encontrado/)
  }
})

test('campos opcionais podem ser omitidos', async () => {
  const {
    birth_date: _birthDate,
    complements: _complements,
    ...required
  } = customer
  const response = await request('/customers', 'POST', {
    ...required,
    ident_document: `optional-${suffix}`,
    email: `optional-${suffix}@example.com`,
  })
  assert.equal(response.status, 201)
  const result = await response.json()
  createdIds.push(result.id)
  assert.equal(result.birth_date, null)
  assert.equal(result.complements, null)
})

test('IDs, corpos e JSON inválidos retornam 400; rota inexistente retorna 404', async () => {
  for (const id of ['abc', '0', '-1', '1.5', '2147483648']) {
    const response = await request(`/customers/${id}`)
    assert.equal(response.status, 400)
  }
  for (const body of [
    {},
    { ...customer, name: 42 },
    { ...customer, birth_date: 'invalid' },
  ]) {
    assert.equal((await request('/customers', 'POST', body)).status, 400)
  }
  const malformed = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  })
  assert.equal(malformed.status, 400)
  assert.equal((await request('/missing')).status, 404)
})
