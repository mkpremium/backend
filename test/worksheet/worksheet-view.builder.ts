import { CallcenterView, WorksheetViewProps } from '../../src/worksheet/repository/worksheet.repository'

export const worksheetViewPrototype: WorksheetViewProps = {
  id: 'test-worksheet-id',
  status: 'OPEN',
  building: {
    id: 'test-worksheet-building-id',
    negotiationStatus: 'PENDIENTE',
    floorArea: 0,
    address: {
      city: 'TEST CITY',
      neighborhood: 'TEST NEIGHBORHOOD',
      number: 'TEST-NUMBER',
      postalCode: { number: 'TEST-POSTAL-CODE' },
      province: 'TEST PROVINCE',
      street: 'TEST STREET',
      type: 'CL'
    },
    metadata: [],
  },
  relatedOwners: [
    {
      id: 'test-worksheet-related-owner',
      name: 'Worksheet Related Owner Name',
      person: {
        contacts: [
          {
            id: 'test-worksheet-contact-id',
            status: 'UNDEFINED',
            type: 'TELEFONO',
            value: '666666667',
          },
        ],
      },
      status: 'NO_VERIFICADO',
      type: 'NINGUNO',
    }
  ]
}

export const worksheetViewBuilder = (overrides: Partial<WorksheetViewProps> = {}) => ({
  build () {
    return CallcenterView({ ...worksheetViewPrototype, ...overrides })
  },
  withCity (city: string) {
    if (!overrides.building) {
      overrides.building = { ...worksheetViewPrototype.building }
    }
    overrides.building.address.city = city

    return worksheetViewBuilder(overrides)
  }
})
