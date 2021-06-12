import { expect } from 'chai'
import { stub } from 'sinon'
import { CallerLoopService, StartLoopCommand } from '../../../src/calls/service/caller-loop.service'
import { ContactProps } from '../../../src/owner/owner'
import { WorksheetViewProps } from '../../../src/worksheet/repository/worksheet.repository'
import { worksheetViewBuilder } from '../../worksheet/worksheet-view.builder'

const testCmd: StartLoopCommand = {
  queueId: 'test-queue-id',
  callerId: 'test-caller-id',
  contacts: function* () {
  },
}
const testWorksheet: WorksheetViewProps = worksheetViewBuilder().build()

describe('CallerLoopService', () => {
  let service!: CallerLoopService
  let takeNextWorksheetServiceStub
  let virtualCallerServiceStub

  beforeEach(() => {
    takeNextWorksheetServiceStub = {
      nextWorksheetInQueueOfId: stub().resolves(testWorksheet),
    }
    virtualCallerServiceStub = {
      call: stub().resolves(),
    }

    service = new CallerLoopService(
      takeNextWorksheetServiceStub,
      virtualCallerServiceStub,
    )
  })

  it('takes next worksheet from queue', async () => {
    await service.startLoop(testCmd)

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

    await service.startLoop({
      ...testCmd,
      contacts: function* () {
        yield firstContact
        yield secondContact
      }
    })

    expect(virtualCallerServiceStub.call).to.have.been.calledTwice
    expect(virtualCallerServiceStub.call.firstCall.firstArg).to.be.equal(testWorksheet.building.address)
    expect(virtualCallerServiceStub.call.firstCall.lastArg).to.be.equal(firstContact)
    expect(virtualCallerServiceStub.call.secondCall.firstArg).to.be.equal(testWorksheet.building.address)
    expect(virtualCallerServiceStub.call.secondCall.lastArg).to.be.equal(secondContact)
  })
})
