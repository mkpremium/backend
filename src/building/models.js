import t from 'tcomb'
import debug from 'debug'
import mime from 'mime-types'
import fromJSON from 'tcomb/lib/fromJSON'
import { toJSON } from '../lib/tcomb'
import _get from 'lodash/get'
import squel from 'squel'
import { CouchbaseModel } from '../db/model'
import { newHttpError } from '../lib/http-error'
import { cleanUrl, makePreview, uploadPreview } from '../aws'
import {
  deleteMetadataFromFirebase,
  saveMetadataToFirebase,
  saveProposal,
  updateBuildingToFirebase, updateProposalToFirebase
} from '../firebase/lib/business'
import { updateList } from '../lib/tcomb-utils'
import { BuildingState, OwnerBusinessStatus } from '../types/enums'
import { toGeoJSON } from '../street/views'
import { NeighborhoodRepository } from '../street/models'
import { OwnerRepository } from '../owner/models'
import { BuildingMetadata } from './types'
import { OperatorActions } from '../stats/types'
import { OperatorStats } from '../stats/models'
import _ from 'lodash'
import { N1qlQuery } from 'couchbase'
import { Building, BuildingMetadataPreview } from '../types/building'
import { emitModelEvents } from '../../config'
import { ScheduledEvents } from '../scheduled-events/models'
import { ScheduledEventType } from '../scheduled-events/types'
import { WorksheetRepository } from '../worksheet/models/worksheet'
import '../firebase'

const debugBuilding = debug('app:model:building')

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
    this.Struct = t.BuildingProposal
  }
}

export class BuildingProposalRepository extends BuildingProposal {
  async save (data, sendEvent) {
    const proposal = await super.save(data, sendEvent)
    await saveProposal(proposal)
    return proposal
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

  static async findByPlaceId (placeId) {
    const repo = new BuildingRepository()
    const qb = repo.getQueryBuilder()
      .where('placeId IS NOT MISSING')
      .where('placeId = ?', placeId)
      .limit(1)
    const [building] = await repo.query(qb)
    return building
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
    await deleteMetadataFromFirebase(metadata.id, building.id)
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
    await saveMetadataToFirebase(metadata)
    return metadata
  }

  async addNegotiationProposal (building, operatorId, params) {
    const paramsWithOperator = Object.assign({}, params, {
      createdBy: operatorId,
      buildingId: building.id
    })
    const proposalRepo = new BuildingProposalRepository()
    const proposal = await proposalRepo.save(paramsWithOperator)
    const updateProposals = t.update(building.proposals, { $push: [proposal.id] })
    const updatedBuilding = t.update(building, {
      proposals: { $set: updateProposals },
      recentProposal: { $set: proposal }
    })

    await this.save(updatedBuilding)

    if (proposal.ownerId) {
      const ownerRepo = new OwnerRepository()
      await ownerRepo.updateBusinessStatusFirebase(proposal.ownerId, OwnerBusinessStatus.PROPOSAL_SENT, operatorId)
      const worksheet = await WorksheetRepository.findByBuilding(building.id)

      const worksheetRepository = new WorksheetRepository()
      await worksheetRepository.syncWorksheetFirebase(worksheet)
    }

    const { city, province } = _get(building, 'address', {})

    if (building.proposals.length === 0) {
      await OperatorStats.registerAction(operatorId, OperatorActions.PROPOSAL_SENT, { city, province })
    }

    await updateProposalToFirebase(proposal, building)

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

  async removeEntity (building, entityId) {
    const updatedEntities = building.entities.filter(i => i.id !== entityId)
    const updatedBuilding = await this.updateEntities(building, updatedEntities)

    const repo = new OwnerRepository()
    const [owner] = await repo.findByBuildingWithIncludes(building.id)

    await updateBuildingToFirebase(updatedBuilding, owner)
  }

  async addEntity (building, params) {
    const entity = fromJSON(params, t.BuildingEntity)
    const updatedEntities = t.update(building.entities, { $push: [entity] })
    const updatedBuilding = await this.updateEntities(building, updatedEntities)

    const repo = new OwnerRepository()
    const [owner] = await repo.findByBuildingWithIncludes(building.id)

    await updateBuildingToFirebase(updatedBuilding, owner)

    return entity
  }

  async update (building, $merge) {
    const updatedBuilding = t.update(building, { $merge })
    return this.save(updatedBuilding)
  }

  async updateEntity (building, entityId, params) {
    const entity = building.entities.find(({ id }) => id === entityId)
    if (!entity) {
      throw newHttpError(
        404,
        `No se puede encontrar la entidad ${entityId} para el edificio ${building.id}`
      )
    }
    const updatedEntity = t.update(entity, { $merge: params })
    const updatedEntities = updateList(building.entities, entity, updatedEntity)
    const updatedBuilding = await this.updateEntities(building, updatedEntities)

    const repo = new OwnerRepository()
    const [owner] = await repo.findByBuildingWithIncludes(building.id)

    await updateBuildingToFirebase(updatedBuilding, owner)

    return updatedEntity
  }

  async updateEntities (building, updatedEntities) {
    const updateBuilding = t.update(building, {
      entities: { $set: updatedEntities },
      elements: { $set: calculateElements(building.elements, updatedEntities) }
    })

    return this.save(updateBuilding)
  }

  async findWrongStateBuildingsByCity (city) {
    const qb = this.getQueryBuilder()
    qb.where('address.city = ?', city)
    qb.where('state = ?', BuildingState.MALO)

    const buildings = await this.query(qb)

    return toGeoJSON(buildings)
  }

  async calculateStatsByCity (city) {
    const qb = this.getQueryBuilder('count')
    qb.where('address.city = ?', city)

    qb
      .field('state')
      .field('address.city')
      .field('address.neighborhood')
      .group('state')
      .group('address.city')
      .group('address.neighborhood')

    return this.query(qb)
  }

  async findWrongStateBuildingsStatsByCity (city) {
    const neighborhoodRepo = new NeighborhoodRepository()
    const neighborhoods = await neighborhoodRepo.findByCity(city)
    const results = await this.calculateStatsByCity(city)
    return calculeStateTotals(results, neighborhoods)
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

  /**
   *
   * @param city
   * @returns {Promise<*>}
   */
  async getCityBuildingIds (city) {
    const bucket = this.getBucketName()
    const query = `SELECT RAW id  FROM ${bucket} t
                   WHERE t._documentType = 'building' AND t.address.city = '${city}'
                   ORDER BY id`

    return this.queryRaw(N1qlQuery.fromString(query))
  }

  /**
   *
   * @param buildingIds
   * @returns {Promise<*>}
   */
  async findBuildingsByIds (buildingIds) {
    const ids = `[${buildingIds.map(id => `'${id}'`).join(', ')}]`
    const qb = this.getQueryBuilder()
      .where(`id IN ${ids}`)
    return this.query(qb)
  }

  /**
   *
   * @param buildingId
   * @returns {Promise<*>}
   */
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

function calculeStateTotals (results, neighborhoods) {
  const bad = results.filter(r => r.state === BuildingState.MALO)
  const good = results.filter(r => r.state === BuildingState.BUENO)
  const completeResults = []

  neighborhoods.forEach(neighborhood => {
    const rBad = bad.find(filterStateByNeighborhood(neighborhood, BuildingState.MALO))
    const rGood = good.find(filterStateByNeighborhood(neighborhood, BuildingState.BUENO))

    completeResults.push({
      [`C-${neighborhood.name}`]: _get(rGood, 'count', 0),
      [`D-${neighborhood.name}`]: _get(rBad, 'count', 0)
    })
  })

  return completeResults
}

function filterStateByNeighborhood (neighborhood, state) {
  return (rb) =>
    rb.neighborhood === neighborhood.name &&
    rb.state === state
}

export function calculateElements ({ commons }, entities) {
  const number = entities.length
  const sumSurface = entities.reduce((acc, { surface }) => acc + Number(surface), 0)
  const average = sumSurface / (number > 0 ? number : 1)

  debugBuilding('calculateElements', { number, average, commons })

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
