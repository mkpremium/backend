import { Portugal2021SourceBuilding } from '../../../src/building/repository/portugal2021-buildings.repository'

export function buildSourceBuilding (overrides: Partial<Portugal2021SourceBuilding> = {}) {
  return {
    ...sourceBuildingPrototype,
    ...overrides,
  }
}

const sourceBuildingPrototype: Portugal2021SourceBuilding = {
  _documentType: 'portugal-2021-building',
  address: {
    cadastreReferenceA: '',
    cadastreReferenceAM: '5433',
    city: 'PORTO',
    floorArea: 320,
    militaryGeo: {
      x: 156312,
      y: 467427
    },
    neighborhood: 'RAMALDE',
    number: 3,
    street: 'Antonio da Silva Marinho',
    type: 'Rua',
    usage: 'COMERCIO'
  },
  id: '44d88260-af60-4eb6-bf19-93a95c254b33',
  owners: [],
  slug: '5433-nan-RUA-Antonio_da_Silva_Marinho-3-RAMALDE-PORTO',
  status: 'INBOX',
  statusChangedAt: new Date(),
}
