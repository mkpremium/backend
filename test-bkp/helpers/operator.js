import app from '../../src/app'
import { defaultPassword, operatorCreate, operatorLogin } from '../../test/common'

export class OperatorHelper {
  static async create (role) {
    switch (role) {
      case 'operator':
      default:
        return operatorCreate()
    }
  }

  static async createAndLogin (role = 'operator') {
    const operator = await OperatorHelper.create(role)
    return operatorLogin(app, {
      username: operator.username,
      password: defaultPassword
    })
  }
}
