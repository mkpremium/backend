import t from 'tcomb'
import uuid from 'uuid/v4'
import { ContactProps } from './owner'

export const ContactInfoStatus = t.enums({
  UNDEFINED: 'UNDEFINED',
  GOOD: 'GOOD',
  BAD: 'BAD'
})

export const TypedContactInfo = t.struct < ContactProps >(
  {
    id: t.String,
    type: t.enums.of(['TELEFONO', 'FAX', 'MOVIL', 'EMAIL', 'SITIO_WEB']),
    value: t.String,
    note: t.maybe(t.String),
    status: ContactInfoStatus
  },
  {
    name: 'TypedContactInfo',
    defaultProps: {
      get id () {
        return uuid()
      },
      type: 'TELEFONO',
      status: 'UNDEFINED',
      note: null
    }
  }
)
