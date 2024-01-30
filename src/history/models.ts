import { CouchbaseModel } from '../db/model'
import { getHistoryStruct } from './helper'
import fromJSON from 'tcomb/lib/fromJSON'
import { addBetweenQueryToBuilder, addDateQueryToBuilder } from '../lib/query/helpers'

import './types'
import { HistoryListQuery, HistoryListResponse, HistoryStruct } from './types'

export class History extends CouchbaseModel {
  Struct = HistoryStruct
}

export class HistoryRepository extends History {
  async list (query = {}) {
    const params = HistoryListQuery(query)
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset)
    const qbCount = this.getQueryBuilder('count')

    if (params.operatorId) {
      qb.where('operatorId = ?', params.operatorId)
      qbCount.where('operatorId = ?', params.operatorId)
    }

    if (params.actionType) {
      qb.where('type = ?', params.actionType)
      qbCount.where('type = ?', params.actionType)
    }

    if (params.modelName) {
      qb.where('modelName = ?', params.modelName)
      qbCount.where('modelName = ?', params.modelName)
    }

    if (params.createdAt) {
      addDateQueryToBuilder(qb, 'createdAt', params.createdAt)
      addDateQueryToBuilder(qbCount, 'createdAt', params.createdAt)
    } else if (params.createdBetween) {
      addBetweenQueryToBuilder(qb, 'createdAt', params.createdBetween)
      addBetweenQueryToBuilder(qbCount, 'createdAt', params.createdBetween)
    }
    const total = await this.countQuery(qbCount)
    const results = await this.query(qb)

    return fromJSON({ total, results }, HistoryListResponse)
  }
}
