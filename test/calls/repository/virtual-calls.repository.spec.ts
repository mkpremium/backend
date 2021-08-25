import { expect } from 'chai'
import { parseStats, VirtualCallsRepository } from '../../../src/calls/repository/virtual-calls.repository'
import { createTestContainer } from '../../create-test-container'

describe('VirtualCallsRepository', () => {
  let repository: VirtualCallsRepository

  beforeEach(async () => {
    repository = (await createTestContainer()).resolve('virtualCallsRepository')
  })

  it('works', async () => {
    expect(repository).to.be.ok
  })

  describe('stats parsing', () => {
    it('parses stats from DB', () => {
      const example = [
        {
          'city': 'BARCELONA',
          'count': 2,
          'ownerResponse': '1'
        },
        {
          'city': 'BARCELONA',
          'count': 9,
          'ownerResponse': '3'
        },
        {
          'city': 'L\'HOSPITALET DE LLOBREGAT',
          'count': 2,
          'ownerResponse': null
        },
        {
          'city': 'BARCELONA',
          'count': 1367,
          'ownerResponse': null
        },
        {
          'city': 'BARCELONA',
          'count': 12,
          'ownerResponse': '2'
        },
        {
          'city': 'Porto',
          'count': 6,
          'ownerResponse': null
        }
      ]

      const result = parseStats(example)

      expect(result).to.deep.equal({
        BARCELONA: {
          no_vende: 12,
          no_propietario: 9,
          vende: 2,
          sin_respuesta: 1367,
          otro: 0,
          total: 1390,
        },
        'L\'HOSPITALET DE LLOBREGAT': {
          no_vende: 0,
          no_propietario: 0,
          vende: 0,
          sin_respuesta: 2,
          otro: 0,
          total: 2,
        },
        'Porto': {
          no_vende: 0,
          no_propietario: 0,
          vende: 0,
          sin_respuesta: 6,
          otro: 0,
          total: 6,
        }
      })
    })
  })
})
