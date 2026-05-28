import { expect } from 'chai'
import { AppDataSource } from '../../../src/data-source'
import { PostgresCallQueueRepository } from '../../../src/call/repository/postgres-call-queue.repository'

describe('PostgresCallQueueRepository', () => {
  let repository: PostgresCallQueueRepository

  let ownerId: string
  let buildingId: string
  let otherBuildingId: string
  let contactId: string
  let otherContactId: string
  let queueId: string
  let otherQueueId: string

  before(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }

    repository = new PostgresCallQueueRepository()
  })

  beforeEach(async () => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-6)
    const phone = `666${suffix}`
    const otherPhone = `667${suffix}`

    const [owner] = await AppDataSource.query(`
      INSERT INTO public.owner DEFAULT VALUES
      RETURNING id
    `)

    const [building] = await AppDataSource.query(`
      INSERT INTO public.building DEFAULT VALUES
      RETURNING id
    `)

    const [otherBuilding] = await AppDataSource.query(`
      INSERT INTO public.building DEFAULT VALUES
      RETURNING id
    `)

    const [contact] = await AppDataSource.query(`
      INSERT INTO public.contact (value, type)
      VALUES ($1, 'PHONE')
      RETURNING id
    `, [phone])

    const [otherContact] = await AppDataSource.query(`
      INSERT INTO public.contact (value, type)
      VALUES ($1, 'PHONE')
      RETURNING id
    `, [otherPhone])

    ownerId = owner.id
    buildingId = building.id
    otherBuildingId = otherBuilding.id
    contactId = contact.id
    otherContactId = otherContact.id

    const [queue] = await AppDataSource.query(
      `
      INSERT INTO public.call_queue (
        owner_id,
        building_id,
        contact_id,
        can_call,
        status,
        phone,
        contact_type
      )
      VALUES (
        $1,
        $2,
        $3,
        true,
        'PENDING',
        $4,
        'PRINCIPAL'
      )
      RETURNING id
      `,
      [ownerId, buildingId, contactId, phone]
    )

    const [otherQueue] = await AppDataSource.query(
      `
      INSERT INTO public.call_queue (
        owner_id,
        building_id,
        contact_id,
        can_call,
        status,
        phone,
        contact_type
      )
      VALUES (
        $1,
        $2,
        $3,
        true,
        'PENDING',
        $4,
        'PRINCIPAL'
      )
      RETURNING id
      `,
      [ownerId, otherBuildingId, otherContactId, otherPhone]
    )

    queueId = queue.id
    otherQueueId = otherQueue.id
  })

  afterEach(async () => {
    await AppDataSource.query(
      `
      DELETE FROM public.call_queue
      WHERE id IN ($1, $2)
      `,
      [queueId, otherQueueId]
    )

    await AppDataSource.query(
      `
      DELETE FROM public.contact
      WHERE id IN ($1, $2)
      `,
      [contactId, otherContactId]
    )

    await AppDataSource.query(
      `
      DELETE FROM public.building
      WHERE id IN ($1, $2)
      `,
      [buildingId, otherBuildingId]
    )

    await AppDataSource.query(
      `
      DELETE FROM public.owner
      WHERE id = $1
      `,
      [ownerId]
    )
  })

  after(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
    }
  })

  it('freezes contact as no sale', async () => {
    const calledAt = new Date('2026-05-25T10:00:00.000Z')

    await repository.freezeNoSale(calledAt, queueId)

    const [row] = await AppDataSource.query(
      `
      SELECT status, can_call, call_count, last_called_at
      FROM public.call_queue
      WHERE id = $1
      `,
      [queueId]
    )

    expect(row.status).to.equal('NO_SALE')
    expect(row.can_call).to.equal(false)
    expect(row.call_count).to.equal(0)
    expect(row.last_called_at).to.not.equal(null)
  })

  it('freezes contact as do not call', async () => {
    const calledAt = new Date('2026-05-25T10:00:00.000Z')

    await repository.freezeDoNotCall(calledAt, queueId)

    const [row] = await AppDataSource.query(
      `
      SELECT status, can_call, call_count, last_called_at
      FROM public.call_queue
      WHERE id = $1
      `,
      [queueId]
    )

    expect(row.status).to.equal('DO_NOT_CALL')
    expect(row.can_call).to.equal(false)
    expect(row.call_count).to.equal(0)
    expect(row.last_called_at).to.not.equal(null)
  })

  it('freezes contact as sale', async () => {
    const calledAt = new Date('2026-05-25T10:00:00.000Z')

    await repository.freezeSale(calledAt, queueId)

    const [row] = await AppDataSource.query(
      `
      SELECT status, can_call, call_count, last_called_at
      FROM public.call_queue
      WHERE id = $1
      `,
      [queueId]
    )

    expect(row.status).to.equal('SALE')
    expect(row.can_call).to.equal(false)
    expect(row.call_count).to.equal(0)
    expect(row.last_called_at).to.not.equal(null)
  })

  it('marks all contacts from building as sale without touching other buildings', async () => {
    await repository.changeAllBuildingSaleContactStatus(buildingId)

    const [currentBuildingRow] = await AppDataSource.query(
      `
      SELECT status, can_call
      FROM public.call_queue
      WHERE id = $1
      `,
      [queueId]
    )

    const [otherBuildingRow] = await AppDataSource.query(
      `
      SELECT status, can_call
      FROM public.call_queue
      WHERE id = $1
      `,
      [otherQueueId]
    )

    expect(currentBuildingRow.status).to.equal('SALE')
    expect(currentBuildingRow.can_call).to.equal(false)

    expect(otherBuildingRow.status).to.equal('PENDING')
    expect(otherBuildingRow.can_call).to.equal(true)
  })

  it('changes contact status and can_call by queue id', async () => {
    await repository.changeContactStatus(
      'IN_PROGRESS',
      false,
      queueId
    )

    const [row] = await AppDataSource.query(
      `
    SELECT status, can_call
    FROM public.call_queue
    WHERE id = $1
    `, [queueId]
    )

    const [otherRow] = await AppDataSource.query(
      `
       SELECT status, can_call
       FROM public.call_queue
       WHERE id = $1
     `, [otherQueueId]
    )

    expect(row.status).to.equal('IN_PROGRESS')
    expect(row.can_call).to.equal(false)
    expect(otherRow.status).to.equal('PENDING')
    expect(otherRow.can_call).to.equal(true)
  })
})
