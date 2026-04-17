import { expect } from 'chai'
import sinon from 'sinon'
import { CallService } from '../../../src/call/service/call.service'
import * as mapperModule from '../../../src/call/service/mappers/add-owner-command.mapper'

const logger = { warn: sinon.stub() } as any
const contactService = {} as any
const retellCallProvider = {} as any

describe('CallService.takeNewOwnerContact', () => {
  let service: CallService

  let searchOwnerOrBuildingService: any
  let addOwnerService: any
  let updateOwnerTypeService: any
  let mapperStub: sinon.SinonStub

  beforeEach(() => {
    searchOwnerOrBuildingService = {
      search: sinon.stub()
    }

    addOwnerService = {
      addOwner: sinon.stub().resolves({ id: 'new-owner-id' })
    }

    updateOwnerTypeService = {
      updateOwnerType: sinon.stub().resolves()
    }

    service = new CallService(
      contactService,
      logger,
      retellCallProvider,
      addOwnerService,
      updateOwnerTypeService,
      searchOwnerOrBuildingService
    )

    mapperStub = sinon
      .stub(mapperModule, 'addOwnerCommandMapper')
      .returns({} as any)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should set owner as PRINCIPAL when exists and name matches', async () => {
    searchOwnerOrBuildingService.search.resolves([
      { id: 'owner-1', name: 'Juan Perez' }
    ])

    const body = {
      args: {
        phone: '600000000',
        name: 'Juan',
        surname: 'Perez'
      },
      call: { metadata: {} }
    }

    await service.takeNewOwnerContact(body as any)

    expect(updateOwnerTypeService.updateOwnerType.calledOnce).to.be.true
    expect(updateOwnerTypeService.updateOwnerType.firstCall.args).to.eql([
      'owner-1',
      'PRINCIPAL'
    ])

    expect(addOwnerService.addOwner.notCalled).to.be.true
  })

  it('should create new owner and set current as SECUNDARIO when owner exists but name does not match', async () => {
    searchOwnerOrBuildingService.search.resolves([
      { id: 'owner-1', name: 'Pedro Lopez' }
    ])

    const body = {
      args: {
        phone: '600000000',
        name: 'Juan',
        surname: 'Perez'
      },
      call: {
        metadata: { ownerId: 'current-owner-id' }
      }
    }

    await service.takeNewOwnerContact(body as any)

    expect(addOwnerService.addOwner.calledOnce).to.be.true

    expect(updateOwnerTypeService.updateOwnerType.calledOnce).to.be.true
    expect(updateOwnerTypeService.updateOwnerType.firstCall.args).to.eql([
      'current-owner-id',
      'SECUNDARIO'
    ])
  })

  it('should create new owner and set current as SECUNDARIO when owner does not exist', async () => {
    searchOwnerOrBuildingService.search.resolves([])

    const body = {
      args: {
        phone: '600000000',
        name: 'Juan',
        surname: 'Perez'
      },
      call: {
        metadata: { ownerId: 'current-owner-id' }
      }
    }

    await service.takeNewOwnerContact(body as any)

    expect(addOwnerService.addOwner.calledOnce).to.be.true

    expect(updateOwnerTypeService.updateOwnerType.calledOnce).to.be.true
    expect(updateOwnerTypeService.updateOwnerType.firstCall.args).to.eql([
      'current-owner-id',
      'SECUNDARIO'
    ])
  })

  it('should NOT update owner type if currentOwnerId is missing', async () => {
    searchOwnerOrBuildingService.search.resolves([])

    const body = {
      args: {
        phone: '600000000',
        name: 'Juan',
        surname: 'Perez'
      },
      call: {
        metadata: {}
      }
    }

    await service.takeNewOwnerContact(body as any)

    expect(addOwnerService.addOwner.calledOnce).to.be.true
    expect(updateOwnerTypeService.updateOwnerType.notCalled).to.be.true
  })

  it('should NOT do anything if phone is missing', async () => {
    const body = {
      args: {
        name: 'Juan',
        surname: 'Perez'
      },
      call: {
        metadata: {}
      }
    }

    await service.takeNewOwnerContact(body as any)

    expect(searchOwnerOrBuildingService.search.notCalled).to.be.true
    expect(addOwnerService.addOwner.notCalled).to.be.true
    expect(updateOwnerTypeService.updateOwnerType.notCalled).to.be.true
  })

  it('should create new owner when name is missing', async () => {
    searchOwnerOrBuildingService.search.resolves([
      { id: 'owner-1', name: 'Juan Perez' }
    ])

    const body = {
      args: {
        phone: '600000000'
      },
      call: {
        metadata: { ownerId: 'current-owner-id' }
      }
    }

    await service.takeNewOwnerContact(body as any)

    expect(addOwnerService.addOwner.calledOnce).to.be.true
  })
})
