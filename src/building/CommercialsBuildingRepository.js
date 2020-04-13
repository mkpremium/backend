import { N1qlQuery } from 'couchbase'

const listBuildingsByIdQuery = `
SELECT  id
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
      N1qlQuery.fromString(listBuildingsByIdQuery), [ids]
    )
  }
}
