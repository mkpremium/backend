import { CouchbaseAdapter } from '../../db/couchbase.adapter'

const buildingDocumentsQuery = bucketName => `
  SELECT metadata.id,
         metadata.url,
         metadata.mimeType
  FROM ${bucketName} metadata
  WHERE metadata._documentType = 'metadata'
    AND metadata.buildingId = $1
`

export class BuildingDocumentsRepository {
  constructor (private couchbaseAdapter: CouchbaseAdapter) {
  }

  documentsOfBuilding (buildingId: string): Promise<{ documentId: string, privateUrl: string, mimeType: string }[]> {
    return this.couchbaseAdapter.queryAsync(
      buildingDocumentsQuery(this.couchbaseAdapter.bucketName),
      [buildingId]
    ).then(docs => docs.map(({ id, url, mimeType }) => ({ documentId: id, privateUrl: url, mimeType })))
  }
}
