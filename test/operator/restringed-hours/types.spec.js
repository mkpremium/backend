import { RestringedHours } from '../../../src/operator/restringed-hours/types'

describe('RestringedHours', () => {
  it('able to use correct format', () => {
    const restringedHours = {
      '2019-04-01': [
        { start: '10:00', end: '11:00', description: 'Almorzando' },
        { start: '15:00', end: '18:00', description: 'Estudiando' }
      ],
      '2019-04-05': [
        { start: '10:00', end: '12:00' }
      ]
    }
    RestringedHours({ restringedHours })
  })
})
