import { expect } from 'chai'
import moment from 'moment'
import { operatorCreateBusiness } from '../../test/common'
import {
  closeBuildingStock,
  createBuilding,
  createMeeting,
  createProposalForBuilding,
  createWorksheetForBuilding,
  purchaseBuilding,
  sellBuilding,
  testContactPhone, testOwnerFirstName, testOwnerName, testPhoneContactId
} from '../helper/mother-of-objects'
import { authenticatedGet, initApplication } from '../helper/rest-api-helper'

describe('Building listing endpoint', () => {
  let app, businessUser

  beforeEach(async () => {
    app = await initApplication()
    businessUser = await operatorCreateBusiness()
  })

  it('returns list of given building IDs', async () => {
    const testMetadataId = 'test-metadata-1'
    const building1 = await createBuilding(app, {
      id: 'test-building1',
      metadata: [ {
        id: testMetadataId,
        name: '5325108TG3452E0001YT.jpg',
        mimeType: 'image/jpeg',
        previewUrl: 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/ffe6fa34-28bf-4da8-9695-53b7bf421648.jpg'
      } ],
      cadastre: {
        address: '',
        reference: 'test-building1-cadastre-reference'
      },
      address: {
        neighborhood: 'ALMENDRALES',
        type: 'CL',
        street: 'OLVIDO',
        number: 42,
        postalCode: {
          number: '28026'
        },
        city: 'MADRID'
      },
      location: {
        lat: -1,
        lng: 1
      },
      use: 'RESIDENCIAL',
      floorArea: 500
    })
    const building1Purchase = (await purchaseBuilding(app, {
      buildingId: building1.id,
      propertyAgentId: businessUser.id
    })).purchase

    const building1Proposal = await createProposalForBuilding(app, {
      propertyAgentId: businessUser.id,
      buildingId: building1.id
    })

    const building1LastMeeting = await createMeeting(app, {
      propertyAgentId: businessUser.id,
      contactId: testPhoneContactId,
      buildingId: building1.id,
      ownerId: building1.ownerId
    })
    await createWorksheetForBuilding(app, building1)
    const building1Sale = (await sellBuilding(app, {
      buildingId: building1.id,
      propertyAgentId: businessUser.id
    })).sell

    const building1ClosedStock = (await closeBuildingStock(app, {
      buildingId: building1.id,
      propertyAgentId: businessUser.id
    })).close

    const building2 = await createBuilding(app, { id: 'test-building2' })

    return authenticatedGet(`/buildings?id=${building1.id}&id=${building2.id}`, businessUser, app)
      .then(response => {
        expect(response.status).to.be.equal(200)
        expect(response.body).to.be.deep.equal([
          {
            id: building1.id,
            metadata: [
              {
                id: testMetadataId,
                mimeType: 'image/jpeg',
                thumbnailUrl: 'https://mkpremium-files.s3.eu-west-2.amazonaws.com/preview/ffe6fa34-28bf-4da8-9695-53b7bf421648.jpg'
              }
            ],
            stock: {
              purchase: {
                reservationAmount: building1Purchase.reservationAmount,
                reservationDate: moment(building1Purchase.reservationDate).format(),
                transactionAmount: building1Purchase.transactionAmount,
                transactionDate: moment(building1Purchase.transactionDate).format()
              },
              sell: {
                reservationAmount: building1Sale.reservationAmount,
                reservationDate: moment(building1Sale.reservationDate).format(),
                transactionAmount: building1Sale.transactionAmount,
                transactionDate: moment(building1Sale.transactionDate).format()
              },
              close: {
                gain: building1ClosedStock.gain,
                transactionDate: moment(building1ClosedStock.transactionDate).format()
              }
            },
            latestProposal: {
              amount: building1Proposal.proposal
            },
            cadastreReference: building1.cadastre.reference,
            negotiationStatus: 'VENDIDO',
            address: {
              neighborhood: building1.address.neighborhood,
              type: building1.address.type,
              street: building1.address.street,
              number: building1.address.number,
              postalCode: {
                number: building1.address.postalCode.number
              },
              city: building1.address.city
            },
            geolocation: {
              latitude: building1.location.lat,
              longitude: building1.location.lng
            },
            usage: building1.use,
            floorArea: building1.floorArea,
            owner: {
              id: building1.ownerId,
              firstName: testOwnerFirstName,
              name: testOwnerName,
              contacts: [
                {
                  id: testPhoneContactId,
                  status: 'GOOD',
                  type: 'TELEFONO',
                  value: testContactPhone
                }
              ]
            },
            lastMeeting: {
              dateMeeting: moment(building1LastMeeting.eventDate).format(),
              inPerson: true
            }
          },
          {
            id: building2.id,
            metadata: [],
            stock: {},
            address: {
              city: building2.address.city,
              street: building2.address.street,
              number: building2.address.number
            },
            floorArea: building2.floorArea,
            negotiationStatus: 'PENDIENTE',
            owner: {
              contacts: [
                {
                  id: 'test-contact-id',
                  status: 'GOOD',
                  type: 'TELEFONO',
                  value: '666666666'
                }
              ],
              firstName: 'Owner First Name',
              id: building2.ownerId,
              name: 'Owner Name'
            }
          }
        ])
      })
  })
})
