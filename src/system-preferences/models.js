import { CouchbaseModel } from '../db/model'
import { SystemPreferences } from './types'

const systemPreferencesKey = 'system-preferences'

export class SystemPreferencesRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = SystemPreferences
  }

  async getPreferences (key = systemPreferencesKey) {
    const pref = await this.findById(key)

    // return default value
    if (!pref) {
      return SystemPreferences({})
    }

    return pref
  }

  static async getPreferences (key) {
    const repo = new SystemPreferencesRepository()
    return repo.getPreferences(key)
  }

  static async writePreferences (pref) {
    const repo = new SystemPreferencesRepository()
    return repo.save(SystemPreferences(pref))
  }
}
