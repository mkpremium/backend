import bcrypt from 'bcrypt'
import { sign } from 'jsonwebtoken'
import _omit from 'lodash/omit'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'

import { jwt, saltFactor } from '../../config'
import { CouchbaseModel } from '../db/model'
import { newHttpError } from '../lib/http-error'
import { OperatorStatsRepository } from '../stats/models'
import { OperatorActions } from '../stats/types'
import { User as OperatorType, UserRoles } from '../types/user'
import { OperatorRefreshTokenRepository, OperatorRequest } from './operatorRefreshTokenRepository'
import { OperatorListResponse } from './types'

const ListStats = t.struct(
  {
    role: t.enums.of([ UserRoles.OPERATOR, UserRoles.BUSINESS ]),
    view: t.enums.of([ 'day', 'total' ])
  },
  {
    name: 'ListStats',
    defaultProps: {
      role: UserRoles.OPERATOR,
      view: 'total'
    }
  }
)

function defaultCounters () {
  const mappedCounters = {}
  Object.values(OperatorActions).map(statKey => {
    mappedCounters[ statKey ] = 0
  })

  return mappedCounters
}

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

    const { refreshToken } = await OperatorRefreshTokenRepository.createToken(operator)
    const token = await OperatorRepository.createToken(tokenPayload)

    return t.AuthenticatedResponse({
      refreshToken,
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

  static async setOnline (operatorId, online) {
    const repo = new OperatorRepository()
    const operator = await repo.findById(operatorId)
    if (operator) {
      const updatedOperator = t.update(operator, { online: { $set: online } })
      await repo.save(updatedOperator, false)
    }
  }

  async findByCredential (data) {
    const { username, password } = new t.Credentials(data)
    const qb = this.getQueryBuilder()
      .where('username = ?', username)
      .limit(1)
    const [ operator ] = await this.query(qb)

    if (!operator) {
      throw newHttpError(401, 'Contraseña o usuario incorrecto')
    }

    if (!operator.enable) {
      throw newHttpError(401, 'Cuenta desactivada, comuníquese con el administrador')
    }

    const valid = await bcrypt.compare(password, operator.password)

    if (!valid) {
      throw newHttpError(401, 'Contraseña o usuario incorrecto')
    }

    return fromJSON(operator, this.Struct)
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

  async listWithStats (params) {
    const args = ListStats(params)
    const operators = await this.list({ role: args.role })
    const statsRepo = new OperatorStatsRepository()

    const results = await statsRepo.getStats(params)
    const defaultValues = defaultCounters()

    switch (args.view) {
      case 'day':
        return operators.results.map(operator => {
          const counters = results[ operator.id ] || {}
          return { operator, onLine: operator.online, counters }
        })
      case 'total':
      default:
        return operators.results.map(operator => {
          const counters = results[ operator.id ] || defaultValues
          return { operator, onLine: operator.online, counters }
        })
    }
  }

  async listWithPerformance (params) {
    const operators = await this.list({ role: UserRoles.OPERATOR })
    const statsRepo = new OperatorStatsRepository()

    const results = await statsRepo.getPerformance(params)

    return operators.results.map(operator => ({
      operator,
      performance: results[ operator.id ]
    }))
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
