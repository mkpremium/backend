import { createTestContainer } from '../../create-test-container'
import { BuildingImagesImporterService } from '../../../src/infrastructure/service/building-images-importer.service'
import uuid from 'uuid/v4'
import {expect} from "chai";

describe('BuildingImagesImporterService', () => {
  it('does not break', async () => {
    const testContainer = await createTestContainer({ postgres: true, couchbase: false })
    const service = testContainer.resolve('buildingImagesImporterService') as BuildingImagesImporterService

    expect(service.importBuildingImages(uuid())).to.eventually.be.undefined
  })
})
