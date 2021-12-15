import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { fromPromise } from '../../infrastructure/fp-utils'

export class Portugal2021BuildingsRepository {
  constructor (private couchbaseAdapter: CouchbaseAdapter,) {
  }

  pendingWithSlug (slug: string): TE.TaskEither<Error, Portugal2021SourceBuilding[]> {
    return pipe(
      this.pendingWithSlugQuery(slug),
      TE.map(result => {
        return result.map(b => {
          const { address } = b
          return ({
            ...b,
            address: {
              ...address,
              floorArea: isNaN(address.floorArea) ? address.floorArea : parseInt(address.floorArea),
              militaryGeo: {
                x: isNaN(address.x) ? address.x : parseInt(address.x),
                y: isNaN(address.y) ? address.y : parseInt(address.y),
              },
              number: isNaN(address.number) ? address.number : parseInt(address.number),
            },
            statusChangedAt: new Date(Date.parse(b.statusChangedAt)),
          })
        })
      })
    )
  }

  save (building: Portugal2021SourceBuilding): TE.TaskEither<Error, void> {
    return fromPromise(this.couchbaseAdapter.upsert(
        building.id,
        building
      )
    )
  }

  phoneNumbersFor (ownerDNIs: string[]): TE.TaskEither<Error, { id: string, phones: string[] }[] | undefined> {
    return pipe(
      this.phoneNumberForDNIQuery(ownerDNIs),
      TE.map(phones => phones.map(({ id, phones }) => ({ id, phones })))
    )
  }

  get (sourceBuildingId: string): TE.TaskEither<Error, Portugal2021SourceBuilding> {
    return fromPromise(this.couchbaseAdapter.get(sourceBuildingId).then(({ value }) => value))
  }

  private pendingWithSlugQuery (slug) {
    const query = `SELECT building.*
                   FROM ${this.couchbaseAdapter.bucketName} building
                   WHERE _documentType = "portugal-2021-building"
                     AND status = 'INBOX'
                     AND slug = $1`

    return fromPromise(this.couchbaseAdapter.queryAsync(query, [ slug ]))
  }

  private phoneNumberForDNIQuery (ownerDNIs: string[]) {
    const query = `SELECT phone.*
                   FROM ${this.couchbaseAdapter.bucketName} phone
                   WHERE phone._documentType = 'portugal-2021-owner-phone'
                     AND META(phone).id IN $1`

    return fromPromise(this.couchbaseAdapter.queryAsync(query, [ ownerDNIs ]))
  }
}

type REGULAR_FLOW = 'INBOX' | 'BUILDING_IMPORTED' | 'OWNERS_IMPORTED' | 'WORKSHEET_CREATED'
type EXCEPTIONS = 'DUPLICATED' | 'MERGED' | 'DUPLICATED_OWNER' | 'FAILED'
type ImportStatus = REGULAR_FLOW | EXCEPTIONS

export interface Portugal2021SourceBuilding {
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
  status: ImportStatus,
  statusChangedAt: Date,
  importedWithBuildingId?: string,
  importedOwners?: {
    dni: string
    id: string
  }[]
  failure?: any,
  previousStatus?: ImportStatus
  mergeWith?: string
}
