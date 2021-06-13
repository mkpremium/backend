import { expect } from 'chai'
import { stub } from 'sinon'
import { ProcessNextWorksheetCommand, VirtualCallerService } from '../../../src/calls/service/virtual-caller.service'
import { ContactProps } from '../../../src/owner/owner'
import { WorksheetViewProps } from '../../../src/worksheet/repository/worksheet.repository'
import { worksheetViewBuilder } from '../../worksheet/worksheet-view.builder'

const testCmd: ProcessNextWorksheetCommand = {
  queueId: 'test-queue-id',
  callerId: 'test-caller-id',
  contacts: function* () {
  },
}
const testWorksheet: WorksheetViewProps = worksheetViewBuilder().build()

describe('VirtualCallerService', () => {
  let service!: VirtualCallerService
  let takeNextWorksheetServiceStub
  let virtualCallerPhoneStub

  beforeEach(() => {
    takeNextWorksheetServiceStub = {
      nextWorksheetInQueueOfId: stub().resolves(testWorksheet),
    }
    virtualCallerPhoneStub = {
      call: stub().resolves(),
    }

    service = new VirtualCallerService(
      takeNextWorksheetServiceStub,
      virtualCallerPhoneStub,
    )
  })

  it('takes next worksheet from queue', async () => {
    await service.processNextWorksheet(testCmd)

    expect(takeNextWorksheetServiceStub.nextWorksheetInQueueOfId).to.have.been
      .calledWith(testCmd.queueId, testCmd.callerId)
  })

  it('calls contacts in the order given by strategy', async () => {
    const firstContact: ContactProps = {
      id: 'first-contact',
      type: 'TELEFONO',
      value: '666666666',
      status: 'UNDEFINED',
    }
    const secondContact: ContactProps = {
      id: 'first-contact',
      type: 'TELEFONO',
      value: '666666666',
      status: 'UNDEFINED',
    }

    await service.processNextWorksheet({
      ...testCmd,
      contacts: function* () {
        yield firstContact
        yield secondContact
      }
    })

    expect(virtualCallerPhoneStub.call).to.have.been.calledTwice
    expect(virtualCallerPhoneStub.call.firstCall.firstArg).to.be.equal(testWorksheet.building.address)
    expect(virtualCallerPhoneStub.call.firstCall.lastArg).to.be.equal(firstContact)
    expect(virtualCallerPhoneStub.call.secondCall.firstArg).to.be.equal(testWorksheet.building.address)
    expect(virtualCallerPhoneStub.call.secondCall.lastArg).to.be.equal(secondContact)
  })
})
