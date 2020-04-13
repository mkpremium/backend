import { N1qlQuery } from 'couchbase'
import moment from 'moment'

const listBuildingsByIdQuery = `
SELECT
    building.id,
    building.metadata,
    stock
FROM mkpremium building
LEFT JOIN mkpremium stock ON stock.buildingId = building.id AND stock._documentType = 'stock'
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
      ({ id, metadata, stock }) => {
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
            } : undefined
          }
        })
      }
    ))
  }
}
