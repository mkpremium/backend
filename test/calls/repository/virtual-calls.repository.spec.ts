import { expect } from 'chai'
import { parseStats, VirtualCallsRepository } from '../../../src/calls/repository/virtual-calls.repository'
import { createTestContainer } from '../../create-test-container'
import { callBuilder } from '../call.builder'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'

describe('VirtualCallsRepository', () => {
  let repository: VirtualCallsRepository

  beforeEach(async () => {
    repository = (await createTestContainer()).resolve('virtualCallsRepository')
  })

  it('returns last call to given phone number', async () => {
    const testPhone = '+34666666666'
    await repository.save(callBuilder({ id: 'first-call', createdAt: new Date(), phoneNumber: testPhone }).build())
    await repository.save(callBuilder({ id: 'second-call', createdAt: new Date(), phoneNumber: testPhone }).build())

    pipe(
      repository.lastCallTo(testPhone),
      TE.orElse(error => expect.fail(error.message)),
      TE.map(lastCall => {
        expect(lastCall.id).to.be.equal('second-call')
      })
    )
  })
})

describe('stats parsing', () => {
  it('parses stats from DB', () => {
    const example = [
      {
        'province': 'BARCELONA',
        'count': 2,
        'ownerResponse': '1'
      },
      {
        'province': 'BARCELONA',
        'count': 9,
        'ownerResponse': '3'
      },
      {
        'province': 'BARCELONA',
        'count': 1367,
        'ownerResponse': null
      },
      {
        'province': 'BARCELONA',
        'count': 12,
        'ownerResponse': '2'
      },
      {
        'province': 'Porto',
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
