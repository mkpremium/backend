const activePropertyManagersQuery = bucketName => `
    SELECT
      id,
      profile.city,
      username as userName,
      profitGoal.amount as profitGoal,
      maxLine
    FROM ${bucketName}
    WHERE _documentType = 'operator'
    AND enable = true
    AND (ANY r IN roles SATISFIES r = 'BUSINESS' END)
`

export class PropertyManagerRepository {
  /**
   * @param {CouchbaseAdapter} couchbaseAdapter
   */
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  getActivePropertyManagers () {
    return this.couchbaseAdapter.queryAsync(
      activePropertyManagersQuery(this.couchbaseAdapter.bucketName)
    )
  }
}
