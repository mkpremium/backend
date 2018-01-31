import t from 'tcomb';
import bcrypt from 'bcrypt';
import {sign} from 'jsonwebtoken';
import {CouchbaseModel} from '../db/model';

import {saltFactor, jwt} from '../../config';

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

    const e = new Error('Contraseña o usuario invalido');
    e.code = 401;

    if (!operator) {
      throw e;
    }

    const valid = await bcrypt.compare(password, operator.password);

    if (!valid) {
      throw e;
    }

    return operator;
  }

  async createToken(operator) {
    const payload = {
      operator: operator.id,
      expiresIn: jwt.expiresIn,
      permissions: operator.roles
    };
    return sign(payload, jwt.secret);
  }
}
