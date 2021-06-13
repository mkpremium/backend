import t from 'tcomb'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import fromJSON from 'tcomb/lib/fromJSON'

export interface VirtualCallerWorksheetProps {
  worksheetId: string;
  callerId: string;
  status: 'CALLING' | 'DONE';
  lastContactId?: string;
}

const VirtualCallerWorksheet = t.struct<VirtualCallerWorksheetProps>({
  worksheetId: t.String,
  callerId: t.String,
  status: t.enums.of([ 'CALLING', 'DONE' ]),
  lastContactId: t.maybe(t.String),
  _documentType: t.irreducible('virtual-call-worksheet', (s) => s === 'virtual-call-worksheet')
}, {
  name: 'VirtualCallerWorksheet',
  defaultProps: {
    _documentType: 'virtual-call-worksheet'
  }
})

const inProgressWorksheetQuery = bucketName => `
    SELECT worksheet.*
    FROM ${bucketName} worksheet
    WHERE worksheet._documentType = 'virtual-call-worksheet'
      AND worksheet.status = 'CALLING'
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
}
