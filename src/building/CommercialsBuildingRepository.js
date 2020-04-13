import { N1qlQuery } from 'couchbase'

const listBuildingsByIdQuery = `
SELECT id, metadata
FROM mkpremium
WHERE _documentType = 'building'
AND id IN $1
`

export class CommercialsBuildingRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  listById (ids) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(listBuildingsByIdQuery), [ ids ]
    ).then(buildings => buildings.map(
      ({ id, metadata }) => ({
        id,
        metadata: metadata.map(({ mimeType, previewUrl }) => ({
          mimeType,
          thumbnailUrl: previewUrl
        }))
      })
    ))
  }
}
