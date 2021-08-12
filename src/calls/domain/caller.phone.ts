import t from 'tcomb'

export interface CallerPhoneProps {
  id: string,
  status: 'AVAILABLE' | 'BUSY'
  createdAt: Date
}

export const CallerPhone = t.struct<CallerPhoneProps & { _documentType: string }>({
  id: t.refinement(t.String, id => id.startsWith('phone_')),
  status: t.maybe(t.enums.of([ 'AVAILABLE', 'BUSY' ])),
  createdAt: t.Date,
  _documentType: t.refinement(t.String, dt => dt === 'virtual-caller-phone')
}, {
  name: 'CallerPhone',
  defaultProps: {
    _documentType: 'virtual-caller-phone',
    status: 'AVAILABLE',
    get createdAt () {
      return new Date()
    }
  }
})

export function phoneBusy(phone: CallerPhoneProps): CallerPhoneProps {
  return CallerPhone.update(phone as any, {
    status: {
      $set: 'BUSY'
    }
  })
}

export function phoneAvailable(phone: CallerPhoneProps): CallerPhoneProps {
  return CallerPhone.update(phone as any, {
    status: {
      $set: 'AVAILABLE'
    }
  })
}
