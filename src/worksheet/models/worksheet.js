import Promise from 'bluebird'
import { N1qlQuery } from 'couchbase'
import _ from 'lodash'
import _every from 'lodash/every'
import _find from 'lodash/find'
import _get from 'lodash/get'
import _head from 'lodash/head'
import _isNil from 'lodash/isNil'
import _map from 'lodash/map'
import _some from 'lodash/some'
import _uniq from 'lodash/uniq'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'
import { emitModelEvents } from '../../../config'
import { BuildingRepository } from '../../building/models'

import { CouchbaseModel } from '../../db/model'
import { newHttpError } from '../../lib/http-error'
import { addBetweenQueryToBuilder, addDateQueryToBuilder } from '../../lib/query/helpers'
import { OwnerRepository } from '../../owner/models'
import { ownersContactViews } from '../../owner/types'
import { ScheduledEvents } from '../../scheduled-events/models'
import { ScheduledEventType } from '../../scheduled-events/types'
import { OperatorStats } from '../../stats/models'
import { OperatorActions } from '../../stats/types'
import { OwnerBusinessStatus, OwnerStatus } from '../../types/enums'
import { Worksheet, WorkSheetStatus } from '../../types/worksheet'
import { WorksheetListQuery, WorksheetSearchQuery, WorksheetSearchResponse } from '../types'

function canRegisterVerified (worksheet, newStatus, operatorId) {
  if (!operatorId) {
    return false
  }

  if (worksheet.status === newStatus) {
    return false
  }

  if (newStatus !== WorkSheetStatus.WITH_OWNER) {
    return false
  }

  return true
}

export class WorksheetRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = t.WorkSheet
  }

  async findBySource ({ source, worksheetIndex }) {
    const withReferenceResults = await this._findBySourceAndReference(source, worksheetIndex)
    if (!withReferenceResults || withReferenceResults.length === 0) {
      return this._findBySourceAndReference(source)
    }
    return withReferenceResults
  }

  async findByIdOrThrow (worksheetId) {
    const worksheet = await this.findById(worksheetId)
    if (!worksheet) {
      throw newHttpError(404, `La hoja de trabajo ${worksheetId} no existe`)
    }

    return worksheet
  }

  async findByIdWIthIncludes (id, includes = [ 'relatedOwners', 'relatedBuildings' ]) {
    let worksheet = await this.findByIdOrThrow(id)
    if (includes.indexOf('relatedBuildings') !== -1 && worksheet.relatedBuildingIds.length > 0) {
      const buildingRepo = new BuildingRepository()
      const idsText = `[${worksheet.relatedBuildingIds.map(id => `'${id}'`).join(', ')}]`
      const rbQb = await buildingRepo.getQueryBuilder().where(`id IN ${idsText}`)
      const relatedBuildings = await buildingRepo.query(rbQb)
      worksheet = t.update(worksheet, { relatedBuildings: { $set: relatedBuildings } })
    }

    if (includes.indexOf('relatedOwners') !== -1 && worksheet.relatedOwnerIds.length > 0) {
      const ownerRepo = new OwnerRepository()
      const relatedOwners = await ownerRepo.findByIdWithIncludes(worksheet.relatedOwnerIds)
      worksheet = t.update(worksheet, {
        relatedOwners: { $set: relatedOwners },
        ownerContacts: { $set: ownersContactViews(relatedOwners, worksheet) }
      })
    }

    return worksheet
  }

  async findMeetings (worksheetId) {
    const meetingRepo = new ScheduledEvents()
    const qb = meetingRepo.getQueryBuilder()
    qb.where('type = ?', ScheduledEventType.MEETINGS)
    qb.where('event.worksheetId = ?', worksheetId)
    return meetingRepo.query(qb)
  }

  static async findMeetings (worksheetId) {
    const repo = new WorksheetRepository()
    return repo.findMeetings(worksheetId)
  }

  async findWorksheetByBuilding (buildingId) {
    const qb = this.getQueryBuilder()
      .where('ANY v IN t.`relatedBuildingIds` SATISFIES v = ? END', buildingId)

    const results = await this.query(qb)

    return fromJSON(_head(results), t.WorkSheet)
  }

  static async findByBuilding (buildingId) {
    const repo = new WorksheetRepository()
    return repo.findWorksheetByBuilding(buildingId)
  }

  async findWorksheetByOwner (ownerId) {
    const qb = this.getQueryBuilder()
      .where('ANY v IN t.`relatedOwnerIds` SATISFIES v = ? END', ownerId)

    const results = await this.query(qb)

    return _head(results)
  }

  static mapNegotiationStatusToWorksheetStatus (negotiationStatus) {
    switch (negotiationStatus) {
      case OwnerBusinessStatus.DISCARDED:
        return WorkSheetStatus.PUBLIC
      case OwnerBusinessStatus.NO_SALE:
        return WorkSheetStatus.NO_SALE
      case OwnerBusinessStatus.ALREADY_SOLD:
        return WorkSheetStatus.INVALID
      default:
        return WorkSheetStatus.MEETING
    }
  }

  async calculateFixedStatus (worksheet) {
    if (worksheet.relatedBuildings && worksheet.relatedBuildings.length > 0) {
      return WorksheetRepository.mapNegotiationStatusToWorksheetStatus(worksheet.relatedBuildings[ 0 ].negotiationStatus)
    }

    const ownersStatus = worksheet.relatedOwners
      ? worksheet.relatedOwners.map(owner => ({
        status: owner.status,
        isConfirmedByOperator: !!owner.confirmedByOperator.value
      }))
      : []

    switch (true) {
      case _some(ownersStatus,
        ({ status, isConfirmedByOperator }) => isConfirmedByOperator && status === OwnerStatus.PUBLIC):
        return WorkSheetStatus.PUBLIC
      case _some(ownersStatus,
        ({ status, isConfirmedByOperator }) => isConfirmedByOperator && status === OwnerStatus.NO_SALE):
        return WorkSheetStatus.NO_SALE
      case _some(ownersStatus,
        ({ status, isConfirmedByOperator }) => isConfirmedByOperator && status === OwnerStatus.ALREADY_SOLD):
        return WorkSheetStatus.ALREADY_SOLD
      case _every(ownersStatus, ({ status }) => status === OwnerStatus.ERROR):
        return WorkSheetStatus.INVALID
      case _some(ownersStatus,
        ({ status, isConfirmedByOperator }) => isConfirmedByOperator && status === OwnerStatus.VERIFIED):
        return WorkSheetStatus.WITH_OWNER
      default:
        const meetings = await this.findMeetings(worksheet.id)
        if (meetings.length > 0) {
          return WorkSheetStatus.MEETING
        }

        return worksheet.status
    }
  }

  async updateStatus (worksheetId, operatorId) {
    const worksheetData = await this.findByIdWIthIncludes(worksheetId)
    const worksheet = fromJSON(worksheetData, t.WorkSheet)
    const newStatus = await this.calculateFixedStatus(worksheet)
    const updatedWorksheet = worksheet.setStatus(newStatus)
    if (canRegisterVerified(worksheet, newStatus, operatorId)) {
      await OperatorStats.registerAction(operatorId, OperatorActions.VERIFIED_OWNER)
    }

    return this.save(updatedWorksheet)
  }

  async sendWorksheetEvent (worksheetId) {
    const worksheet = await this.findById(worksheetId)
    if (worksheet) {
      return this.sendEvent(`${worksheet.id}`, worksheet)
    }
  }

  async addOwner (worksheet, owner) {
    const updatedWorksheet = t.update(worksheet, {
      relatedBuildingIds: {
        $set: _uniq(worksheet.relatedBuildingIds.concat([ owner.buildingId ]))
      },
      relatedOwnerIds: {
        $set: _uniq(worksheet.relatedOwnerIds.concat([ owner.id ]))
      }
    })

    return this.save(updatedWorksheet)
  }

  async worksheetStats () {
    const bucket = this.getBucketName()

    const query = `SELECT t.buildingAddress.province, t.status, COUNT(*) as count FROM ${bucket} t
    WHERE t._documentType = 'worksheet' AND t.status IS NOT MISSING
    GROUP BY t.status, t.buildingAddress.province`

    const result = await this.queryRaw(N1qlQuery.fromString(query))

    const provinces = _.uniq(result.map(r => r.province))

    const totals = {}

    provinces.forEach(province => {
      totals[ province ] = {}
      Object.values(WorkSheetStatus).forEach(status => {
        const total = _find(result, { province: province, status: status }) || { count: 0 }
        totals[ province ][ status ] = total.count
      })
    })

    return totals
  }

  async countWorksheetsInSource (source) {
    const bucket = this.getBucketName()
    const sourceFilter = []
    Object.keys(source).forEach(key => {
      const value = source[ key ]
      if (!_isNil(value)) {
        sourceFilter.push(`t.buildingAddress.${key} IS NOT MISSING`)
        sourceFilter.push(`t.buildingAddress.${key} = ${JSON.stringify(value)}`)
      }
    })
    const filter = sourceFilter.length > 0
      ? 'AND ' + sourceFilter.join(' AND ')
      : ''

    const baseQuery = `SELECT COUNT(*) as count FROM ${bucket} t
    WHERE (t._documentType = 'worksheet') AND (queueId IS NULL) AND (status = 'OPEN' OR status = 'LOOKING_MEETING') ${filter}`
    const results = await this.queryRaw(N1qlQuery.fromString(baseQuery))
    return _get(results, '0.count', 0)
  }

  static async notifyWorkSheetChange (worksheetId) {
    const worksheetRepo = new WorksheetRepository()
    await worksheetRepo.sendWorksheetEvent(worksheetId)
  }

  static async updateWorkSheetStatus (worksheetId, operatorId) {
    const worksheetRepo = new WorksheetRepository()
    return worksheetRepo.updateStatus(worksheetId, operatorId)
  }

  static async notifyWorkSheetChangeByOwner (ownerId) {
    const worksheetRepo = new WorksheetRepository()
    const worksheet = await worksheetRepo.findWorksheetByOwner(ownerId)
    if (worksheet) {
      await WorksheetRepository.notifyWorkSheetChange(worksheet.id)
    }
  }

  static async createNewForBuilding (building) {
    const worksheet = Worksheet({
      id: uuid(),
      _relatedTo: _get(building, 'owner.name'),
      relatedBuildingIds: [ building.id ],
      relatedOwnerIds: [],
      buildingAddress: building.address,
      status: WorkSheetStatus.INVALID,
      queueId: null
    })
    const repo = new WorksheetRepository()

    return repo.save(worksheet, emitModelEvents)
  }

  async preSave (data) {
    const worksheetIndex = data.worksheetIndex || await this._getNewIndex()
    // never store this
    return t.update(data, {
      $merge: {
        worksheetIndex
      },
      ownerContacts: { $set: [] },
      relatedBuildings: { $set: [] },
      relatedOwners: { $set: [] }
    })
  }

  async _findBySourceAndReference (source, worksheetIndex) {
    const qb = this.getQueryBuilder()
      .where('queueId IS NULL')
      .where('status = \'OPEN\' OR status = \'LOOKING_MEETING\'')
      .order('t.worksheetIndex')
      .limit(1)

    Object.keys(source).forEach(key => {
      const value = source[ key ]
      if (!_isNil(value)) {
        qb.where(`t.buildingAddress.${key} IS NOT MISSING`)
        qb.where(`t.buildingAddress.${key} = ?`, value)
      }
    })

    if (worksheetIndex) {
      qb.where('t.worksheetIndex IS NOT MISSING')
      qb.where('t.worksheetIndex > ?', worksheetIndex)
    }

    try {
      const promise = Promise.resolve(this.query(qb))
      const result = await promise.timeout(3000)
      return result
    } catch (e) {
      if (e instanceof Promise.TimeoutError) {
        return Promise.resolve(this.query(qb)).timeout(3000)
      } else {
        throw e
      }
    }
  }

  async _getNewIndex () {
    const counter = this.getCounter()
    return counter.count(this.getType(), 1)
  }

  /**
   * Attaches related building objects to a worksheet
   * @param worksheet
   * @returns {Promise<*>}
   */
  async worksheetWithRelatedBuildings (worksheet) {
    let updatedWorksheet = worksheet
    if (worksheet.relatedBuildingIds.length > 0) {
      const buildingRepo = new BuildingRepository()
      const idsText = `[${worksheet.relatedBuildingIds.map(id => `'${id}'`).join(', ')}]`
      const rbQb = await buildingRepo.getQueryBuilder().where(`id IN ${idsText}`)
      const relatedBuildings = await buildingRepo.query(rbQb)
      updatedWorksheet = t.update(worksheet, { relatedBuildings: { $set: relatedBuildings } })
    }

    return updatedWorksheet
  }

  async list (query = {}) {
    const params = new WorksheetListQuery(query)
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset)
    const qbCount = this.getQueryBuilder('count')

    if (params.status) {
      qb.where('status = ?', params.status)
      qbCount.where('status = ?', params.status)
    }

    if (params.viewedAt) {
      addDateQueryToBuilder(qb, 'viewedAt', params.viewedAt)
      addDateQueryToBuilder(qbCount, 'viewedAt', params.viewedAt)
    } else {
      addBetweenQueryToBuilder(qb, 'viewedAt', params.viewedBetween)
      addBetweenQueryToBuilder(qbCount, 'viewedAt', params.viewedBetween)
    }

    if (params.ownerName) {
      qb.where('_relatedTo = ?', params.ownerName)
      qbCount.where('_relatedTo = ?', params.ownerName)
    }

    const total = await this.countQuery(qbCount)
    let results = await this.query(qb)

    results = await Promise.map(results, (worksheet) => this.worksheetWithRelatedBuildings(worksheet))

    return fromJSON({ total, results }, t.WorkSheetLitResponse)
  }

  /**
   * Find all worksheets with a particular queue id.
   * @param queueId
   * @returns {Promise<Array<Worksheet>>}
   */
  async findWorksheetsByQueueId (queueId) {
    const qb = this
      .getQueryBuilder()
      .where('queueId = ?', queueId)

    return this.query(qb)
  }

  /**
   * Sets to null the queue id of an array of worksheets ids.
   * @returns {Promise<void>}
   */
  async updateQueueId (worksheetIds) {
    const bucket = this.getBucketName()
    const cleanQueueIds = N1qlQuery
      .fromString(`UPDATE ${bucket} t SET queueId = null WHERE META().id IN ${JSON.stringify(worksheetIds)}`)

    return this.queryRaw(cleanQueueIds)
  }

  /**
   * Searches worksheets using full text search tool from current database.
   * @param {Object} query
   * @property query.keyword - the word to be searched
   * @property query.limit - the limit of the results, default : 20
   * @returns {Promise<WorksheetSearchResponse>}
   */
  async searchWorksheets (query) {
    let results = []
    const params = new WorksheetSearchQuery(query)
    const qs = this.getSearchBuilder(params.query)
    qs.limit(Number(params.limit))

    const searchResult = await this.search(qs)
    const worksheetIds = _map(searchResult, 'id')

    if (worksheetIds.length) {
      results = await Promise.map(worksheetIds, (worksheetId) => this.findByIdWIthIncludes(worksheetId))
    }
    return fromJSON({ results }, WorksheetSearchResponse)
  }

  /**
   * Attaches related owners objects to a worksheet
   * @param worksheet
   * @returns {Promise<*>}
   */
  static async worksheetWithRelatedOwners (worksheet) {
    let updatedWorksheet = worksheet

    if (worksheet.relatedOwnerIds.length > 0) {
      const ownerRepository = new OwnerRepository()
      const relatedOwners = await ownerRepository.findByIdWithIncludes(worksheet.relatedOwnerIds)
      updatedWorksheet = t.update(worksheet, {
        relatedOwners: { $set: relatedOwners },
        ownerContacts: { $set: ownersContactViews(relatedOwners, worksheet) }
      })
    }

    return updatedWorksheet
  }

  /**
   * Finds all worksheets with the owners.
   * @returns {Promise<*>}
   */
  async findAllWorksheetsWithOwners (limit, offset) {
    const qb = this.getQueryBuilder()
      .limit(limit || 10)
      .offset(offset || 0)
      .order('worksheetIndex')
    const results = await this.query(qb)

    return Promise.map(results, (worksheet) => WorksheetRepository.worksheetWithRelatedOwners(worksheet))
  }

  /**
   * Find all worksheets with a particular status.
   * @param status
   * @returns {Promise<Array<Worksheet>>}
   */
  async findWorksheetsByStatus (status) {
    const qb = this
      .getQueryBuilder()
      .where('status = ?', status)

    return this.query(qb)
  }

  /**
   * Adds an owner to a worksheet
   * @param worksheet
   * @param owner
   * @returns {Promise<*>}
   */
  async addOnlyOwner (worksheet, owner) {
    const updatedWorksheet = t.update(worksheet, {
      relatedOwnerIds: {
        $set: _uniq(worksheet.relatedOwnerIds.concat([ owner.id ]))
      }
    })

    return this.save(updatedWorksheet)
  }
}
