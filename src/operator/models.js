import { CouchbaseModel } from '../db/model'
import { newHttpError } from '../lib/http-error'
import { User as OperatorType } from '../types/user'

export class OperatorRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = OperatorType
  }

  async findByIdOrThrow (operatorId) {
    const operator = await this.findById(operatorId)
    if (!operator) {
      throw newHttpError(404, `El operator ${operatorId} no existe`)
    }

    return operator
  }
}
