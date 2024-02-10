import S3 from 'aws-sdk/clients/s3'
import { EntityManager } from 'typeorm'
import { BuildingDocument } from '../building-document.entity'

export class GetDocumentsSignedURLService {
  constructor (
    private s3Client: S3,
    private documentBucket: string,
    private entityManager: EntityManager
  ) {
  }

  async getDocumentsSignedURL (buildingId: string) {
    const buildingDocuments = await this.getDocumentsOfBuilding(buildingId)
    return Promise.all(
      buildingDocuments.map(({ documentId, privateUrl, mimeType }) => {
        const url = new URL(privateUrl)
        return this.s3Client
          .getSignedUrlPromise('getObject', {
            Bucket: this.documentBucket,
            Key: url.pathname.substr(1) // path without first slash
          }).then(signedUrl => {
            return {
              documentId,
              mimeType,
              url: signedUrl
            }
          })
      })
    )
  }

  private async getDocumentsOfBuilding (buildingId: string): Promise<{
    documentId: string,
    privateUrl: string,
    mimeType: string
  }[]> {
    const buildingDocuments = await this.entityManager.find(BuildingDocument, {
      where: { building: { id: buildingId } }
    })
    return buildingDocuments.map(doc => ({
      documentId: doc.id,
      mimeType: doc.mimeType,
      privateUrl: doc.privateUrl
    }))
  }
}
