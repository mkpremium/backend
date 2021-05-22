import { expect } from 'chai'
import { stub } from 'sinon'
import { ProposalsSenderService } from '../../../src/building/service/proposals-sender.service'
import { emailCopies } from '../../../src/building/service/email-copies'
import { buildingBuilder } from '../building.builder'

describe('ProposalsSenderService', () => {
  let service!: ProposalsSenderService
  let proposalsRepositoryStub
  let emailSenderStub
  let usersRepositoryStub
  let buildingsRepositoryStub
  let pdfProposalComposerStub

  beforeEach(() => {
    proposalsRepositoryStub = {
      pendingToSend: stub()
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
  })

  it('sends email for pending proposal', async () => {
    const testProposal = {
      buildingId: 'test-building-id',
      notificationEmail: 'owner@email.test',
      createdBy: 'test-flipper-id',
      message: 'test proposal message',
      proposal: 1000000
    }
    const testCaller = {
      id: testProposal.createdBy,
      profile: {
        language: 'pt'
      }
    }
    const testProposalPdf = Buffer.from('test proposal pdf', 'utf-8')
    const testBuilding = buildingBuilder().build()

    usersRepositoryStub.get.withArgs(testCaller.id).resolves(testCaller)
    buildingsRepositoryStub.get.withArgs(testProposal.buildingId).resolves(testBuilding)
    proposalsRepositoryStub.pendingToSend.resolves([ testProposal ])
    emailSenderStub.sendMail.resolves()
    pdfProposalComposerStub.composeProposal.withArgs(testBuilding, testProposal.proposal)
      .resolves(testProposalPdf)

    await service.checkAndSendProposals()

    expect(emailSenderStub.sendMail).to.have.been.calledWith({
      to: testProposal.notificationEmail,
      subject: emailCopies[testCaller.profile.language]['mailSubject'],
      from: testCaller,
      message: testProposal.message,
      attachment: testProposalPdf,
    })
  })
})
