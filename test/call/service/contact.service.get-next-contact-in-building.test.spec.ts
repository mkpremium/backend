import { expect } from 'chai'
import sinon from 'sinon'
import { ContactService } from '../../../src/call/service/contact.service'
import { PostgresCallQueueRepository } from '../../../src/call/repository/postgres-call-queue.repository'
import { ContactType } from '../../../src/call/types/contact-types'

describe('ContactService.getNextContactInBuilding', () => {
  let contactService: ContactService
  let logger: any
  let callQueueRepo: any

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      debug: sinon.stub(),
      error: sinon.stub()
    }

    callQueueRepo = {}

    contactService = new ContactService(
      logger as any,
      callQueueRepo as PostgresCallQueueRepository
    )
  })

  afterEach(() => {
    sinon.restore()
  })

  it('returns PRINCIPAL contact when it exists', async () => {
    const principalContact = {
      queueId: 'queue-principal',
      contactId: 'contact-principal',
      contactType: ContactType.PRINCIPAL
    }

    const getContactStub = sinon
      .stub(contactService, 'getContactByBuildingIdAndContactType')

    getContactStub
      .withArgs('building-1', ContactType.PRINCIPAL)
      .resolves(principalContact as any)

    const result = await contactService.getNextContactInBuilding('building-1')

    expect(result).to.equal(principalContact)

    sinon.assert.calledOnceWithExactly(
      getContactStub,
      'building-1',
      ContactType.PRINCIPAL
    )
  })

  it('returns SECUNDARIO when PRINCIPAL does not exist', async () => {
    const secundarioContact = {
      queueId: 'queue-secundario',
      contactId: 'contact-secundario',
      contactType: ContactType.SECUNDARIO
    }

    const getContactStub = sinon
      .stub(contactService, 'getContactByBuildingIdAndContactType')

    getContactStub
      .withArgs('building-1', ContactType.PRINCIPAL)
      .resolves(null as any)

    getContactStub
      .withArgs('building-1', ContactType.SECUNDARIO)
      .resolves(secundarioContact as any)

    const result = await contactService.getNextContactInBuilding('building-1')

    expect(result).to.equal(secundarioContact)

    sinon.assert.calledTwice(getContactStub)

    sinon.assert.calledWithExactly(
      getContactStub.firstCall,
      'building-1',
      ContactType.PRINCIPAL
    )

    sinon.assert.calledWithExactly(
      getContactStub.secondCall,
      'building-1',
      ContactType.SECUNDARIO
    )
  })

  it('keeps checking contact types until it finds one', async () => {
    const familiarContact = {
      queueId: 'queue-familiar',
      contactId: 'contact-familiar',
      contactType: ContactType.FAMILIAR
    }

    const getContactStub = sinon
      .stub(contactService, 'getContactByBuildingIdAndContactType')

    getContactStub.resolves(null as any)

    getContactStub
      .withArgs('building-1', ContactType.FAMILIAR)
      .resolves(familiarContact as any)

    const result = await contactService.getNextContactInBuilding('building-1')

    expect(result).to.equal(familiarContact)

    sinon.assert.calledWithExactly(
      getContactStub,
      'building-1',
      ContactType.PRINCIPAL
    )

    sinon.assert.calledWithExactly(
      getContactStub,
      'building-1',
      ContactType.SECUNDARIO
    )

    sinon.assert.calledWithExactly(
      getContactStub,
      'building-1',
      ContactType.MISMA_CASA
    )

    sinon.assert.calledWithExactly(
      getContactStub,
      'building-1',
      ContactType.HERMANOS
    )

    sinon.assert.calledWithExactly(
      getContactStub,
      'building-1',
      ContactType.HIJOS
    )

    sinon.assert.calledWithExactly(
      getContactStub,
      'building-1',
      ContactType.FAMILIAR
    )
  })

  it('returns null when no contact type has callable contacts', async () => {
    const getContactStub = sinon
      .stub(contactService, 'getContactByBuildingIdAndContactType')
      .resolves(null as any)

    const result = await contactService.getNextContactInBuilding('building-1')

    expect(result).to.equal(null)

    sinon.assert.callCount(getContactStub, 8)
  })
})
