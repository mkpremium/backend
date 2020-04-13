import { expect } from 'chai'
import moment from 'moment'
import { operatorCreateBusiness } from '../../test/common'
import {
  closeBuildingStock,
  createBuilding,
  createOwner, createProposalForBuilding,
  purchaseBuilding,
  sellBuilding
} from '../helper/mother-of-objects'
import { authenticatedGet, initApplication } from '../helper/rest-api-helper'

describe('Building listing endpoint', () => {
  let app, businessUser

  before(async () => {
    app = await initApplication()
    businessUser = await operatorCreateBusiness()
  })

  it('returns list of given building IDs', async () => {
    const owner = await createOwner(app)
    const building1 = await createBuilding(app, owner, {
      id: 'test-building1',
      metadata: [{
        id: 'test-metadata-1',
        name: '5325108TG3452E0001YT.jpg',
        mimeType: 'image/jpeg',
        previewUrl: 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/ffe6fa34-28bf-4da8-9695-53b7bf421648.jpg'
      }]
    })
    const building1Purchase = (await purchaseBuilding(app, {
      buildingId: building1.id,
      propertyAgentId: businessUser.id
    })).purchase
    const building1Sale = (await sellBuilding(app, {
      buildingId: building1.id,
      propertyAgentId: businessUser.id
    })).sell
    const building1ClosedStock = (await closeBuildingStock(app, {
      buildingId: building1.id,
      propertyAgentId: businessUser.id
    })).close
    const building1Proposal = await createProposalForBuilding(app, {
      propertyAgentId: businessUser.id,
      buildingId: building1.id
    })

    const building2 = await createBuilding(app, owner, { id: 'test-building2' })

    await authenticatedGet(`/buildings?id=${building1.id}&id=${building2.id}`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.be.deep.equal([
          {
            id: building1.id,
            metadata: [
              {
                mimeType: 'image/jpeg',
                thumbnailUrl: 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/ffe6fa34-28bf-4da8-9695-53b7bf421648.jpg'
              }
            ],
            stock: {
              purchase: {
                reservationAmount: building1Purchase.reservationAmount,
                reservationDate: moment(building1Purchase.reservationDate).unix(),
                transactionAmount: building1Purchase.transactionAmount,
                transactionDate: moment(building1Purchase.transactionDate).unix()
              },
              sell: {
                reservationAmount: building1Sale.reservationAmount,
                reservationDate: moment(building1Sale.reservationDate).unix(),
                transactionAmount: building1Sale.transactionAmount,
                transactionDate: moment(building1Sale.transactionDate).unix()
              },
              close: {
                gain: building1ClosedStock.gain,
                transactionDate: moment(building1ClosedStock.transactionDate).unix()
              }
            },
            latestProposal: {
              amount: building1Proposal.proposal
            }
          },
          {
            id: building2.id,
            metadata: [],
            stock: {}
          }
        ])
      })
  })
})
