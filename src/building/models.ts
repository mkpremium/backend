import _ from 'lodash'
import _get from 'lodash/get'
import t from 'tcomb'
import { CouchbaseModel } from '../db/model'
import { newHttpError } from '../lib/http-error'
import { toJSON } from '../lib/tcomb'
import { OperatorStats } from '../stats/models'
import { OperatorActions } from '../stats/types'
import { Building, BuildingProposal } from './building'

import { logger } from '../infrastructure/logger'
import { SearchQuery } from 'couchbase'
import { BuyOfferRepository } from './buy-offer.repository'
import HighlightStyle = SearchQuery.HighlightStyle

export class BuildingProposalRepository extends CouchbaseModel {
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

  async addNegotiationProposal (building, operatorId, params) {
    const paramsWithOperator = Object.assign({}, params, {
      createdBy: operatorId,
      buildingId: building.id
    })
    const proposalRepo = new BuildingProposalRepository()
    const proposal = await proposalRepo.save(paramsWithOperator)
    const updateProposals = t.update(building.proposals || [], { $push: [ proposal.id ] })
    const updatedBuilding = t.update(building, {
      proposals: { $set: updateProposals },
      recentProposal: { $set: proposal }
    })

    await this.save(updatedBuilding)
    const { city, province } = _get(building, 'address', {})

    await OperatorStats.registerAction(operatorId, OperatorActions.PROPOSAL_SENT, { city, province })

    return proposal
  }

  async updateNegotiationProposal (proposal, operatorId, params) {
    const proposalRepo = new BuildingProposalRepository()
    const updatedProposal = t.update(proposal, {
      $merge: Object.assign({}, params, {
        updatedBy: operatorId,
        updatedAt: new Date()
      })
    })

    await proposalRepo.save(updatedProposal)

    const building = await this.findByIdOrThrow(proposal.buildingId)
    const updatedBuilding = t.update(building, { recentProposal: { $set: proposal } })
    await this.save(updatedBuilding)

    return proposal
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

  async searchBuilding (query) {
    // TODO
    // return Promise.reject(new Error('Reimplement with new SDK'))
    const qs = this.getSearchBuilder(query)
    qs.highlight(HighlightStyle.DEFAULT)
    qs.fields('*')

    return this.search(qs)
  }

  async findById (id) {
    const qb = this.getQueryBuilder().where('t.`id` = ?', id)
    const results = await this.query(qb)
    return results && results.length && _.first(results)
  }

  private getSearchBuilder (queryString) {
    const name = this.getType()
    return SearchQuery.new(name, SearchQuery.queryString(queryString))
  }

  private async search (searchBuilder) {
    return this.withRetry(() => this.couchbaseAdapter.queryAsync(searchBuilder))
  }
}

export function calculateElements ({ commons }, entities) {
  const number = entities.length
  const sumSurface = entities.reduce((acc, { surface }) => acc + Number(surface), 0)
  const average = sumSurface / (number > 0 ? number : 1)

  logger.debug('building#calculateElements', { number, average, commons })

  return {
    number,
    average,
    commons
  }
}
