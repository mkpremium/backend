import { BuildingMetadata } from '../../../src/building/types'
import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'

describe('BuildingDocumentsRepository', () => {
  let buildingDocumentsRepository
  let metadataRepository

  beforeEach(async () => {
    const container = await createTestContainer()
    buildingDocumentsRepository = container.resolve('buildingDocumentsRepository')
    metadataRepository = container.resolve('legacyMetadataRepository')
  })

  it('returns array with building documents', async () => {
    const testBuildingId = 'test-building-id'
    const testBuildingDocumentId = 'test-building-document-id'
    const testDocumentPath = 'https://bucket.s3.aws.com/document/path'
    const buildingDocument = BuildingMetadata({
      id: testBuildingDocumentId,
      buildingId: testBuildingId,
      url: testDocumentPath,
      createdAt: new Date(),
      mimeType: 'image/jpg',
      createdBy: 'test'
    })

    await metadataRepository.save(buildingDocument)

    const buildingDocuments = await buildingDocumentsRepository.documentsOfBuilding(testBuildingId)
    expect(buildingDocuments).to.deep.equal([ {
      documentId: testBuildingDocumentId,
      privateUrl: testDocumentPath,
      mimeType: 'image/jpg'
    } ])
  })
})
