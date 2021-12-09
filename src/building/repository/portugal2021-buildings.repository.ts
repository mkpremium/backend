import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import * as TE from 'fp-ts/TaskEither'

export class Portugal2021BuildingsRepository {
  constructor (private couchbaseAdapter: CouchbaseAdapter,) {
  }

  pendingWithSlug (slug: string): TE.TaskEither<Error, RawBuilding[]> {
    return undefined
  }

  save (building: RawBuilding): TE.TaskEither<Error, void> {
    return undefined
  }
}

interface RawBuilding {
  _documentType: 'portugal-2021-building',
  address: {
    cadastreReferenceA: string,
    cadastreReferenceAM: string,
    city: string,
    floorArea: number,
    militaryGeo: {
      x: number,
      y: number
    },
    neighborhood: string,
    number: number,
    street: string,
    type: string,
    usage: string,
  },
  id: string,
  owners: {
    address: string,
    dni: string,
    name: string,
  }[],
  slug: string,
  status: 'INBOX' |'BUILDING_IMPORTED' | 'DUPLICATED' | 'DUPLICATED_OWNER' | 'FAILED',
  statusChangedAt: Date,
  failure?: any,
}
