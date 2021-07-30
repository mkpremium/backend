import { expect } from 'chai'
import sinon, { stub } from 'sinon'
import { ProposalsSenderService } from '../../../src/building/service/proposals-sender.service'
import { emailCopies } from '../../../src/building/service/email-copies'
import { buildingBuilder } from '../building.builder'
import { proposalBuilder } from '../proposal.builder'
import moment from 'moment-timezone'
import { meetingBuilder } from '../../scheduled-events/meeting.builder'

describe('ProposalsSenderService', () => {
  let service!: ProposalsSenderService
  let proposalsRepositoryStub
  let emailSenderStub
  let usersRepositoryStub
  let buildingsRepositoryStub
  let pdfProposalComposerStub
  let scheduledEventsRepositoryStub
  let updateBuildingNegotiationStatusServiceStub

  const testProposal = proposalBuilder().build()
  const testFlipper = {
    id: testProposal.createdBy,
    profile: {
      language: 'pt'
    }
  }
  const testProposalPdf = Buffer.from('test proposal pdf', 'utf-8')

  const testBuilding = buildingBuilder().build()
  beforeEach(() => {
    proposalsRepositoryStub = {
      pendingProposals: stub(),
      save: stub().resolves()
    }
    emailSenderStub = {
      sendMail: stub()
    }
    usersRepositoryStub = {
      get: stub()
    }
    pdfProposalComposerStub = {
      composeProposal: stub()
    }
    scheduledEventsRepositoryStub = {
      lastScheduledEventForBuilding: stub()
    }
    updateBuildingNegotiationStatusServiceStub = {
      updateBuildingStatus: stub().resolves(),
    }

    buildingsRepositoryStub = {
      get: stub()
    }
    service = new ProposalsSenderService(
      proposalsRepositoryStub,
      emailSenderStub,
      usersRepositoryStub,
      pdfProposalComposerStub,
      buildingsRepositoryStub,
      scheduledEventsRepositoryStub,
      updateBuildingNegotiationStatusServiceStub,
      { info: () => undefined } as any
    )

    usersRepositoryStub.get.withArgs(testFlipper.id).resolves(testFlipper)
    buildingsRepositoryStub.get.withArgs(testProposal.buildingId).resolves(testBuilding)
    proposalsRepositoryStub.pendingProposals.resolves([ testProposal ])
    emailSenderStub.sendMail.resolves()
    pdfProposalComposerStub.composeProposal.withArgs(testBuilding, testProposal.proposal, testFlipper.profile)
      .resolves(testProposalPdf)
    scheduledEventsRepositoryStub.lastScheduledEventForBuilding.withArgs(testProposal.buildingId).resolves(undefined)
  })

  it('sends email for pending proposal', async () => {
    await service.checkAndSendProposals()

    expect(emailSenderStub.sendMail).to.have.been.calledWith({
      to: testProposal.notificationEmail,
      subject: emailCopies[ testFlipper.profile.language ][ 'mailSubject' ],
      from: testFlipper,
      message: testProposal.message,
      attachment: { content: testProposalPdf, filename: 'propuesta.pdf' },
    })
  })

  it('updates notification status after send email', async () => {
    await service.checkAndSendProposals()

    expect(proposalsRepositoryStub.save).to.have.been
      .calledWithMatch(p => p.notificationStatus === 'SENT' && p.id === testProposal.id)
  })

  it('does not send proposal for building with last scheduled event within last 3 days', async () => {
    const testYesterdayMeeting = meetingBuilder({
      eventDate: moment().add(-1, 'day').format(),
      createdAt: moment().add(-7, 'day').toDate(),
    }).build()
    scheduledEventsRepositoryStub.lastScheduledEventForBuilding.withArgs(testProposal.buildingId)
      .resolves(testYesterdayMeeting)

    await service.checkAndSendProposals()

    expect(emailSenderStub.sendMail).to.not.have.been.called
  })

  it('does not consider weekends for evaluation period', async () => {
    const lastMonday = moment().startOf('isoWeek')
    const testLastFridayMeeting = meetingBuilder({
      eventDate: lastMonday.clone().add(-3, 'days').toDate(),
      createdAt: moment().add(-7, 'day').toDate(),
    }).build()
    scheduledEventsRepositoryStub.lastScheduledEventForBuilding.withArgs(testProposal.buildingId)
      .resolves(testLastFridayMeeting)
    const clock = sinon.useFakeTimers(lastMonday.toDate())

    await service.checkAndSendProposals()

    expect(emailSenderStub.sendMail).to.not.have.been.called
    clock.restore()
  })

  it('updates building negotiation status', async () => {
    await service.checkAndSendProposals()

    expect(updateBuildingNegotiationStatusServiceStub.updateBuildingStatus).to.have.been.calledWith(
      testBuilding.id,
      {
        status: 'PROPUESTA ENVIADA',
        sourceOwnerId: testProposal.ownerId,
        userId: testFlipper.id,
      }
    )
  })

  it('does not send emails outside working hours', async () => {
    const clock = sinon.useFakeTimers(moment().tz('Europe/Madrid').isoWeekday('6').toDate())

    await service.checkAndSendProposals()
    clock.restore()

    expect(emailSenderStub.sendMail).to.not.have.been.calledWith({
      to: testProposal.notificationEmail,
      subject: emailCopies[ testFlipper.profile.language ][ 'mailSubject' ],
      from: testFlipper,
      message: testProposal.message,
      attachment: { content: testProposalPdf, filename: 'propuesta.pdf' },
    })
  })
})
