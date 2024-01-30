import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'

import { CouchbaseModel } from '../../db/model'
import { newHttpError } from '../../lib/http-error'
import { addBetweenQueryToBuilder, addDateQueryToBuilder } from '../../lib/query/helpers'
import { ListQuery } from '../../types/params'
import { StringSplitList } from '../../types/refinement'
import { Worksheet, WorkSheetStatusEnum } from '../domain/worksheet'
import { QueueRequestAction } from '../types'

export const WorksheetListQuery = ListQuery.extend(
  {
    status: t.maybe(WorkSheetStatusEnum),
    viewedAt: t.maybe(t.String),
    viewedBetween: t.maybe(StringSplitList),
    ownerName: t.maybe(t.String)
  },
  {
    name: 'WorksheetListQuery',
    defaultProps: {
      viewedBetween: ','
    }
  }
)

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

export class LegacyWorksheetRepository extends CouchbaseModel {
  protected Struct = Worksheet

  async findByIdOrThrow (worksheetId: string) {
    const worksheet = await this.findById(worksheetId)
    if (!worksheet) {
      throw newHttpError(404, `La hoja de trabajo ${worksheetId} no existe`)
    }

    return worksheet
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
