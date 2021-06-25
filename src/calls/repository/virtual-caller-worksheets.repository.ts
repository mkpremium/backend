import t from 'tcomb'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import fromJSON from 'tcomb/lib/fromJSON'
import uuid from 'uuid/v4'

export interface VirtualCallerWorksheetProps {
  worksheetId: string;
  callerId: string;
  status: 'CALLING' | 'DONE';
  lastContactId?: string;
}

export const VirtualCallerWorksheet = t.struct<VirtualCallerWorksheetProps>({
  id: t.String,
  worksheetId: t.String,
  callerId: t.String,
  status: t.enums.of([ 'CALLING', 'DONE' ]),
  lastContactId: t.maybe(t.String),
  _documentType: t.irreducible('virtual-call-worksheet', (s) => s === 'virtual-call-worksheet')
}, {
  name: 'VirtualCallerWorksheet',
  defaultProps: {
    _documentType: 'virtual-call-worksheet',
    get id () {
      return uuid()
    },
  }
})

const inProgressWorksheetQuery = bucketName => `
    SELECT worksheet.*
    FROM ${bucketName} worksheet
    WHERE worksheet._documentType = 'virtual-call-worksheet'
      AND worksheet.status = 'CALLING'
      AND worksheet.callerId = $1
`

const numberOfWorksheetsProcessedByQuery = bucketName => `
    SELECT COUNT(worksheet) as count
    FROM ${bucketName} worksheet
    WHERE worksheet._documentType = 'virtual-call-worksheet'
      AND worksheet.status = 'DONE'
      AND worksheet.callerId = $1

`

export class VirtualCallerWorksheetsRepository extends CouchbaseRepository<VirtualCallerWorksheetProps> {
  async inProgressWorksheetFor (callerId: string): Promise<VirtualCallerWorksheetProps> {
    return this.couchbaseAdapter.queryAsync(inProgressWorksheetQuery(this.bucketName), [ callerId ])
      .then(rows => {
        if (!rows || rows.length === 0) {
          return undefined
        }

        return fromJSON<VirtualCallerWorksheetProps>(rows[ 0 ], VirtualCallerWorksheet)
      })
  }

  protected struct (): t.Struct<any> & Partial<RecordToDomain> {
    return VirtualCallerWorksheet
  }

  async numberOfWorksheetsProcessedBy (callerId: string): Promise<number> {
    return this.couchbaseAdapter.queryAsync(numberOfWorksheetsProcessedByQuery(this.bucketName), [ callerId ])
      .then(([ { count } ]) => count)
  }
}
