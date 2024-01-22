import S3 from 'aws-sdk/clients/s3';
import url from 'url'
import { BuildingDocumentsRepository } from "../repository/building-documents.repository";
import { EntityManager } from "typeorm";
import { BuildingDocument } from "../building-document.entity";

export class GetDocumentsSignedURLService {
  constructor(
    private buildingDocumentsRepository: BuildingDocumentsRepository,
    private s3Client: S3,
    private documentBucket: string,
    private usePostgres: boolean,
    private entityManager: EntityManager,
  ) {
  }

  async getDocumentsSignedURL(buildingId: string) {
    const buildingDocuments = await this.getDocumentsOfBuilding(buildingId)
    return Promise.all(
      buildingDocuments.map(({documentId, privateUrl, mimeType}) => {
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

  private async getDocumentsOfBuilding(buildingId: string): Promise<{
    documentId: string,
    privateUrl: string,
    mimeType: string
  }[]> {
    if (!this.usePostgres) {
      return this.buildingDocumentsRepository.documentsOfBuilding(buildingId);
    }
    const buildingDocuments = await this.entityManager.find(BuildingDocument, {
      where: {building: {id: buildingId}},
    })
    return buildingDocuments.map(doc => ({
      documentId: doc.id,
      mimeType: doc.mimeType,
      privateUrl: doc.privateUrl,
    }))
  }
}
