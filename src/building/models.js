import _ from 'lodash'
import _get from 'lodash/get'
import mime from 'mime-types'
import t from 'tcomb'
import { cleanUrl, makePreview, uploadPreview } from '../aws'
import { CouchbaseModel } from '../db/model'
import { newHttpError } from '../lib/http-error'
import { toJSON } from '../lib/tcomb'
import { OperatorStats } from '../stats/models'
import { OperatorActions } from '../stats/types'
import { Building, BuildingMetadataPreview, BuildingProposal as BuildingProposalStruct } from './building'

import { logger } from '../infrastructure/logger'
import { MetadataRepository } from './repository/metadata.repository'

export class BuildingProposalRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = BuildingProposalStruct
  }

  async save (data, sendEvent) {
    return super.save(data, sendEvent)
  }

  async findByIdOrThrow (proposalId) {
    const proposal = await this.findById(proposalId)
    if (!proposal) {
      throw newHttpError(404, `La negociación ${proposalId} no existe`)
    }

    return proposal
  }
}

export class LegacyBuildingRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = Building
  }

  async findByIdOrThrow (buildingId) {
    const building = await this.findById(buildingId)
    if (!building) {
      throw newHttpError(404, `El edificio ${buildingId} no existe`)
    }

    return building
  }

  static async findByCadastreReference (cadastreReference) {
    const legacyBuildingRepository = new LegacyBuildingRepository()
    const qb = legacyBuildingRepository.getQueryBuilder()
      .where('cadastre IS NOT MISSING')
      .where('cadastre.reference = ?', cadastreReference)
      .limit(1)
    const [ building ] = await legacyBuildingRepository.query(qb)
    return building
  }

  static async findByAddress (fullAddress) {
    if (_.isEmpty(fullAddress)) {
      throw newHttpError(400, 'fullAddress no puede estar vacia')
    }
    const legacyBuildingRepository = new LegacyBuildingRepository()
    const qb = legacyBuildingRepository.getQueryBuilder()
      .where('cadastre IS NOT MISSING')
      .where('address.fullAddress = ?', fullAddress)
      .limit(1)
    const [ building ] = await legacyBuildingRepository.query(qb)
    return building
  }

  static async createNewBuilding (data) {
    const json = toJSON(data)
    const building = Building(json)
    const legacyBuildingRepository = new LegacyBuildingRepository()
    return legacyBuildingRepository.save(building)
  }

  async addMetadataToBuilding (building, params) {
    const mimeType = mime.lookup(cleanUrl(params.url))
    const localPreview = await makePreview(params.url)
    const previewUrl = await uploadPreview('preview', localPreview)

    const metaRepo = new MetadataRepository()
    const body = Object.assign({}, params, {
      buildingId: building.id,
      previewUrl,
      mimeType,
      url: cleanUrl(params.url)
    })
    const metadata = await metaRepo.save(body)
    const updatedMetadata = t.update(building.metadata, { $push: [ BuildingMetadataPreview(metadata) ] })
    const updatedBuilding = t.update(building, { metadata: { $merge: updatedMetadata } })

    await this.save(updatedBuilding)
    return metadata
  }

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

  async update (building, $merge) {
    const updatedBuilding = t.update(building, { $merge })
    return this.save(updatedBuilding)
  }

  async searchBuilding (query) {
    // TODO
    return Promise.reject(new Error('Reimplement with new SDK'))
    // const qs = this.getSearchBuilder(query)
    // qs.highlight()
    // qs.fields('*')
    //
    // return this.search(qs)
  }

  async findById (id) {
    const qb = this.getQueryBuilder().where('t.`id` = ?', id)
    const results = await this.query(qb)
    return results && results.length && _.first(results)
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
