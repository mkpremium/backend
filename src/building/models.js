import t from 'tcomb';
import debug from 'debug';
import fromJSON from 'tcomb/lib/fromJSON';
import _get from 'lodash/get';
import {CouchbaseModel} from '../db/model';
import {newHttpError} from '../lib/http-error';
import {cleanUrl, makePreview, uploadPreview} from '../aws';
import {saveBuildingToFirebase, saveMetadataToFirebase, saveProposal} from '../firebase/lib/business';
import {updateList} from '../lib/tcomb-utils';
import {fbComerciales} from '../firebase';
import {BuildingState} from '../types/enums';
import {toGeoJSON} from '../street/views';
import {NeighborhoodRepository} from '../street/models';
import {OwnerRepository} from '../owner/models';

const debugBuilding = debug('app:model:building');

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

export class BuildingProposal extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.BuildingProposal;
  }
}

export class BuildingProposalRepository extends BuildingProposal {
  async save(data, sendEvent) {
    const proposal = await super.save(data, sendEvent);
    await saveProposal(proposal);
    return proposal;
  }

  async findByIdOrThrow(proposalId) {
    const proposal = await this.findById(proposalId);
    if (!proposal) {
      throw newHttpError(404, `La negociación ${proposalId} no existe`);
    }

    return proposal;
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
    await saveMetadataToFirebase(metadata);
    return metadata;
  }

  async addNegotiationProposal(building, operatorId, params) {
    const paramsWithOperator = Object.assign({}, params, {
      createdBy: operatorId,
      buildingId: building.id
    });
    const proposalRepo = new BuildingProposalRepository();
    const proposal = await proposalRepo.save(paramsWithOperator);
    const updateProposals = t.update(building.proposals, {$push: [proposal.id]});
    const updatedBuilding = t.update(building, {
      proposals: {$set: updateProposals},
      recentProposal: {$set: proposal}
    });

    await this.save(updatedBuilding);

    return proposal;
  }

  async updateNegotiationProposal(proposal, operatorId, params) {
    const proposalRepo = new BuildingProposalRepository();
    const updatedProposal = t.update(proposal, {
      $merge: Object.assign({}, params, {
        updatedBy: operatorId,
        updatedAt: new Date()
      })
    });

    await proposalRepo.save(updatedProposal);

    const building = await this.findByIdOrThrow(proposal.buildingId);
    const updatedBuilding = t.update(building, {recentProposal: {$set: proposal}});
    await this.save(updatedBuilding);

    return proposal;
  }

  async addEntity(building, params) {
    const ownerRepo = new OwnerRepository();
    const entity = fromJSON(params, t.BuildingEntity);
    const updatedEntities = t.update(building.entities, {$push: [entity]});
    const updatedBuilding = await this.updateEntities(building, updatedEntities);

    const owner = await ownerRepo.findByBuildingWithIncludes(updatedBuilding.id);

    const db = fbComerciales.database();
    await saveBuildingToFirebase(db, updatedBuilding, owner);

    return entity;
  }

  async updateEntity(building, entityId, params) {
    const ownerRepo = new OwnerRepository();
    const entity = building.entities.find(({id}) => id === entityId);
    if (!entity) {
      throw newHttpError(
        404,
        `No se puede encontrar la entidad ${entityId} para el edificio ${building.id}`
      );
    }
    const updatedEntity = t.update(entity, {$merge: params});
    const updatedEntities = updateList(building.entities, entity, updatedEntity);
    const updatedBuilding = await this.updateEntities(building, updatedEntities);

    const owner = await ownerRepo.findByBuildingWithIncludes(updatedBuilding.id);

    const db = fbComerciales.database();
    await saveBuildingToFirebase(db, updatedBuilding, owner);

    return updatedEntity;
  }

  async updateEntities(building, updatedEntities) {
    const updateBuilding = t.update(building, {
      entities: {$set: updatedEntities},
      elements: {$set: calculateElements(building.elements, updatedEntities)}
    });

    return this.save(updateBuilding);
  }

  async findWrongStateBuildingsByCity(city) {
    const qb = this.getQueryBuilder();
    qb.where('address.city = ?', city);
    qb.where('state = ?', BuildingState.MALO);

    const buildings = await this.query(qb);

    return toGeoJSON(buildings);
  }

  async calculateStatsByCity(city) {
    const qb = this.getQueryBuilder('count');
    qb.where('address.city = ?', city);

    qb
      .field('state')
      .field('address.city')
      .field('address.neighborhood')
      .group('state')
      .group('address.city')
      .group('address.neighborhood');

    return this.query(qb);
  }

  async findWrongStateBuildingsStatsByCity(city) {
    const neighborhoodRepo = new NeighborhoodRepository();
    const neighborhoods = await neighborhoodRepo.findByCity(city);
    const results = await this.calculateStatsByCity(city);
    return calculeStateTotals(results, neighborhoods);
  }
}

function calculeStateTotals(results, neighborhoods) {
  const bad = results.filter(r => r.state === BuildingState.MALO);
  const good = results.filter(r => r.state === BuildingState.BUENO);
  const completeResults = [];

  neighborhoods.forEach(neighborhood => {
    let rBad = bad.find(filterStateByNeighborhood(neighborhood, BuildingState.MALO));
    let rGood = good.find(filterStateByNeighborhood(neighborhood, BuildingState.BUENO));

    completeResults.push({
      [`C-${neighborhood.name}`]: _get(rGood, 'count', 0),
      [`D-${neighborhood.name}`]: _get(rBad, 'count', 0)
    });
  });

  return completeResults;
}

function filterStateByNeighborhood(neighborhood, state) {
  return (rb) =>
    rb.neighborhood === neighborhood.name &&
    rb.state === state;
}

function calculateElements({commons}, entities) {
  const number = entities.length;
  const sumSurface = entities.reduce((acc, {surface}) => acc + surface, 0);
  const average = sumSurface / (number > 0 ? number : 1);

  debugBuilding('calculateElements', {number, average, commons});

  return {
    number,
    average,
    commons
  };
}
