import { CouchbaseModel } from '../../db/model'
import { BuildingMetadata } from '../types'
import { newHttpError } from '../../lib/http-error'

export class MetadataRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = BuildingMetadata
  }

  async findByIdOrThrow (metadataId) {
    const metadata = await this.findById(metadataId)
    if (!metadata) {
      throw newHttpError(404, `El archivo de meta datos ${metadataId} no existe`)
    }

    return metadata
  }
}
