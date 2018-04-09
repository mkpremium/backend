import t from 'tcomb';
import {CouchbaseModel} from '../db/model';
import {newHttpError} from '../lib/http-error';
import {cleanUrl, makePreview, uploadPreview} from '../aws';
import {saveMetadataToFirebase, saveProposal} from '../firebase/lib';

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
  async postSave(proposal) {
    await saveProposal(proposal);
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
      recentProposal: proposal
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
    const updatedBuilding = t.update(building, {recentProposal: proposal});
    await this.save(updatedBuilding);

    return proposal;
  }
}
