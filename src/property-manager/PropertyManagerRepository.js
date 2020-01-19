import { N1qlQuery } from 'couchbase'

const ACTIVE_PROPERTY_MANAGERS_QUERY = `
    SELECT id, profile.city, username as userName
    FROM mkpremium as propertyManager
    WHERE propertyManager._documentType = 'operator'
    AND enable = true
    AND (ANY V IN roles SATISFIES V = 'BUSINESS' END)
`

export class PropertyManagerRepository {
  constructor (couchbaseBucket) {
    this.couchbaseBucket = couchbaseBucket
  }

  getActivePropertyManagers () {
    return this.couchbaseBucket.queryAsync(
      N1qlQuery.fromString(ACTIVE_PROPERTY_MANAGERS_QUERY)
        .consistency(N1qlQuery.Consistency.STATEMENT_PLUS)
    )
  }
}
