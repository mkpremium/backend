import bcrypt from 'bcrypt'
import { sign } from 'jsonwebtoken'
import _isNil from 'lodash/isNil'
import _omit from 'lodash/omit'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'

import { jwt, saltFactor } from '../../config'
import { CouchbaseModel } from '../db/model'
import { newHttpError } from '../lib/http-error'
import { User as OperatorType, UserProfile, UserRole } from '../types/user'
import { AuthenticatedResponse, OperatorListResponse } from './types'

export const passwordRegex = new RegExp('^(?=.*[A-Za-z])(?=.*\\d).{8,}$')
const Password = t.refinement(t.String, n => passwordRegex.test(n), 'Password')
const NotEmptyString = t.refinement(t.String, n => !_isNil(n), 'NotEmptyString')
export const OperatorRequest = t.struct(
  {
    username: NotEmptyString,
    password: Password,
    email: t.maybe(t.String),
    agentNumber: t.maybe(t.String),
    level: t.maybe(t.Number),
    serviceId: t.maybe(t.String),
    enable: t.Boolean,
    flipperId: t.maybe(t.String),
    roles: t.list(UserRole),

    profile: UserProfile
  },
  {
    name: 'OperatorRequest',
    defaultProps: {
      enable: true,
      roles: [],
      features: [],
      profile: {}
    }
  }
)

export class OperatorRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = OperatorType
  }

  async operatorRestringedHours (operatorId) {
    const operator = await this.findByIdOrThrow(operatorId)
    return operator.restringedHours || {}
  }

  async writeOperatorRestringedHours (operatorId, restringedHours) {
    const operator = await this.findByIdOrThrow(operatorId)
    const updatedOperator = t.update(operator, { restringedHours: { $set: restringedHours } })
    await this.save(updatedOperator)
  }

  static async hashPassword (password) {
    if (/^\$2\w\$\d{2}\$/.test(password)) {
      return password
    }
    const salt = await bcrypt.genSalt(saltFactor)
    return bcrypt.hash(password, salt)
  }

  async preSave (data) {
    await this.unique(data, 'username')

    const password = await OperatorRepository.hashPassword(data.password)
    return t.update(data, {
      password: {
        $set: password
      }
    })
  }

  async createOperator (data) {
    const params = fromJSON(data, OperatorRequest)
    return super.save(params)
  }

  async updateOperator (operator, data) {
    const updatedProfile = t.update(operator.profile, {
      $merge: data.profile || {}
    })
    const updateOperator = t.update(operator, {
      $merge: _omit(data, [ 'profile', 'id' ]),
      profile: { $set: updatedProfile }
    })

    return this.save(updateOperator)
  }

  async createAuthenticatedResponse (operator) {
    const tokenPayload = {
      id: operator.id,
      permissions: operator.roles,
      flipperId: operator.flipperId,
      operator: {
        id: operator.id,
        name: operator.profile.fullName(),
        username: operator.username,
        city: operator.profile.city,
        queueId: operator.profile.queueId,
        email: operator.profile.email,
        language: operator.profile.language
      }
    }

    const token = await OperatorRepository.createToken(tokenPayload)

    return AuthenticatedResponse({
      token,
      access_token: token,
      token_type: 'bearer',
      roles: operator.roles,
      operator: tokenPayload.operator
    })
  }

  async findByIdOrThrow (operatorId) {
    const operator = await this.findById(operatorId)
    if (!operator) {
      throw newHttpError(404, `El operator ${operatorId} no existe`)
    }

    return operator
  }

  static async createToken (payload) {
    const options = {
      expiresIn: jwt.expiresIn
    }

    return sign(payload, jwt.secret, options)
  }

  async listView (query) {
    const queryWithRole = Object.assign({}, query, {
      role: 'BUSINESS',
      enable: true
    })
    return this.list(queryWithRole, t.OperatorListViewResponse, t.OperatorLimitedListQuery)
  }

  async list (query = {}, responseStruct = OperatorListResponse, queryStruct = t.OperatorListQuery) {
    const params = queryStruct(query)
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset)
    const qbCount = this.getQueryBuilder('count')

    if (params.role) {
      qb.where('ANY v IN TOKENS(t.`roles`) SATISFIES v = ? END', params.role)
      qbCount.where('ANY v IN TOKENS(t.`roles`) SATISFIES v = ? END', params.role)
    }

    if (typeof params.enable !== 'undefined') {
      qb.where('enable = ?', params.enable)
    }

    const total = await this.countQuery(qbCount)
    const results = await this.query(qb)

    return fromJSON({ total, results }, responseStruct)
  }

  async addAnAward (operator, code) {
    const newAward = {
      code: code,
      awardedAt: new Date()
    }
    let updatedOperator
    if (operator.awards) {
      updatedOperator = t.update(operator, { awards: { $push: [ newAward ] } })
    } else {
      updatedOperator = t.update(operator, { awards: { $set: [ newAward ] } })
    }

    return this.save(updatedOperator)
  }
}
