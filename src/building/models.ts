import _ from 'lodash'
import t from 'tcomb'
import { CouchbaseModel } from '../db/model'
import { newHttpError } from '../lib/http-error'
import { toJSON } from '../lib/tcomb'
import { Building, BuildingProposal, ProposalProps } from './building'

import { BuyOfferRepository } from './buy-offer.repository'

class BuildingProposalRepository extends CouchbaseModel {
  protected Struct = BuildingProposal

  async findByIdOrThrow (proposalId) {
    const proposal = await this.findById(proposalId)
    if (!proposal) {
      throw newHttpError(404, `La negociación ${proposalId} no existe`)
    }

    return proposal
  }
}


export class LegacyBuildingRepository extends CouchbaseModel implements BuyOfferRepository {
  protected Struct = Building

  getProposal (proposalId: string): Promise<ProposalProps> {
    const proposalRepo = new BuildingProposalRepository()
    return proposalRepo.findByIdOrThrow(proposalId)
  }

  async findByIdOrThrow (buildingId) {
    const building = await this.findById(buildingId)
    if (!building) {
      throw newHttpError(404, `El edificio ${buildingId} no existe`)
    }

    return building
  }

  static async createNewBuilding (data) {
    const json = toJSON(data)
    const building = Building(json)
    const legacyBuildingRepository = new LegacyBuildingRepository()
    return legacyBuildingRepository.save(building)
  }

  async update (building, $merge) {
    const updatedBuilding = t.update(building, { $merge })
    return this.save(updatedBuilding)
  }

  async findById (id) {
    const qb = this.getQueryBuilder().where('t.`id` = ?', id)
    const results = await this.query(qb)
    return results && results.length && _.first(results)
  }
}
