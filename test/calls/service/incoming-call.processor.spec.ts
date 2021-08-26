import { IncomingCallProcessor } from '../../../src/calls/service/incoming-call.processor'
import { expect } from 'chai'
import { stub } from 'sinon'
import { taskEither } from 'fp-ts'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { WorksheetViewProps } from '../../../src/worksheet/repository/worksheet.repository'
import { worksheetViewBuilder } from '../../worksheet/worksheet-view.builder'

const testCmd = { from: '+34666666666' }
const testComposedMessage = 'test gather owner interest composed message'
const testWorksheet: WorksheetViewProps = worksheetViewBuilder().build()
const testCall = {
  worksheetId: 'test-worksheet-id'
}
describe.only('IncomingCallProcessor', () => {
  let processor: IncomingCallProcessor
  let virtualCallsRepositoryStub
  let gatherOwnerInterestMessageComposerStub
  let worksheetRepositoryStub

  beforeEach(() => {
    virtualCallsRepositoryStub = {
      lastCallTo: stub(),
    }
    virtualCallsRepositoryStub.lastCallTo.returns(taskEither.of(testCall))
    gatherOwnerInterestMessageComposerStub = {
      compose: stub().returns({ toString: () => testComposedMessage }),
    }
    worksheetRepositoryStub = {
      getForCallcenterView: stub(),
    }
    worksheetRepositoryStub.getForCallcenterView.withArgs(testCall.worksheetId).resolves(testWorksheet)

    processor = new IncomingCallProcessor(
      virtualCallsRepositoryStub,
      gatherOwnerInterestMessageComposerStub,
      worksheetRepositoryStub,
    )
  })

  it('rejects calls from number that we did not call', async () => {
    virtualCallsRepositoryStub.lastCallTo.returns(taskEither.of(undefined))

    await pipe(
      processor.process(testCmd),
      TE.orElse(error => expect.fail(error.message)),
      TE.map(
        message => {
          expect(message.toString()).to.include('Reject')
        }
      )
    )()
  })

  it('replies with message composer composed message', async () => {
    await pipe(
      processor.process(testCmd),
      TE.orElse(error => expect.fail(error.message)),
      TE.map(message => {
        expect(message.toString()).to.be.include(testComposedMessage)
      })
    )()
  })

  it('replies with message in same language as caller', async () => {
    await processor.process({ from: '+34666666666' })()
    expect(gatherOwnerInterestMessageComposerStub.compose.lastCall.firstArg).to.include({ language: 'es-ES' })

    await processor.process({ from: '+351999999999' })()
    expect(gatherOwnerInterestMessageComposerStub.compose.lastCall.firstArg).to.include({ language: 'pt-PT' })
  })
})
