import { N1qlQuery } from 'couchbase'

const buildingDocumentsQuery = `
  SELECT id, url
  FROM mkpremium metadata
  WHERE _documentType = 'metadata' AND buildingId = $1
`

export class BuildingDocumentsRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  documentsOfBuilding (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(buildingDocumentsQuery), [ buildingId ]
    ).then(documents => documents.map(({ id, url }) => ({ documentId: id, privateUrl: url })))
  }
}
