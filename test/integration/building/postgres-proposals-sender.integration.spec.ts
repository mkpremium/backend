import sinon, { SinonFakeTimers, stub } from 'sinon'
import { asValue } from 'awilix'
import { expect } from 'chai'
import moment from 'moment-timezone'
import { addCaller, createOwnerWithEmailContact, resolveDependencies } from "../../helpers";
import { buildingFactory } from "../../factories";
import { ProposalsSenderService } from "../../../src/building/service/proposals-sender.service";

describe('ProposalsSenderService - Integration (Postgres)', () => {
  let clock: SinonFakeTimers
  beforeEach(async () => {
    const lastMondayMorning = moment().startOf('isoWeek').hours(9).minutes(0)
    clock = sinon.useFakeTimers({now: lastMondayMorning.toDate(), shouldClearNativeTimers: true})
  })

  afterEach(() => clock.restore())

  it('sends emails older than 3 days', async () => {
    const deps = await resolveDependencies()
    const testCaller = await addCaller(deps)
    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    const [testOwner, testEmailContact] = await createOwnerWithEmailContact(testBuilding, deps)

    const mailerSpy = {sendMail: stub()}
    mailerSpy.sendMail.resolves()
    deps.container.register('emailTransport', asValue(mailerSpy))

    const testAddProposalCmd = {
      amount: 100000,
      ownerId: testOwner.id,
      contactId: testEmailContact.id,
      createdBy: testCaller.id,
    }


    await deps.addProposalForBuildingService.add(testBuilding.id, testAddProposalCmd)
    const service = deps.container.resolve('proposalsSenderService') as ProposalsSenderService
    await service.checkAndSendProposals()

    expect(mailerSpy.sendMail).to.have.been.called
  })
})
