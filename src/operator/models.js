import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import _find from 'lodash/find';
import _filter from 'lodash/filter';
import _omit from 'lodash/omit';
import _get from 'lodash/get';
import bcrypt from 'bcrypt';
import {sign, verify} from 'jsonwebtoken';
import {CouchbaseModel} from '../db/model';

import {saltFactor, jwt} from '../../config';
import {newHttpError} from '../lib/http-error';
import {OperatorRoles} from '../types/operator';
import {OperatorStatsRepository} from '../stats/models';
import {OperatorActions} from '../stats/types';
import {firebaseSetup, firebaseUserAccount} from '../firebase';
import {bearerTokenExtractor} from '../middleware/jwt';

function findOrZero(counters, action) {
  const result = _find(counters, {action});
  return result ? result.count : 0;
}

export class Operator extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Operator;
  }

  static async hashPassword(password) {
    if (/^\$2a\$\d{2}\$/.test(password)) {
      return password;
    }
    const salt = await bcrypt.genSalt(saltFactor);
    return bcrypt.hash(password, salt);
  }

  async preSave(data) {
    // TODO: optimize on near future to one single query
    await this.unique(data, 'username');
    await this.unique(data, 'agentNumber');

    const password = await Operator.hashPassword(data.password);
    return t.update(data, {
      password: {
        $set: password
      }
    });
  }

  async save(data, newCity) {
    const operator = await super.save(data);
    await firebaseUserAccount(operator, newCity);
    return operator;
  }

  async createAuthenticatedResponse(operator) {
    const tokenPayload = {
      id: operator.id,
      permissions: operator.roles,
      operator: {
        id: operator.id,
        name: operator.profile.fullName(),
        username: operator.username,
        city: operator.profile.city
      }
    };

    const {refreshToken} = await OperatorRefreshTokenRepository.createToken(operator);
    const token = await OperatorRepository.createToken(tokenPayload);
    const firebase = await firebaseSetup(operator);

    return t.AuthenticatedResponse({
      refreshToken,
      token,
      roles: operator.roles,
      operator: tokenPayload.operator,
      firebase
    });
  }
}

export class OperatorRepository extends Operator {
  async findByIdOrThrow(operatorId) {
    const owner = await this.findById(operatorId);
    if (!owner) {
      throw newHttpError(404, `El operator ${operatorId} no existe`);
    }

    return owner;
  }

  async findByCredential(data) {
    const {username, password} = new t.Credentials(data);
    const qb = this.getQueryBuilder()
      .where('username = ?', username)
      .limit(1);
    const [operator] = await this.query(qb);

    if (!operator) {
      throw newHttpError(401, 'Contraseña o usuario incorrecto');
    }

    if (!operator.enable) {
      throw newHttpError(401, 'Cuenta desactivada, comuníquese con el administrador');
    }

    const valid = await bcrypt.compare(password, operator.password);

    if (!valid) {
      throw newHttpError(401, 'Contraseña o usuario incorrecto');
    }

    return fromJSON(operator, this.Struct);
  }

  static async createToken(payload) {
    const options = {
      expiresIn: jwt.expiresIn
    };

    return sign(payload, jwt.secret, options);
  }

  async listView(query) {
    const queryWithRole = Object.assign({}, query, {
      role: 'BUSINESS',
      enable: true
    });
    return this.list(queryWithRole, t.OperatorListViewResponse, t.OperatorLimitedListQuery);
  }

  async updateProfile(operator, params) {
    const newCity = _get(operator, 'profile.city') !== _get(params, 'profile.city');
    const updatedProfile = t.update(operator.profile, {$merge: params});
    const updateOperator = t.update(operator, {profile: {$set: updatedProfile}});
    return this.save(updateOperator, newCity);
  }

  async update(operator, params) {
    const updatedProfile = t.update(operator.profile, {
      $merge: params.profile
    });
    const updateOperator = t.update(operator, {
      $merge: _omit(params, ['profile']),
      profile: {$set: updatedProfile}
    });

    return this.save(updateOperator);
  }

  async list(query = {}, responseStruct = t.OperatorListResponse, queryStruct = t.OperatorListQuery) {
    const params = queryStruct(query);
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset);
    const qbCount = this.getQueryBuilder('count');

    if (params.role) {
      qb.where('ANY v IN t.`roles` SATISFIES v = ? END', params.role);
      qbCount.where('ANY v IN t.`roles` SATISFIES v = ? END', params.role);
    }

    if (typeof params.enable !== 'undefined') {
      qb.where('enable = ?', params.enable);
    }

    const total = await this.countQuery(qbCount);
    const results = await this.query(qb);

    return fromJSON({total, results}, responseStruct);
  }

  async listWithStats() {
    const operators = await this.list({role: OperatorRoles.OPERATOR});
    const statsRepo = new OperatorStatsRepository();

    const results = await statsRepo.getOverAll();

    return operators.results.map(operator => {
      const stats = _filter(results, {operatorId: operator.id});
      const counters = {
        callsMade: findOrZero(stats, OperatorActions.CALL),
        callsAnswered: findOrZero(stats, OperatorActions.CALL_ANSWERED),
        verifiedOwners: findOrZero(stats, OperatorActions.VERIFIED_OWNER),
        meetingsMade: findOrZero(stats, OperatorActions.MEETING)
      };
      return t.OperatorResults({operator, counters});
    });
  }
}

export class OperatorRefreshTokenRepository extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.OperatorRefreshToken;
  }

  static async createRefreshToken(payload) {
    const options = {
      expiresIn: jwt.refreshTokenExpiresIn
    };

    return sign(payload, jwt.secret, options);
  }

  static async decodeToken(req) {
    const repo = new OperatorRefreshTokenRepository();
    const token = bearerTokenExtractor(req);
    const options = {};

    await verify(token, jwt.secret, options);
    return repo.findOrThrow(token);
  }

  async findOrThrow(rawToken) {
    const qb = this.getQueryBuilder();
    qb.where('refreshToken = ?', rawToken)
      .limit(1);
    const [refreshToken] = await this.query(qb);
    if (!refreshToken) {
      throw newHttpError(401, 'El token es invalido');
    }
    return refreshToken;
  }

  static async createToken(operator) {
    const repo = new OperatorRefreshTokenRepository();
    const operatorId = operator.id;
    const refreshToken = await OperatorRefreshTokenRepository.createRefreshToken({id: operatorId});
    return repo.save({
      operatorId,
      refreshToken
    }, false);
  }

  static async consume(id) {
    const repo = new OperatorRefreshTokenRepository();
    const qb = repo.getQueryBuilder('delete');
    qb.where('id = ?', id);
    return repo.deleteQuery(qb);
  }
}
