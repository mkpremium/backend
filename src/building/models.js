import t from 'tcomb';
import {CouchbaseModel} from '../db/model';
import {newHttpError} from '../lib/http-error';
import {cleanUrl, makePreview, uploadPreview} from '../aws';

export class Building extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Building;
  }
}

export class Metadata extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.BuildingMetadata;
  }

  async findByIdOrThrow(metadataId) {
    const metadata = await this.findById(metadataId);
    if (!metadata) {
      throw newHttpError(404, `El archivo de meta datos ${metadataId} no existe`);
    }

    return metadata;
  }
}

export class MetadataRepository extends Metadata {

}

export class BuildingRepository extends Building {
  async findByIdOrThrow(buildingId) {
    const building = await this.findById(buildingId);
    if (!building) {
      throw newHttpError(404, `El edificio ${buildingId} no existe`);
    }

    return building;
  }

  async addMetadataToBuilding(building, params) {
    const localPreview = await makePreview(params.url);
    const previewUrl = await uploadPreview('preview', localPreview);

    const metaRepo = new MetadataRepository();
    const body = Object.assign({}, params, {
      buildingId: building.id,
      previewUrl,
      url: cleanUrl(params.url)
    });
    const metadata = await metaRepo.save(body);
    const updatedMetadata = t.update(building.metadata, {$push: [t.BuildingMetadataPreview(metadata)]});
    const updatedBuilding = t.update(building, {metadata: {$merge: updatedMetadata}});

    await this.save(updatedBuilding);

    return metadata;
  }
}
