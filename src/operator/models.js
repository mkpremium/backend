import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import _omit from 'lodash/omit'
import _get from 'lodash/get'
import bcrypt from 'bcrypt'
import { sign, verify } from 'jsonwebtoken'
import { CouchbaseModel } from '../db/model'

import { saltFactor, jwt } from '../../config'
import { newHttpError } from '../lib/http-error'
import { OperatorRoles } from '../types/operator'
import { OperatorStatsRepository } from '../stats/models'
import { OperatorActions } from '../stats/types'
import { firebaseSetup, firebaseUserAccount } from '../firebase'
import { bearerTokenExtractor } from '../middleware/jwt'

const ListStats = t.struct(
  {
    role: t.enums.of([OperatorRoles.OPERATOR, OperatorRoles.BUSINESS]),
    view: t.enums.of(['day', 'total'])
  },
  {
    name: 'ListStats',
    defaultProps: {
      role: OperatorRoles.OPERATOR,
      view: 'total'
    }
  }
)

function defaultCounters () {
  const mappedCounters = {}
  Object.values(OperatorActions).map(statKey => {
    mappedCounters[statKey] = 0
  })

  return mappedCounters
}

export class Operator extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = t.Operator
  }

  async operatorRestringedHours (operatorId) {
    const operator = await this.findByIdOrThrow(operatorId)
    return operator.restringedHours || {}
  }

  async writeOperatorRestringedHours (operatorId, restringedHours) {
    const operator = await this.findByIdOrThrow(operatorId)
    const updatedOperator = t.update(operator, { restringedHours: { $set: restringedHours } })
    await this.save(updatedOperator)
    await firebaseUserAccount(updatedOperator)
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

    const password = await Operator.hashPassword(data.password)
    return t.update(data, {
      password: {
        $set: password
      }
    })
  }

  async createOperator (data) {
    const params = fromJSON(data, t.OperatorRequest)
    const operator = await super.save(params)
    await firebaseUserAccount(operator)
    return operator
  }

  async updateOperator (operator, data) {
    t.OperatorUpdateRequest(data)
    const updatedProfile = t.update(operator.profile, {
      $merge: data.profile || {}
    })
    const updateOperator = t.update(operator, {
      $merge: _omit(data, ['profile', 'id']),
      profile: { $set: updatedProfile }
    })

    const updatedOperator = await this.save(updateOperator)
    const newCity = JSON.stringify(_get(operator, 'profile.city')) !== JSON.stringify(_get(data, 'profile.city'))
    await firebaseUserAccount(updatedOperator, newCity)
    return updatedOperator
  }

  async createAuthenticatedResponse (operator) {
    const tokenPayload = {
      id: operator.id,
      permissions: operator.roles,
      operator: {
        id: operator.id,
        name: operator.profile.fullName(),
        username: operator.username,
        city: operator.profile.city,
        queueId: operator.profile.queueId,
        email: operator.profile.email
      }
    }

    const { refreshToken } = await OperatorRefreshTokenRepository.createToken(operator)
    const token = await OperatorRepository.createToken(tokenPayload)
    const firebase = await firebaseSetup(operator)

    return t.AuthenticatedResponse({
      refreshToken,
      token,
      access_token: token,
      token_type: 'bearer',
      roles: operator.roles,
      operator: tokenPayload.operator,
      firebase
    })
  }
}

export class OperatorRepository extends Operator {
  async findByIdOrThrow (operatorId) {
    const owner = await this.findById(operatorId)
    if (!owner) {
      throw newHttpError(404, `El operator ${operatorId} no existe`)
    }

    return owner
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
    const [operator] = await this.query(qb)

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

  async updateProfile (operator, params) {
    const updatedProfile = t.update(operator.profile, { $merge: params })
    const updateOperator = t.update(operator, { profile: { $set: updatedProfile } })
    return this.updateOperator(operator, updateOperator)
  }

  async list (query = {}, responseStruct = t.OperatorListResponse, queryStruct = t.OperatorListQuery) {
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
          const counters = results[operator.id] || {}
          return { operator, onLine: operator.online, counters }
        })
      case 'total':
      default:
        return operators.results.map(operator => {
          const counters = results[operator.id] || defaultValues
          return { operator, onLine: operator.online, counters }
        })
    }
  }

  async listWithPerformance (params) {
    const operators = await this.list({ role: OperatorRoles.OPERATOR })
    const statsRepo = new OperatorStatsRepository()

    const results = await statsRepo.getPerformance(params)

    return operators.results.map(operator => ({
      operator,
      performance: results[operator.id]
    }))
  }

  async getOperatorsWithProfitGoal () {
    const bucket = this.getBucketName()
    const currentYear = new Date().getFullYear()

    const operatorsProfitGoals = `
      select * from ${bucket} t
      where t._documentType = 'operator'
      AND t.profitGoal IS NOT NULL
      AND DATE_PART_STR(t.profitGoal.updatedAt,'year') = ${currentYear}
      AND enable = true
      AND (ANY V IN roles SATISFIES V = 'BUSINESS' END)
      `

    return this.raw(operatorsProfitGoals)
  }

  async addAnAward (operator, code) {
    const newAward = {
      code: code,
      awardedAt: new Date()
    }
    let updatedOperator
    if (operator.awards) {
      updatedOperator = t.update(operator, { awards: { $push: [newAward] } })
    } else {
      updatedOperator = t.update(operator, { awards: { $set: [newAward] } })
    }

    return this.save(updatedOperator)
  }
}

export class OperatorRefreshTokenRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = t.OperatorRefreshToken
  }

  static async createRefreshToken (payload) {
    const options = {
      expiresIn: jwt.refreshTokenExpiresIn
    }

    return sign(payload, jwt.secret, options)
  }

  static async decodeToken (req) {
    const repo = new OperatorRefreshTokenRepository()
    const token = bearerTokenExtractor(req)
    const options = {}

    await verify(token, jwt.secret, options)
    return repo.findOrThrow(token)
  }

  async findOrThrow (rawToken) {
    const qb = this.getQueryBuilder()
    qb.where('refreshToken = ?', rawToken)
      .limit(1)
    const [refreshToken] = await this.query(qb)
    if (!refreshToken) {
      throw newHttpError(401, 'El token es invalido')
    }
    return refreshToken
  }

  static async createToken (operator) {
    const repo = new OperatorRefreshTokenRepository()
    const operatorId = operator.id
    const refreshToken = await OperatorRefreshTokenRepository.createRefreshToken({ id: operatorId })
    return repo.save({
      operatorId,
      refreshToken
    }, false)
  }

  static async consume (id) {
    const repo = new OperatorRefreshTokenRepository()
    const qb = repo.getQueryBuilder('delete')
    qb.where('id = ?', id)
    return repo.deleteQuery(qb)
  }
}
