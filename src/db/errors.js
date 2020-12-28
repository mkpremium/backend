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

export class QueryError extends Error {
  constructor (query, code, name) {
    super('Query error')
    this.code = code
    this.name = name
    this.query = query
  }
}
