import { expect } from 'chai'
import { stub } from 'sinon'
import { ProposalsSenderService } from '../../../src/building/service/proposals-sender.service'
import { emailCopies } from '../../../src/building/service/email-copies'
import { buildingBuilder } from '../building.builder'
import { proposalBuilder } from '../proposal.builder'
import { ScheduledEvent } from '../../../src/scheduled-events/types'
import moment from 'moment'
import { meetingBuilder } from '../../scheduled-events/meeting.builder'

describe('ProposalsSenderService', () => {
  let service!: ProposalsSenderService
  let proposalsRepositoryStub
  let emailSenderStub
  let usersRepositoryStub
  let buildingsRepositoryStub
  let pdfProposalComposerStub
  let scheduledEventsRepositoryStub

  const testProposal = proposalBuilder().build()
  const testCaller = {
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
      undefined
    )

    usersRepositoryStub.get.withArgs(testCaller.id).resolves(testCaller)
    buildingsRepositoryStub.get.withArgs(testProposal.buildingId).resolves(testBuilding)
    proposalsRepositoryStub.pendingProposals.resolves([ testProposal ])
    emailSenderStub.sendMail.resolves()
    pdfProposalComposerStub.composeProposal.withArgs(testBuilding, testProposal.proposal)
      .resolves(testProposalPdf)
    scheduledEventsRepositoryStub.lastScheduledEventForBuilding.withArgs(testProposal.buildingId).resolves(undefined)
  })

  it('sends email for pending proposal', async () => {
    await service.checkAndSendProposals()

    expect(emailSenderStub.sendMail).to.have.been.calledWith({
      to: testProposal.notificationEmail,
      subject: emailCopies[testCaller.profile.language]['mailSubject'],
      from: testCaller,
      message: testProposal.message,
      attachment: testProposalPdf,
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
})
