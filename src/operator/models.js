import t from 'tcomb';
import fromJSON from 'tcomb/lib/fromJSON';
import bcrypt from 'bcrypt';
import {sign} from 'jsonwebtoken';
import {CouchbaseModel} from '../db/model';

import {saltFactor, jwt} from '../../config';
import {newHttpError} from '../lib/http-error';

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
}

export class OperatorRepository extends Operator {
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

  async list(query = {}) {
    const params = t.OperatorListQuery(query);
    const qb = this.getQueryBuilder('select')
      .limit(params.limit)
      .offset(params.offset);
    const qbCount = this.getQueryBuilder('count');

    if (params.role) {
      qb.where('ANY v IN t.`roles` SATISFIES v = ? END', params.role);
      qbCount.where('ANY v IN t.`roles` SATISFIES v = ? END', params.role);
    }

    const total = await this.countQuery(qbCount);
    const results = await this.query(qb);

    return fromJSON({total, results}, t.OperatorListResponse);
  }
}
