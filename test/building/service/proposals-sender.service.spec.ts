import { expect } from 'chai'
import { stub } from 'sinon'
import { ProposalsSenderService } from '../../../src/building/service/proposals-sender.service'
import { emailCopies } from '../../../src/building/service/email-copies'
import { buildingBuilder } from '../building.builder'
import { BuildingProposal } from '../../../src/building/building'
import { proposalBuilder } from '../proposal.builder'

describe('ProposalsSenderService', () => {
  let service!: ProposalsSenderService
  let proposalsRepositoryStub
  let emailSenderStub
  let usersRepositoryStub
  let buildingsRepositoryStub
  let pdfProposalComposerStub

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
      pendingToSend: stub(),
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
    buildingsRepositoryStub = {
      get: stub()
    }

    service = new ProposalsSenderService(
      proposalsRepositoryStub,
      emailSenderStub,
      usersRepositoryStub,
      pdfProposalComposerStub,
      buildingsRepositoryStub
    )

    usersRepositoryStub.get.withArgs(testCaller.id).resolves(testCaller)
    buildingsRepositoryStub.get.withArgs(testProposal.buildingId).resolves(testBuilding)
    proposalsRepositoryStub.pendingToSend.resolves([ testProposal ])
    emailSenderStub.sendMail.resolves()
    pdfProposalComposerStub.composeProposal.withArgs(testBuilding, testProposal.proposal)
      .resolves(testProposalPdf)
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
})
