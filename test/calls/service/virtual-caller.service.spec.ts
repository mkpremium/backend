import { expect } from 'chai'
import sinon, { stub } from 'sinon'
import {
  OwnerContact,
  ProcessNextWorksheetCommand,
  VirtualCallerService
} from '../../../src/calls/service/virtual-caller.service'
import { WorksheetNotFound, WorksheetViewProps } from '../../../src/worksheet/repository/worksheet.repository'
import { worksheetViewBuilder } from '../../worksheet/worksheet-view.builder'
import { VirtualCallerWorksheetProps } from '../../../src/calls/repository/virtual-caller-worksheets.repository'

const firstContact: OwnerContact = {
  id: 'first-contact',
  ownerId: 'test-owner-id',
  type: 'TELEFONO',
  value: '666666661',
  status: 'UNDEFINED'
}
const lastContact: OwnerContact = {
  id: 'second-contact',
  ownerId: 'test-owner-id',
  type: 'TELEFONO',
  value: '666666662',
  status: 'UNDEFINED',
}
const testCmd: ProcessNextWorksheetCommand = {
  queueId: 'test-queue-id',
  callerId: 'test-caller-id',
  contacts: () => [ firstContact, lastContact ],
}
const testWorksheet: WorksheetViewProps = worksheetViewBuilder().build()
const testInProgressWorksheet: VirtualCallerWorksheetProps = {
  worksheetId: testWorksheet.id,
  lastContactId: firstContact.id,
  status: 'CALLING',
  callerId: testCmd.callerId,
}

describe('VirtualCallerService', () => {
  let service!: VirtualCallerService
  let takeNextWorksheetServiceStub
  let virtualCallerPhoneStub
  let virtualCallerWorksheetsRepositoryStub
  let worksheetRepositoryStub
  let eventBusStub

  beforeEach(() => {
    takeNextWorksheetServiceStub = {
      nextWorksheetInQueueOfId: stub().resolves(testWorksheet),
    }
    virtualCallerPhoneStub = {
      call: stub().resolves(),
    }
    virtualCallerWorksheetsRepositoryStub = {
      save: stub().resolves(),
      inProgressWorksheetFor: stub(),
    }
    worksheetRepositoryStub = {
      getForCallcenterView: stub()
    }
    eventBusStub = {
      publish: stub().resolves(),
    }

    service = new VirtualCallerService(
      takeNextWorksheetServiceStub,
      virtualCallerPhoneStub,
      virtualCallerWorksheetsRepositoryStub,
      worksheetRepositoryStub,
      eventBusStub,
      {
        info: stub(),
        error: stub()
      } as any
    )
  })

  it('takes next worksheet from queue when no worksheet is in progress', async () => {
    await service.processNextWorksheet(testCmd)

    expect(takeNextWorksheetServiceStub.nextWorksheetInQueueOfId).to.have.been
      .calledWith(testCmd.queueId, testCmd.callerId)
  })

  it('stores worksheet to process', async () => {
    await service.processNextWorksheet(testCmd)

    expect(virtualCallerWorksheetsRepositoryStub.save).to.have.been.calledOnce
    expect(virtualCallerWorksheetsRepositoryStub.save.lastCall.firstArg).to.include({
      worksheetId: testWorksheet.id,
      lastContactId: firstContact.id,
      status: 'CALLING',
      callerId: testCmd.callerId,
    })
  })

  it('calls first contact in worksheet', async () => {
    await service.processNextWorksheet(testCmd)

    expect(virtualCallerPhoneStub.call).to.have.been.calledOnceWith({
      callerId: testCmd.callerId,
      buildingId: testWorksheet.building.id,
      worksheetId: testWorksheet.id,
      address: testWorksheet.building.address,
      contact: firstContact,
    })
  })

  it('continues with in progress worksheet', async () => {
    virtualCallerWorksheetsRepositoryStub.inProgressWorksheetFor.withArgs(testCmd.callerId)
      .resolves(testInProgressWorksheet)
    worksheetRepositoryStub.getForCallcenterView.withArgs(testInProgressWorksheet.worksheetId)
      .resolves(testWorksheet)

    await service.processNextWorksheet(testCmd)

    expect(virtualCallerPhoneStub.call).to.have.been.calledOnceWith({
      callerId: testCmd.callerId,
      worksheetId: testWorksheet.id,
      buildingId: testWorksheet.building.id,
      address: testWorksheet.building.address,
      contact: lastContact,
    })
    expect(virtualCallerWorksheetsRepositoryStub.save).to.have.been.calledOnce
    expect(virtualCallerWorksheetsRepositoryStub.save.lastCall.firstArg).to.include({
      worksheetId: testWorksheet.id,
      lastContactId: lastContact.id,
      status: 'CALLING',
      callerId: testCmd.callerId,
    })
  })

  it('saves worksheet as done when there are no contacts left', async () => {
    virtualCallerWorksheetsRepositoryStub.inProgressWorksheetFor.withArgs(testCmd.callerId)
      .resolves({ ...testInProgressWorksheet, lastContactId: lastContact.id })
    worksheetRepositoryStub.getForCallcenterView.resolves(testWorksheet)

    await service.processNextWorksheet(testCmd)

    expect(virtualCallerWorksheetsRepositoryStub.save).to.have.been.calledOnce
    expect(virtualCallerWorksheetsRepositoryStub.save.lastCall.firstArg).to.include({
      worksheetId: testWorksheet.id,
      lastContactId: lastContact.id,
      status: 'DONE',
      callerId: testCmd.callerId,
    })
    expect(eventBusStub.publish).to.have.been.calledWith({
      name: 'virtual-caller.worksheet_done',
      worksheetId: testWorksheet.id,
    })
  })

  it('marks worksheet as done when is not found', async () => {
    const clock = sinon.useFakeTimers()
    virtualCallerWorksheetsRepositoryStub.inProgressWorksheetFor.withArgs(testCmd.callerId)
      .resolves(testInProgressWorksheet)
    worksheetRepositoryStub.getForCallcenterView.rejects(new WorksheetNotFound(testWorksheet.id))

    service.processNextWorksheet(testCmd)
    await clock.runAllAsync()
    clock.restore()

    expect(virtualCallerWorksheetsRepositoryStub.save).to.have.been.called
    expect(virtualCallerWorksheetsRepositoryStub.save.firstCall.firstArg).to.include({
      status: 'DONE',
    })
    expect(eventBusStub.publish).to.have.been.calledWith({
      name: 'virtual-caller.worksheet_done',
      worksheetId: testWorksheet.id,
    })
    expect(takeNextWorksheetServiceStub.nextWorksheetInQueueOfId).to.have.been
      .calledWith(testCmd.queueId, testCmd.callerId)
  })
})
