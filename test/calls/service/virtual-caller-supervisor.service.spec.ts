import { expect } from 'chai'
import sinon, { SinonFakeTimers, spy, stub } from 'sinon'
import {
  CheckCommand,
  VirtualCallerSupervisorService
} from '../../../src/calls/service/virtual-caller-supervisor.service'
import { WorksheetViewProps } from '../../../src/worksheet/repository/worksheet.repository'
import moment from 'moment-timezone'
import { ContactsOrderStrategy } from '../../../src/calls/service/virtual-caller.service'
import { virtualCallerBuilder } from '../virtual-caller.builder'

const testCmd: CheckCommand = {
  caller: virtualCallerBuilder({
    id: 'test-caller-id',
    queueId: 'test-queue-id',
    isEnabled: true,
  }).build(),
  maxWorksheets: 100,
  lastWorksheetId: undefined,
  lastOwnerResponse: undefined,
}

describe('VirtualCallerSupervisorService', () => {
  let service!: VirtualCallerSupervisorService
  let virtualCallerStub
  let virtualCallerWorksheetsRepositoryStub
  let loggerSpy
  let eventBusStub
  let clock: SinonFakeTimers

  beforeEach(() => {
    virtualCallerStub = {
      processNextWorksheet: stub(),
    }
    virtualCallerWorksheetsRepositoryStub = {
      numberOfWorksheetsProcessedBy: stub(),
    }
    eventBusStub = {
      publish: stub(),
    }
    loggerSpy = {
      info: spy(),
    }

    service = new VirtualCallerSupervisorService(
      virtualCallerStub,
      virtualCallerWorksheetsRepositoryStub,
      eventBusStub,
      loggerSpy,
    )

    const lastMondayMorning = moment().startOf('isoWeek').hours(9).minutes(0)
    clock = sinon.useFakeTimers(lastMondayMorning.toDate())
  })

  afterEach(() => clock.restore())

  it('makes virtual caller process next worksheet', async () => {
    virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy.withArgs(testCmd.caller.queueId).resolves(0)

    await service.check(testCmd)

    expect(virtualCallerStub.processNextWorksheet.lastCall.firstArg).to.include({
      caller: testCmd.caller,
    })
  })

  it('does not check for max worksheets when no maximum is setup', async () => {
    await service.check({ ...testCmd, maxWorksheets: undefined })

    expect(virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy).to.not.have.been.called
  })

  it('does not invoke virtual caller when max worksheets have been processed', async () => {
    virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy.withArgs(testCmd.caller.id)
      .resolves(testCmd.maxWorksheets)

    await service.check(testCmd)

    expect(virtualCallerStub.processNextWorksheet).to.not.have.been.called
    expect(loggerSpy.info).to.have.been.called
  })

  it('does not invoke virtual caller outside scheduled hours', async () => {
    clock.restore()
    clock = sinon.useFakeTimers(moment().startOf('isoWeek').hours(20).minutes(1).toDate())

    await service.check(testCmd)

    expect(virtualCallerStub.processNextWorksheet).to.not.have.been.called
    expect(loggerSpy.info).to.have.been.called
  })

  it('does not invoke disabled virtual caller', async () => {
    await service.check({ ...testCmd, caller: { ...testCmd.caller, isEnabled: false } })

    expect(virtualCallerStub.processNextWorksheet).to.not.have.been.called
    expect(loggerSpy.info).to.have.been.called
  })

  describe('contactsOrderStrategy', () => {
    let contactsOrderStrategy: ContactsOrderStrategy

    beforeEach(async () => {
      virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy.withArgs(testCmd.caller.id).resolves(0)
      await service.check(testCmd)
      eventBusStub.publish.resolves()

      contactsOrderStrategy = virtualCallerStub.processNextWorksheet.lastCall.firstArg.contacts
    })

    it('does not give duplicated numbers within same owner', () => {
      const testWorksheet: Pick<WorksheetViewProps, 'relatedOwners'> = {
        relatedOwners: [
          {
            id: 'test-owner-id',
            name: '',
            status: undefined,
            type: undefined,
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
                {
                  id: 'test-second-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          },
        ],
      }
      const contacts = contactsOrderStrategy(testWorksheet)

      expect(contacts).to.be.eql([ {
        ownerId: 'test-owner-id',
        id: 'test-first-contact-id',
        status: 'UNDEFINED',
        type: 'TELEFONO',
        value: '666666666',
      } ])
    })

    it('does not give duplicated numbers across different owners', () => {
      const testWorksheet: Pick<WorksheetViewProps, 'relatedOwners'> = {
        relatedOwners: [
          {
            id: 'test-owner-1',
            name: '',
            status: undefined,
            type: undefined,
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          },
          {
            id: 'test-owner-2',
            name: '',
            status: undefined,
            type: undefined,
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          },
        ],
      }
      const contacts = contactsOrderStrategy(testWorksheet)

      expect(contacts).to.be.eql([ {
        ownerId: 'test-owner-1',
        id: 'test-first-contact-id',
        status: 'UNDEFINED',
        type: 'TELEFONO',
        value: '666666666',
      } ])
    })

    it('returns contacts in same order', () => {
      const testWorksheet: Pick<WorksheetViewProps, 'relatedOwners'> = {
        relatedOwners: [
          {
            id: 'test-owner-id',
            name: '',
            status: undefined,
            type: undefined,
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
                {
                  id: 'test-second-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666667',
                },
              ]
            }
          },
        ],
      }
      const testReverseOrderWorksheet: Pick<WorksheetViewProps, 'relatedOwners'> = {
        relatedOwners: [
          {
            id: 'test-owner-id',
            name: '',
            status: undefined,
            type: undefined,
            person: {
              contacts: [
                {
                  id: 'test-second-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666667',
                },
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          },
        ]
      }

      const contactsInOrder = contactsOrderStrategy(testWorksheet)
      const contactsInReverseOrder = contactsOrderStrategy(testReverseOrderWorksheet)

      expect(contactsInOrder).to.be.eql(contactsInReverseOrder)
    })

    it('removes duplicated BAD contacts', () => {
      const testWorksheet: Pick<WorksheetViewProps, 'relatedOwners'> = {
        relatedOwners: [
          {
            id: 'test-owner-id',
            name: '',
            status: undefined,
            type: undefined,
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
                {
                  id: 'test-second-contact-id',
                  status: 'BAD',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          },
        ],
      }

      const contacts = contactsOrderStrategy(testWorksheet)

      expect(contacts).to.be.eql([])
    })

    it('publishes event on duplicated contacts in owner', () => {
      const testWorksheet: Pick<WorksheetViewProps, 'relatedOwners'> = {
        relatedOwners: [
          {
            id: 'test-owner-id',
            name: '',
            status: undefined,
            type: undefined,
            person: {
              contacts: [
                {
                  id: 'test-first-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
                {
                  id: 'test-second-contact-id',
                  status: 'BAD',
                  type: 'TELEFONO',
                  value: '666666666',
                },
              ]
            }
          },
        ],
      }

      contactsOrderStrategy(testWorksheet)

      expect(eventBusStub.publish).to.have.been.calledWith({
        name: 'virtual-caller.duplicated_contact_detected_in_owner',
        ownerId: 'test-owner-id',
      })
    })

    it('starts with validated contacts', () => {
      const testWorksheet: Pick<WorksheetViewProps, 'relatedOwners'> = {
        relatedOwners: [
          {
            id: 'test-owner-id',
            name: '',
            status: undefined,
            type: undefined,
            person: {
              contacts: [
                {
                  id: 'test-undefined-contact-id',
                  status: 'UNDEFINED',
                  type: 'TELEFONO',
                  value: '666666666',
                },
                {
                  id: 'test-good-contact-id',
                  status: 'GOOD',
                  type: 'TELEFONO',
                  value: '666666667',
                },
              ]
            }
          },
        ],
      }

      const orderedContacts = contactsOrderStrategy(testWorksheet)

      expect(orderedContacts[0].id).to.be.equal('test-good-contact-id')
    })
  })
})
