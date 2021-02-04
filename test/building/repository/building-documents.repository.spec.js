import { initApplication } from '../../../test-e2e/helper/rest-api-helper'
import { BuildingMetadata } from '../../../src/building/types'
import { expect } from 'chai'

describe('BuildingDocumentsRepository', () => {
  let app
  let buildingDocumentsRepository
  let metadataRepository

  beforeEach(async () => {
    app = await initApplication()
    buildingDocumentsRepository = app.locals.diContainer.resolve('buildingDocumentsRepository')
    metadataRepository = app.locals.legacyDependenciesContainer.metadataRepository
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
