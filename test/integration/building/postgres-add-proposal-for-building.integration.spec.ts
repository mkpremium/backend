import { expect } from 'chai'
import moment from 'moment'
import { Factory } from 'rosie'
import { ProposalProps } from '../../../src/building/building'
import { addProposal, createOwnerWithEmailContact, resolveDependencies } from '../../helpers'
import { buildingFactory } from '../../factories'

describe('AddProposalForBuilding - Integration (Postgres)', () => {
  it('saves proposal for building', async () => {
    const deps = await resolveDependencies()

    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build())
    const [ testOwner, testEmailContact ] =
      await createOwnerWithEmailContact(testBuilding, deps)
    const testFlipper = await deps.addFlipperService.addFlipper(Factory.build('user'))

    const addProposalCmd =
      await addProposal(testBuilding, testOwner, testEmailContact, testFlipper, deps)

    const proposals = await deps.buildingsReadRepository.listProposalsForBuilding(testBuilding.id)
    expect(proposals).to.have.lengthOf(1)
    expect(proposals[ 0 ]).to.be.deep.contains({
      ownerId: testOwner.id,
      createdBy: testFlipper.user.id,
      message: 'test email message',
      notificationStatus: 'PENDING',
      notificationEmail: testEmailContact.value,
    })
    expect((proposals[ 0 ] as ProposalProps).proposal).to.be.closeTo(addProposalCmd.amount, 0.001)
    expect(moment((proposals[ 0 ] as any).createdAt).isSame(moment(), 'day'))
      .to.be.true
  })
})
