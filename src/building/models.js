import { N1qlQuery } from 'couchbase'
import _ from 'lodash'
import _get from 'lodash/get'
import mime from 'mime-types'
import squel from 'squel'
import t from 'tcomb'
import { emitModelEvents } from '../../config'
import { cleanUrl, makePreview, uploadPreview } from '../aws'
import { CouchbaseModel } from '../db/model'
import '../firebase'
import { newHttpError } from '../lib/http-error'
import { toJSON } from '../lib/tcomb'
import { ScheduledEvents } from '../scheduled-events/models'
import { ScheduledEventType } from '../scheduled-events/types'
import { OperatorStats } from '../stats/models'
import { OperatorActions } from '../stats/types'
import { Building, BuildingMetadataPreview, BuildingProposal as BuildingProposalStruct } from '../types/building'
import { BuildingMetadata } from './types'

import { logger } from '../infrastructure/logger'

export class Metadata extends CouchbaseModel {
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

export class BuildingProposal extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = BuildingProposalStruct
  }
}

export class BuildingProposalRepository extends BuildingProposal {
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

export class MetadataRepository extends Metadata {

}

export class BuildingRepository extends CouchbaseModel {
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

  async findBuildingByMetadataMigration (lookupData) {
    const expr = squel.expr()
      .or('t._migrateId = ?', lookupData)
      .or('t.cadastre.reference = ?', lookupData)
    const qb = this.getQueryBuilder()
      .where('t._migrateId IS NOT MISSING')
      .where(expr)
    const [result] = await this.query(qb)
    return result
  }

  static async findMeetings (buildingId) {
    const meetingRepo = new ScheduledEvents()
    const qb = meetingRepo.getQueryBuilder()
    qb.where('event.buildingId = ?', buildingId)
    qb.where('type = ?', ScheduledEventType.MEETINGS)
    return meetingRepo.query(qb)
  }

  static async findByCadastreReference (cadastreReference) {
    const repo = new BuildingRepository()
    const qb = repo.getQueryBuilder()
      .where('cadastre IS NOT MISSING')
      .where('cadastre.reference = ?', cadastreReference)
      .limit(1)
    const [building] = await repo.query(qb)
    return building
  }

  /**
   * Find building by cadastre reference / catastro
   * @param cadastre
   * @param required
   * @returns {Promise<*>}
   */
  async findByCatastro (cadastre, required = true) {
    const qb = this.getQueryBuilder()
      .where('cadastre IS NOT MISSING')
      .where('cadastre.reference = ?', cadastre.reference)
      .limit(1)
    const [building] = await this.query(qb)

    if (required && !building) {
      throw new Error(`No records buildings found by cadastreReference ${cadastre.reference}`)
    }
    return building
  }

  static async findByAddress (fullAddress) {
    if (_.isEmpty(fullAddress)) {
      throw newHttpError(400, 'fullAddress no puede estar vacia')
    }
    const repo = new BuildingRepository()
    const qb = repo.getQueryBuilder()
      .where('cadastre IS NOT MISSING')
      .where('address.fullAddress = ?', fullAddress)
      .limit(1)
    const [building] = await repo.query(qb)
    return building
  }

  static async createNewBuilding (data) {
    const json = toJSON(data)
    const _migrateId = lookUpMigrateId(data)
    const updatedJson = Object.assign({}, json, { _migrateId })
    const building = Building(updatedJson)
    const repo = new BuildingRepository()
    return repo.save(building, emitModelEvents)
  }

  async removeMetadataFromBuilding (building, metadata) {
    const updatedMetadata = building.metadata.filter(m => m.id !== metadata.id)
    const updatedBuilding = t.update(building, { metadata: { $set: updatedMetadata } })

    await this.save(updatedBuilding)
    return metadata
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
    const updatedMetadata = t.update(building.metadata, { $push: [BuildingMetadataPreview(metadata)] })
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
    const updateProposals = t.update(building.proposals || [], { $push: [proposal.id] })
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
    const qs = this.getSearchBuilder(query)
    qs.highlight()
    qs.fields('*')

    return this.search(qs)
  }

  async findById (id) {
    const qb = this.getQueryBuilder().where('t.`id` = ?', id)
    const results = await this.query(qb)
    return results && results.length && _.first(results)
  }

  async getBuildingNotesIds (buildingId) {
    const bucket = this.getBucketName()
    const documentType = 'note'
    const query = `SELECT RAW id FROM ${bucket} t WHERE t._documentType = ${JSON.stringify(documentType)} AND t.context.buildingId = ${JSON.stringify(buildingId)}`

    return this.queryRaw(N1qlQuery.fromString(query))
  }

  /**
   *
   * @returns {Promise<*>}
   */
  async getBuildingIds () {
    const bucket = this.getBucketName()
    const query = `SELECT RAW id  FROM ${bucket} t
                   WHERE t._documentType = 'building'
                   ORDER BY id`

    return this.raw(query)
  }

  async getBuildingIdsByCity (city) {
    const bucket = this.getBucketName()
    const query = `SELECT RAW id  FROM ${bucket} t
                   WHERE t._documentType = 'building'
                   AND t.address.city = '${city}'
                   ORDER BY id`

    return this.raw(query)
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

function lookUpMigrateId (data) {
  const migrateId = _get('data', '_migrateId')
  const reference = _.get(data, 'cadastre.reference')
  const fullAddress = _.get(data, 'address.fullAddress')

  return migrateId || reference || fullAddress
}
