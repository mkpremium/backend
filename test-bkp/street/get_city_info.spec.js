import request from 'supertest'

import app from '../../src/app'
import {
  deleteAll,
  operatorCreateStreetManager,
  operatorLogin
} from '../../test/common'
import { nonEquality, oldAppResponse } from '../../test/common-asserts'
import { resolve } from 'path'
import { MigrateModel } from '../../src/migration/lib/migrate-model'

describe.skip('street.routes', () => {
  let authenticatedManager

  before(async () => {
    await deleteAll()
    await operatorCreateStreetManager()
    authenticatedManager = await operatorLogin(app, { username: 'street_manager', password: 'Passw0rd' })

    const migrateNeighborhoods = new MigrateModel('neighborhood', resolve(__dirname, '../../csv/Barrios.csv'), app, { delimiter: ',' })
    await migrateNeighborhoods.run()
    const migrateCity = new MigrateModel('city', resolve(__dirname, '../../csv/Ciudad.csv'), app, { delimiter: ',' })
    await migrateCity.run()
  })

  describe('POST /api/getCityInfo', () => {
    it('200 Operación exitosa', async () => {
      const { body } = await request(app)
        .post('/api/getCityInfo')
        .send({
          appToken: authenticatedManager.token,
          city: 'BARCELONA'
        })
        .expect(200)

      oldAppResponse(body, false)
      nonEquality(body.Message, [])
    })
  })
})
