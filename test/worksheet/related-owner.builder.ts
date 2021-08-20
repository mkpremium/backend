import { WorksheetOwnerProps } from '../../src/worksheet/repository/worksheet.repository'

const prototype: WorksheetOwnerProps = {
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

export function relatedOwnerBuilder (overrides: Partial<WorksheetOwnerProps> = {}) {
  return function () {
    return {
      ...prototype,
      ...overrides,
    }
  }
}
