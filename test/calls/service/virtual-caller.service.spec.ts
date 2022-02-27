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
import { OwnerResponse } from '../../../src/calls/service/owner-response-processor.service'
import { virtualCallerBuilder } from '../virtual-caller.builder'

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
  caller: virtualCallerBuilder({
    id: 'test-caller-id',
    queueId: 'test-queue-id',
    phoneNumber: '+34666666666',
  }).build(),
  lastWorksheetId: 'test-last-worksheet-id',
  lastOwnerResponse: undefined,
  contacts: () => [ firstContact, lastContact ],
}
const testWorksheet: WorksheetViewProps = worksheetViewBuilder().build()
const testInProgressWorksheet: VirtualCallerWorksheetProps = {
  worksheetId: testWorksheet.id,
  lastContactId: firstContact.id,
  status: 'CALLING',
  callerId: testCmd.caller.id,
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
      .calledWith(testCmd.caller.queueId, testCmd.caller.id)
  })

  it('stores worksheet to process', async () => {
    await service.processNextWorksheet(testCmd)

    expect(virtualCallerWorksheetsRepositoryStub.save).to.have.been.calledOnce
    expect(virtualCallerWorksheetsRepositoryStub.save.lastCall.firstArg).to.include({
      worksheetId: testWorksheet.id,
      lastContactId: firstContact.id,
      status: 'CALLING',
      callerId: testCmd.caller.id,
    })
  })

  it('calls first contact in worksheet', async () => {
    await service.processNextWorksheet(testCmd)

    expect(virtualCallerPhoneStub.call).to.have.been.calledOnceWith({
      caller: testCmd.caller,
      buildingId: testWorksheet.building.id,
      worksheetId: testWorksheet.id,
      address: testWorksheet.building.address,
      contact: firstContact,
    })
  })

  it('continues with in progress worksheet', async () => {
    virtualCallerWorksheetsRepositoryStub.inProgressWorksheetFor.withArgs(testCmd.caller.id)
      .resolves(testInProgressWorksheet)
    worksheetRepositoryStub.getForCallcenterView.withArgs(testInProgressWorksheet.worksheetId)
      .resolves(testWorksheet)

    await service.processNextWorksheet(testCmd)

    expect(virtualCallerPhoneStub.call).to.have.been.calledOnceWith({
      caller: testCmd.caller,
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
      callerId: testCmd.caller.id,
    })
  })

  it('saves worksheet as done when there are no contacts left', async () => {
    virtualCallerWorksheetsRepositoryStub.inProgressWorksheetFor.withArgs(testCmd.caller.id)
      .resolves({ ...testInProgressWorksheet, lastContactId: lastContact.id })
    worksheetRepositoryStub.getForCallcenterView.resolves(testWorksheet)

    await service.processNextWorksheet(testCmd)

    expect(virtualCallerWorksheetsRepositoryStub.save).to.have.been.calledOnce
    expect(virtualCallerWorksheetsRepositoryStub.save.lastCall.firstArg).to.include({
      worksheetId: testWorksheet.id,
      lastContactId: lastContact.id,
      status: 'DONE',
      callerId: testCmd.caller.id,
    })
    expect(eventBusStub.publish).to.have.been.calledWith({
      name: 'virtual_caller.worksheet_done',
      callerId: testCmd.caller.id,
      worksheetId: testWorksheet.id,
    })
  })

  it('marks worksheet as done when is not found', async () => {
    const clock = sinon.useFakeTimers()
    virtualCallerWorksheetsRepositoryStub.inProgressWorksheetFor.withArgs(testCmd.caller.id)
      .resolves(testInProgressWorksheet)
    worksheetRepositoryStub.getForCallcenterView.rejects(new WorksheetNotFound(testWorksheet.id))

    service.processNextWorksheet(testCmd)
    await clock.runAllAsync()
    clock.restore()

    expect(virtualCallerWorksheetsRepositoryStub.save).to.have.been.called
    expect(virtualCallerWorksheetsRepositoryStub.save.firstCall.firstArg).to.include({
      status: 'DONE',
    })
    expect(takeNextWorksheetServiceStub.nextWorksheetInQueueOfId).to.have.been
      .calledWith(testCmd.caller.queueId, testCmd.caller.id)
  })

  it('saves worksheet as done when owner is interested on selling', async () => {
    virtualCallerWorksheetsRepositoryStub.inProgressWorksheetFor.withArgs(testCmd.caller.id)
      .resolves(testInProgressWorksheet)
    worksheetRepositoryStub.getForCallcenterView.resolves(testWorksheet)

    await service.processNextWorksheet({
      ...testCmd,
      lastWorksheetId: testInProgressWorksheet.worksheetId,
      lastOwnerResponse: OwnerResponse.SALE,
    })

    expect(virtualCallerWorksheetsRepositoryStub.save).to.have.been.calledOnce
    expect(virtualCallerWorksheetsRepositoryStub.save.lastCall.firstArg).to.include({
      ...testInProgressWorksheet,
      status: 'DONE',
    })
    expect(eventBusStub.publish).to.have.been.calledWith({
      name: 'virtual_caller.worksheet_done',
      callerId: testCmd.caller.id,
      worksheetId: testWorksheet.id,
    })
  })

  it('marks worksheet as done when is in an unavailable status', async () => {
    virtualCallerWorksheetsRepositoryStub.inProgressWorksheetFor.withArgs(testCmd.caller.id)
      .resolves(testInProgressWorksheet)
    worksheetRepositoryStub.getForCallcenterView.withArgs(testInProgressWorksheet.worksheetId)
      .resolves(worksheetViewBuilder({ status: 'NO_SALE' }).build())

    await service.processNextWorksheet(testCmd)

    expect(virtualCallerWorksheetsRepositoryStub.save).to.have.been.called
    expect(virtualCallerWorksheetsRepositoryStub.save.firstCall.firstArg).to.include({
      status: 'DONE',
    })
    expect(takeNextWorksheetServiceStub.nextWorksheetInQueueOfId).to.have.been
      .calledWith(testCmd.caller.queueId, testCmd.caller.id)
  })
})
