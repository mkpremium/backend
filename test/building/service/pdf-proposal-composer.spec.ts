import { PdfProposalComposer } from '../../../src/building/service/pdf-proposal-composer'
import { buildingBuilder } from '../building.builder'
import { OperatorProfileProps } from '../../../src/types/operator'
import * as fs from 'fs'

describe('PdfProposalComposer', () => {
  const testBuilding = buildingBuilder({
    address: {
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
    }
  }).build()
  const testFlipper: OperatorProfileProps = {
    firstName: 'Flipper-Name',
    lastName: 'Flipper-Surname',
    city: 'FLIPPER CITY',
    language: 'es',
  }

  it('composes PDF file', async () => {
    const composer = new PdfProposalComposer()
    const composedPdf = await composer.composeProposal(testBuilding, 1000, testFlipper)

    fs.writeFileSync('/tmp/proposal.pdf', composedPdf)
  })
})
