import { PdfProposalComposer } from '../../../src/building/service/pdf-proposal-composer'
import { buildingBuilder } from '../building.builder'
import { UserProfileProps } from '../../../src/types/user'

describe('PdfProposalComposer', () => {
  const testBuilding = buildingBuilder({
    address: {
      type: '',
      street: 'Romo Rampa',
      number: '295',
      city: 'TEST_PORTO',
      postalCode: {
        number: undefined,
        verified: undefined
      },
      fullAddress: undefined,
      neighborhood: undefined,
      province: undefined
    },
    cadastre: {
      reference: '123456789',
    }
  }).build()
  const testFlipper: UserProfileProps = {
    firstName: 'Flipper-Name',
    lastName: 'Flipper-Surname',
    city: 'FLIPPER CITY',
    language: 'es',
  }

  it('composes PDF file', async () => {
    const composer = new PdfProposalComposer()
    const composedPdf = await composer.composeProposal(testBuilding, 1000, testFlipper)

    // fs.writeFileSync('/tmp/proposal.pdf', composedPdf)
  })
})
