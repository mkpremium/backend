import _ from 'lodash'
import _every from 'lodash/every'
import _find from 'lodash/find'
import _get from 'lodash/get'
import _head from 'lodash/head'
import _isNil from 'lodash/isNil'
import _some from 'lodash/some'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'

import { CouchbaseModel } from '../../db/model'
import { newHttpError } from '../../lib/http-error'
import { addBetweenQueryToBuilder, addDateQueryToBuilder } from '../../lib/query/helpers'
import { OwnerStatus } from '../../owner/owner'
import { ScheduledEventsRepository } from '../../scheduled-events/repository/schedule-events.repository'
import { ScheduledEventType } from '../../scheduled-events/types'
import { OperatorStats } from '../../stats/models'
import { OperatorActions } from '../../stats/types'
import { setStatus, Worksheet, WorkSheetStatus } from '../domain/worksheet'
import { QueueRequestAction, WorksheetListQuery } from '../types'

const QueueRequestParamsBase = t.struct(
  {
    action: t.maybe(t.enums(QueueRequestAction))
  },
  {
    name: 'QueueRequest',
    defaultProps: {
      action: QueueRequestAction.TAKE
    }
  }
)

const WorkSheetListResponse = t.struct(
  {
    total: t.Number,
    results: t.list(Worksheet)
  },
  {
    name: 'WorksheetListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
)

export const QueueRequestParams = t.union([
  QueueRequestParamsBase,
  QueueRequestParamsBase.extend({ queueItemId: t.String }),
  QueueRequestParamsBase.extend({ worksheetId: t.String })
])

QueueRequestParams.dispatch = function (x) {
  switch (x.action) {
    case QueueRequestAction.NEXT:
      return QueueRequestParamsBase
    case QueueRequestAction.RELEASE:
      return QueueRequestParamsBase.extend(
        {
          worksheetId: t.String
        }
      )
    default:
      return QueueRequestParamsBase.extend(
        {
          queueItemId: t.String
        }
      )
  }
}

function canRegisterVerified (worksheet, newStatus, operatorId) {
  if (!operatorId) {
    return false
  }

  if (worksheet.status === newStatus) {
    return false
  }

  return newStatus === WorkSheetStatus.AVAILABLE
}

export class LegacyWorksheetRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = Worksheet
  }

  async findByIdOrThrow (worksheetId) {
    const worksheet = await this.findById(worksheetId)
    if (!worksheet) {
      throw newHttpError(404, `La hoja de trabajo ${worksheetId} no existe`)
    }

    return worksheet
  }

  async findMeetings (worksheetId) {
    const meetingRepo = new ScheduledEventsRepository()
    const qb = meetingRepo.getQueryBuilder()
    qb.where('type = ?', ScheduledEventType.MEETINGS)
    qb.where('event.worksheetId = ?', worksheetId)
    return meetingRepo.query(qb)
  }

  async findWorksheetByBuilding (buildingId) {
    const qb = this.getQueryBuilder()
      .where('t.`relatedBuildingIds`[0] = ?', buildingId)

    const results = await this.query(qb)

    if (results.length === 0) {
      throw new (class extends Error {
        constructor () {
          super('No Worksheet found for building')
          this.buildingId = buildingId
        }
      })()
    }

    return fromJSON(_head(results), Worksheet)
  }

  /**
   * @param {NegotiationStatus} negotiationStatus
   * @returns {string}
   */
  static mapNegotiationStatusToWorksheetStatus (negotiationStatus) {
    switch (negotiationStatus) {
      case 'DESCARTADO':
        return WorkSheetStatus.PUBLIC
      case 'NO VENDE':
        return WorkSheetStatus.NO_SALE
      case 'YA VENDIO':
        return WorkSheetStatus.ALREADY_SOLD
      case 'VENDIDO':
        return WorkSheetStatus.INVALID
      default:
        return WorkSheetStatus.MEETING
    }
  }

  async calculateFixedStatus (worksheet) {
    const relatedBuilding = worksheet.relatedBuildings[ 0 ]
    if (relatedBuilding.negotiationStatus) {
      return LegacyWorksheetRepository.mapNegotiationStatusToWorksheetStatus(relatedBuilding.negotiationStatus)
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
      case _every(ownersStatus, ({ status }) => [
        OwnerStatus.ERROR,
        OwnerStatus.WITHOUT_CONTACT,
        OwnerStatus.WITHOUT_PHONE_CONTACT ].includes(status)):
        return WorkSheetStatus.INVALID
      case _some(ownersStatus,
        ({ status, isConfirmedByOperator }) => isConfirmedByOperator && status === OwnerStatus.VERIFIED):
        return WorkSheetStatus.AVAILABLE
      default:
        const meetings = await this.findMeetings(worksheet.id)
        if (meetings.length > 0) {
          return WorkSheetStatus.MEETING
        }

        return worksheet.status
    }
  }

  async updateStatus (worksheetId, operatorId) {
    const worksheetData = await this.findByIdOrThrow(worksheetId)
    const worksheet = fromJSON(worksheetData, Worksheet)
    const newStatus = await this.calculateFixedStatus(worksheet)
    const updatedWorksheet = setStatus(worksheet, newStatus)
    if (canRegisterVerified(worksheet, newStatus, operatorId)) {
      await OperatorStats.registerAction(operatorId, OperatorActions.VERIFIED_OWNER)
    }

    return this.save(updatedWorksheet)
  }

  async worksheetStats () {
    const bucket = this.getBucketName()

    const query = `SELECT t.buildingAddress.province, t.status, COUNT(*) as count
                   FROM ${bucket} t
                   WHERE t._documentType = 'worksheet' AND t.status IS NOT MISSING
                   GROUP BY t.status, t.buildingAddress.province`

    const result = await this.queryRaw(query)

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

    const baseQuery = `SELECT COUNT(*) as count
                       FROM ${bucket} t
                       WHERE (t._documentType = 'worksheet')
                         AND (queueId IS NULL)
                         AND (status = 'OPEN'
                          OR status = 'LOOKING_MEETING') ${filter}`
    const results = await this.queryRaw(baseQuery)
    return _get(results, '0.count', 0)
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

    return fromJSON({ total, results }, WorkSheetListResponse)
  }
}
