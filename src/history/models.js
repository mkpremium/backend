import t from 'tcomb'
import { CouchbaseModel } from '../db/model'
import { getHistoryStruct } from './helper'
import fromJSON from 'tcomb/lib/fromJSON'
import { addDateQueryToBuilder, addBetweenQueryToBuilder } from '../lib/query/helpers'

import './types'

export class History extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = t.History
  }

  async register (eventData) {
    return this.save(getHistoryStruct(eventData))
  }

  static async registerCreate (eventData) {
    const history = new History()
    eventData.type = 'CREATE'
    return history.register(eventData)
  }

  static async registerGet (eventData) {
    const history = new History()
    eventData.type = 'GET'
    return history.register(eventData)
  }

  static async registerUpdate (eventData) {
    const history = new History()
    eventData.type = 'UPDATE'
    return history.register(eventData)
  }

  static async registerDelete (eventData) {
    const history = new History()
    eventData.type = 'DELETE'
    return history.register(eventData)
  }

  static async registerOpen (eventData) {
    const history = new History()
    eventData.type = 'OPEN'
    return history.register(eventData)
  }

  static async registerList (eventData) {
    const history = new History()
    eventData.type = 'LIST'
    return history.register(eventData)
  }

  static async registerTake (eventData) {
    const history = new History()
    eventData.type = 'TAKE'
    return history.register(eventData)
  }

  static async registerRelease (eventData) {
    const history = new History()
    eventData.type = 'RELEASE'
    return history.register(eventData)
  }
}

export class HistoryRepository extends History {
  async list (query = {}) {
    const params = t.HistoryListQuery(query)
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

    return fromJSON({ total, results }, t.HistoryListResponse)
  }
}
