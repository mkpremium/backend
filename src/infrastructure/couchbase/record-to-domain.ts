import t from 'tcomb'

export interface RecordToDomain {
  couchbaseToDomain(): any
}

export const CouchbaseRecordToDomain = t.interface({
  couchbaseToDomain: t.Function
}) as unknown as (t.Interface<any> & RecordToDomain)
