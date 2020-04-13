import { N1qlQuery } from 'couchbase'
import moment from 'moment'

const listBuildingsByIdQuery = `
SELECT
    building.id,
    building.metadata,
    stock,
    building.address,
    building.cadastre.reference cadastreReference,
    building.floorArea,
    building.location,
    building.recentProposal.proposal lastProposal,
    building.\`use\`,
    owner.business.status negotiationStatus
FROM mkpremium building
LEFT JOIN mkpremium stock ON stock.buildingId = building.id AND stock._documentType = 'stock'
LEFT JOIN mkpremium owner ON building.ownerId = owner.id AND owner._documentType = 'owner'
WHERE building._documentType = 'building'
AND building.id IN $1
`

export class CommercialsBuildingRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  listById (ids) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(listBuildingsByIdQuery), [ ids ]
    ).then(buildings => buildings.map(
      ({ id, metadata, stock, lastProposal, cadastreReference, negotiationStatus, address, location, use, floorArea }) => {
        return ({
          id,
          metadata: metadata.map(({ mimeType, previewUrl }) => ({
            mimeType,
            thumbnailUrl: previewUrl
          })),
          stock: {
            purchase: stock && stock.purchase ? {
              reservationAmount: stock.purchase.reservationAmount,
              reservationDate: moment(stock.purchase.reservationDate).unix(),
              transactionAmount: stock.purchase.transactionAmount,
              transactionDate: moment(stock.purchase.transactionDate).unix()
            } : undefined,
            sell: stock && stock.sell ? {
              reservationAmount: stock.sell.reservationAmount,
              reservationDate: moment(stock.sell.reservationDate).unix(),
              transactionAmount: stock.sell.transactionAmount,
              transactionDate: moment(stock.sell.transactionDate).unix()
            } : undefined,
            close: stock && stock.close ? {
              gain: stock.close.gain,
              transactionDate: moment(stock.close.transactionDate).unix()
            } : undefined
          },
          latestProposal: lastProposal ? {
            amount: lastProposal
          } : undefined,
          address: address ? {
            neighborhood: address.neighborhood ? address.neighborhood : undefined,
            type: address.type ? address.type : undefined,
            street: address.street ? address.street : undefined,
            number: address.number ? address.number : undefined,
            postalCode: address.postalCode && address.postalCode.number ? {
              number: address.postalCode.number
            } : undefined,
            city: address.city ? address.city : undefined
          } : undefined,
          geolocation: location && (location.lat || location.lng) ? {
            latitude: location.lat ? location.lat : undefined,
            longitude: location.lng ? location.lng : undefined
          } : undefined,
          cadastreReference,
          negotiationStatus,
          floorArea,
          usage: use !== null ? use : undefined
        })
      }
    ))
  }
}
