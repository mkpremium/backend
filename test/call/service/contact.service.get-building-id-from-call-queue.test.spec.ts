import { expect } from 'chai'
import sinon from 'sinon'
import { AppDataSource } from '../../../src/data-source'
import { ContactService } from '../../../src/call/service/contact.service'
import { PostgresCallQueueRepository } from '../../../src/call/repository/postgres-call-queue.repository'

describe('ContactService.getBuildingIdFromCallQueue', () => {
  let contactService: ContactService

  let ownerId: string | undefined

  let madridCity: string
  let barcelonaCity: string

  let madridAddressId: string | undefined
  let madridOldCalledAddressId: string | undefined
  let madridSecondaryAddressId: string | undefined
  let madridNoPendingAddressId: string | undefined
  let barcelonaAddressId: string | undefined

  let madridBuildingId: string | undefined
  let madridBuildingOldCalledId: string | undefined
  let madridBuildingSecondaryId: string | undefined
  let madridBuildingNoPendingId: string | undefined
  let barcelonaBuildingId: string | undefined

  let contactId: string | undefined
  let oldCalledContactId: string | undefined
  let secondaryContactId: string | undefined
  let noPendingContactId: string | undefined
  let barcelonaContactId: string | undefined

  let queueId: string | undefined
  let oldCalledQueueId: string | undefined
  let secondaryQueueId: string | undefined
  let noPendingQueueId: string | undefined
  let barcelonaQueueId: string | undefined

  const unique = () => `${Date.now()}${Math.floor(Math.random() * 100000)}`

  const createAddress = async (
    city: string,
    province: string,
    suffix: string
  ): Promise<string> => {
    const [address] = await AppDataSource.query(
      `
      INSERT INTO public.building_address (
        street,
        number,
        "fullAddress",
        city,
        province,
        type
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        `Test Street ${suffix}`,
        '1',
        `Test Street ${suffix}, 1`,
        city,
        province,
        'CALLE'
      ]
    )

    return address.id
  }

  const createBuilding = async (addressId: string): Promise<string> => {
    const [building] = await AppDataSource.query(
      `
      INSERT INTO public.building (
        "addressId"
      )
      VALUES ($1)
      RETURNING id
      `,
      [addressId]
    )

    return building.id
  }

  const createContact = async (phone: string): Promise<string> => {
    const [contact] = await AppDataSource.query(
      `
      INSERT INTO public.contact (
        value,
        type
      )
      VALUES ($1, 'PHONE')
      RETURNING id
      `,
      [phone]
    )

    return contact.id
  }

  const createQueueRow = async (params: {
    ownerId: string
    buildingId: string
    contactId: string
    phone: string
    status: string
    contactType: string
    lastCalledAt?: Date | null
  }): Promise<string> => {
    const [queue] = await AppDataSource.query(
      `
      INSERT INTO public.call_queue (
        owner_id,
        building_id,
        contact_id,
        can_call,
        status,
        phone,
        contact_type,
        last_called_at
      )
      VALUES ($1, $2, $3, true, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        params.ownerId,
        params.buildingId,
        params.contactId,
        params.status,
        params.phone,
        params.contactType,
        params.lastCalledAt ?? null
      ]
    )

    return queue.id
  }

  before(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }

    const logger = {
      info: sinon.stub(),
      debug: sinon.stub(),
      error: sinon.stub()
    }

    const callQueueRepo = new PostgresCallQueueRepository()

    contactService = new ContactService(
      logger as any,
      callQueueRepo as any
    )
  })

  beforeEach(async () => {
    const suffix = unique()
    const phoneSuffix = suffix.slice(-6)

    madridCity = `TEST_MADRID_${suffix}`
    barcelonaCity = `TEST_BARCELONA_${suffix}`

    const [owner] = await AppDataSource.query(`
        INSERT INTO public.owner DEFAULT VALUES
        RETURNING id
    `)

    ownerId = owner.id

    const createdOwnerId = owner.id as string

    madridAddressId = await createAddress(
      madridCity,
      'MADRID',
      `madrid-1-${suffix}`
    )

    madridOldCalledAddressId = await createAddress(
      madridCity,
      'MADRID',
      `madrid-2-${suffix}`
    )

    madridSecondaryAddressId = await createAddress(
      madridCity,
      'MADRID',
      `madrid-3-${suffix}`
    )

    madridNoPendingAddressId = await createAddress(
      madridCity,
      'MADRID',
      `madrid-4-${suffix}`
    )

    barcelonaAddressId = await createAddress(
      barcelonaCity,
      'BARCELONA',
      `barcelona-${suffix}`
    )

    madridBuildingId = await createBuilding(madridAddressId)
    madridBuildingOldCalledId = await createBuilding(madridOldCalledAddressId)
    madridBuildingSecondaryId = await createBuilding(madridSecondaryAddressId)
    madridBuildingNoPendingId = await createBuilding(madridNoPendingAddressId)
    barcelonaBuildingId = await createBuilding(barcelonaAddressId)

    contactId = await createContact(`666${phoneSuffix}`)
    oldCalledContactId = await createContact(`667${phoneSuffix}`)
    secondaryContactId = await createContact(`668${phoneSuffix}`)
    noPendingContactId = await createContact(`669${phoneSuffix}`)
    barcelonaContactId = await createContact(`665${phoneSuffix}`)

    queueId = await createQueueRow({
      ownerId: createdOwnerId,
      buildingId: madridBuildingId,
      contactId,
      phone: `666${phoneSuffix}`,
      status: 'PENDING',
      contactType: 'PRINCIPAL',
      lastCalledAt: null
    })

    oldCalledQueueId = await createQueueRow({
      ownerId: createdOwnerId,
      buildingId: madridBuildingOldCalledId,
      contactId: oldCalledContactId,
      phone: `667${phoneSuffix}`,
      status: 'PENDING',
      contactType: 'PRINCIPAL',
      lastCalledAt: new Date('2026-05-20T10:00:00.000Z')
    })

    secondaryQueueId = await createQueueRow({
      ownerId: createdOwnerId,
      buildingId: madridBuildingSecondaryId,
      contactId: secondaryContactId,
      phone: `668${phoneSuffix}`,
      status: 'PENDING',
      contactType: 'SECUNDARIO',
      lastCalledAt: null
    })

    noPendingQueueId = await createQueueRow({
      ownerId: createdOwnerId,
      buildingId: madridBuildingNoPendingId,
      contactId: noPendingContactId,
      phone: `669${phoneSuffix}`,
      status: 'NO_SALE',
      contactType: 'PRINCIPAL',
      lastCalledAt: null
    })

    barcelonaQueueId = await createQueueRow({
      ownerId: createdOwnerId,
      buildingId: barcelonaBuildingId,
      contactId: barcelonaContactId,
      phone: `665${phoneSuffix}`,
      status: 'PENDING',
      contactType: 'PRINCIPAL',
      lastCalledAt: null
    })
  })

  afterEach(async () => {
    const queueIds = [
      queueId,
      oldCalledQueueId,
      secondaryQueueId,
      noPendingQueueId,
      barcelonaQueueId
    ].filter(Boolean)

    if (queueIds.length > 0) {
      await AppDataSource.query(
        `
        DELETE FROM public.call_queue
        WHERE id = ANY($1::uuid[])
        `,
        [queueIds]
      )
    }

    const contactIds = [
      contactId,
      oldCalledContactId,
      secondaryContactId,
      noPendingContactId,
      barcelonaContactId
    ].filter(Boolean)

    if (contactIds.length > 0) {
      await AppDataSource.query(
        `
        DELETE FROM public.contact
        WHERE id = ANY($1::uuid[])
        `,
        [contactIds]
      )
    }

    const buildingIds = [
      madridBuildingId,
      madridBuildingOldCalledId,
      madridBuildingSecondaryId,
      madridBuildingNoPendingId,
      barcelonaBuildingId
    ].filter(Boolean)

    if (buildingIds.length > 0) {
      await AppDataSource.query(
        `
        DELETE FROM public.building
        WHERE id = ANY($1::uuid[])
        `,
        [buildingIds]
      )
    }

    const addressIds = [
      madridAddressId,
      madridOldCalledAddressId,
      madridSecondaryAddressId,
      madridNoPendingAddressId,
      barcelonaAddressId
    ].filter(Boolean)

    if (addressIds.length > 0) {
      await AppDataSource.query(
        `
        DELETE FROM public.building_address
        WHERE id = ANY($1::uuid[])
        `,
        [addressIds]
      )
    }

    if (ownerId) {
      await AppDataSource.query(
        `
        DELETE FROM public.owner
        WHERE id = $1
        `,
        [ownerId]
      )
    }

    ownerId = undefined

    madridAddressId = undefined
    madridOldCalledAddressId = undefined
    madridSecondaryAddressId = undefined
    madridNoPendingAddressId = undefined
    barcelonaAddressId = undefined

    madridBuildingId = undefined
    madridBuildingOldCalledId = undefined
    madridBuildingSecondaryId = undefined
    madridBuildingNoPendingId = undefined
    barcelonaBuildingId = undefined

    contactId = undefined
    oldCalledContactId = undefined
    secondaryContactId = undefined
    noPendingContactId = undefined
    barcelonaContactId = undefined

    queueId = undefined
    oldCalledQueueId = undefined
    secondaryQueueId = undefined
    noPendingQueueId = undefined
    barcelonaQueueId = undefined
  })

  after(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
    }
  })

  it('returns pending principal building from city with NULL last_called_at first', async () => {
    const result = await contactService.getBuildingIdFromCallQueue(madridCity)

    expect(result).to.equal(madridBuildingId)
  })

  it('does not return buildings from another city', async () => {
    const result = await contactService.getBuildingIdFromCallQueue(barcelonaCity)

    expect(result).to.equal(barcelonaBuildingId)
  })

  it('does not return non-principal contacts', async () => {
    const result = await contactService.getBuildingIdFromCallQueue(madridCity)

    expect(result).to.not.equal(madridBuildingSecondaryId)
  })

  it('does not return non-pending contacts', async () => {
    const result = await contactService.getBuildingIdFromCallQueue(madridCity)

    expect(result).to.not.equal(madridBuildingNoPendingId)
  })
})
