import t from 'tcomb'
import moment from 'moment'
import { NegotiationStatus } from '../building'

const DateTimeString = t.irreducible('DateTimeString', dts => moment.utc(dts).isValid())
export const BuildingV2 = t.struct({
  id: t.String,
  files: t.list(t.struct({
    id: t.String,
    mimeType: t.String,
    thumbnailUrl: t.String
  })),
  stock: t.maybe(t.struct({
    purchase: t.maybe(t.struct({
      reservationAmount: t.Number,
      reservationDate: DateTimeString,
      transactionAmount: t.Number,
      transactionDate: t.maybe(DateTimeString)
    })),
    sell: t.maybe(t.struct({
      reservationAmount: t.Number,
      reservationDate: t.maybe(DateTimeString),
      transactionAmount: t.Number,
      transactionDate: t.maybe(DateTimeString)
    })),
    close: t.maybe(t.struct({
      operatorId: t.String,
      gain: t.Number,
      transactionDate: DateTimeString
    }))
  })),
  latestProposal: t.maybe(t.struct({
    amount: t.Number
  })),
  address: t.maybe(t.struct({
    neighborhood: t.maybe(t.String),
    type: t.maybe(t.String),
    street: t.maybe(t.String),
    number: t.maybe(t.union([ t.String, t.Number ])),
    postalCode: t.maybe(t.struct({
      number: t.String
    })),
    city: t.maybe(t.String)
  })),
  geolocation: t.maybe(t.struct({
    latitude: t.maybe(t.Number),
    longitude: t.maybe(t.Number)
  })),
  cadastreReference: t.maybe(t.String),
  negotiationStatus: t.maybe(NegotiationStatus),
  floorArea: t.maybe(t.Number),
  usage: t.maybe(t.String),
  owner: t.maybe(t.struct({
    id: t.String,
    firstName: t.maybe(t.String),
    fullName: t.String,
    contacts: t.maybe(t.list(t.struct({
      id: t.String,
      status: t.enums.of([ 'GOOD', 'BAD', 'UNDEFINED' ]),
      type: t.enums.of([ 'TELEFONO', 'MOVIL', 'EMAIL' ])
    }))),
    featuredContact: t.maybe(t.struct({
      phoneId: t.maybe(t.String),
      emailId: t.maybe(t.String)
    }))
  })),
  lastMeeting: t.maybe(t.struct({
    dateMeeting: DateTimeString
  })),
  salePrice: t.maybe(t.Number)
})

BuildingV2.prototype.changeNegotiationStatus = function (newStatus) {
  return BuildingV2.update(this, {
    negotiationStatus: {
      $set: newStatus
    }
  })
}
