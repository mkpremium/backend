import { N1qlQuery } from 'couchbase'

const buildingDocumentsQuery = `
  SELECT id, url, mimeType
  FROM $2 metadata
  WHERE _documentType = 'metadata' AND buildingId = $1
`

export class BuildingDocumentsRepository {
  /**
   * @param {CouchbaseAdapter} couchbaseAdapter
   */
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  documentsOfBuilding (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(buildingDocumentsQuery).consistency(N1qlQuery.Consistency.REQUEST_PLUS),
      [ buildingId, this.couchbaseAdapter.bucketName ]
    ).then(docs => docs.map(({ id, url, mimeType }) => ({ documentId: id, privateUrl: url, mimeType })))
  }
}
