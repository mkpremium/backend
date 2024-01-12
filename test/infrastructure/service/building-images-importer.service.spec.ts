import { createTestContainer } from '../../create-test-container'
import { BuildingImagesImporterService } from '../../../src/infrastructure/service/building-images-importer.service'
import uuid from 'uuid/v4'

describe('BuildingImagesImporterService', () => {
  it('imports building images', async () => {
    const testContainer = await createTestContainer({ postgres: true, couchbase: false })
    const service = testContainer.resolve('buildingImagesImporterService') as BuildingImagesImporterService

    await service.importBuildingImages(uuid())
  })
})
