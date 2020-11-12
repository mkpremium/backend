import { N1qlQuery } from 'couchbase'

const buildingDocumentsQuery = bucketName => `
  SELECT
    metadata.id,
    metadata.url,
    metadata.mimeType
  FROM ${bucketName} metadata
  WHERE metadata._documentType = 'metadata' AND metadata.buildingId = $1
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
      N1qlQuery.fromString(buildingDocumentsQuery(this.couchbaseAdapter.bucketName)).consistency(N1qlQuery.Consistency.REQUEST_PLUS),
      [ buildingId ]
    ).then(docs => docs.map(({ id, url, mimeType }) => ({ documentId: id, privateUrl: url, mimeType })))
  }
}
