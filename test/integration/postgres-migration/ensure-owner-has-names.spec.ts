import { ensureOwnerHasNames } from '../../../src/owner/service/import-owner-command-handler'

describe('ensureOwnerHasNames', () => {
  it('returns owner with names', () => {
    ensureOwnerHasNames({
      id: '089e886e-0223-4ad2-b665-b94f75ead5c1',
      name: null,
      type: 'NINGUNO',
      person: {
        name: 'Tramitem',
        contacts: [{
          id: 'fd4ccf98-d586-4cec-8473-63dd74e23a05',
          type: 'TELEFONO',
          value: '604965536',
          status: 'GOOD'
        }],
        firstName: 'Tramitem',
        firstSurname: '',
        secondSurname: '',
        documentNumber: null
      },
      status: 'VERIFICADO',
      buildingId: '0b30b5df-0029-4b4b-a6d5-35b485131887',
      featuredContact: null
    })
  })
})
