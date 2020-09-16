import url from 'url'

export class GetDocumentsSignedURLService {
  constructor (buildingDocumentsRepository, s3Client, documentBucket) {
    this.buildingDocumentsRepository = buildingDocumentsRepository
    this.s3Client = s3Client
    this.documentBucket = documentBucket
  }

  async getDocumentsSignedURL (buildingId) {
    const buildingDocuments = await this.buildingDocumentsRepository.documentsOfBuilding(buildingId)
    return Promise.all(
      buildingDocuments.map(({ documentId, privateUrl }) => {
        return this.s3Client
          .getSignedUrlPromise('getObject', {
            Bucket: this.documentBucket,
            Key: url.parse(privateUrl).path.substr(1) // path without first slash
          }).then(signedUrl => {
            return {
              documentId,
              url: signedUrl
            }
          })
      })
    )
  }
}
