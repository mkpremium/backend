import S3 from 'aws-sdk/clients/s3';
import url from 'url'
import { BuildingDocumentsRepository } from "../repository/building-documents.repository";

export class GetDocumentsSignedURLService {
  constructor (
    private buildingDocumentsRepository: BuildingDocumentsRepository,
    private s3Client: S3,
    private documentBucket: string,
  ) {
  }

  async getDocumentsSignedURL (buildingId) {
    const buildingDocuments = await this.buildingDocumentsRepository.documentsOfBuilding(buildingId)
    return Promise.all(
      buildingDocuments.map(({ documentId, privateUrl, mimeType }) => {
        return this.s3Client
          .getSignedUrlPromise('getObject', {
            Bucket: this.documentBucket,
            Key: url.parse(privateUrl).path.substr(1) // path without first slash
          }).then(signedUrl => {
            return {
              documentId,
              mimeType: mimeType,
              url: signedUrl
            }
          })
      })
    )
  }
}
