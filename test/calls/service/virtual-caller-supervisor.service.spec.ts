import { expect } from 'chai'
import sinon, { SinonFakeTimers, spy, stub } from 'sinon'
import { VirtualCallerSupervisorService } from '../../../src/calls/service/virtual-caller-supervisor.service'
import { WorksheetViewProps } from '../../../src/worksheet/repository/worksheet.repository'
import moment from 'moment-timezone'
import { ContactsOrderStrategy } from '../../../src/calls/service/virtual-caller.service'

const testCmd = {
  callerId: 'test-caller-id',
  queueId: 'test-queue-id',
  maxWorksheets: 100,
}

describe('VirtualCallerSupervisorService', () => {
  let service!: VirtualCallerSupervisorService
  let virtualCallerStub
  let virtualCallerWorksheetsRepositoryStub
  let loggerSpy
  let clock: SinonFakeTimers

  beforeEach(() => {
    virtualCallerStub = {
      processNextWorksheet: stub(),
    }
    virtualCallerWorksheetsRepositoryStub = {
      numberOfWorksheetsProcessedBy: stub(),
    }
    loggerSpy = {
      info: spy(),
    }

    service = new VirtualCallerSupervisorService(
      virtualCallerStub,
      virtualCallerWorksheetsRepositoryStub,
      loggerSpy,
    )

    const lastMondayMorning = moment().startOf('isoWeek').hours(9).minutes(0)
    clock = sinon.useFakeTimers(lastMondayMorning.toDate())
  })

  afterEach(() => clock.restore())

  it('makes virtual caller process next worksheet', async () => {
    virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy.withArgs(testCmd.callerId).resolves(0)

    await service.check(testCmd)

    expect(virtualCallerStub.processNextWorksheet).to.have.been.calledOnceWith({
      callerId: testCmd.callerId,
      queueId: testCmd.queueId,
      contacts: VirtualCallerSupervisorService.contactsOrderStrategy
    })
  })

  it('does not invoke virtual caller when max worksheets have been processed', async () => {
    virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy.withArgs(testCmd.callerId)
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

  describe('contactsOrderStrategy', () => {
    let contactsOrderStrategy: ContactsOrderStrategy

    beforeEach(async () => {
      virtualCallerWorksheetsRepositoryStub.numberOfWorksheetsProcessedBy.withArgs(testCmd.callerId).resolves(0)
      await service.check(testCmd)

      contactsOrderStrategy = virtualCallerStub.processNextWorksheet.lastCall.firstArg.contacts
    })

    it('does not give duplicated numbers', () => {
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
  })
})
