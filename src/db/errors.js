export class EntityNotFound extends Error {
  constructor (entityId, structType) {
    super('Entity not found')
    this.entityId = entityId
    this.structType = structType.name
  }
}

export class QueryTimeout extends Error {
  constructor (query) {
    super('Couchbase query timeout')
    this.query = query
  }
}
