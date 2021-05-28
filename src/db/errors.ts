import t from 'tcomb'

export class EntityNotFound extends Error {
  readonly structType: string

  constructor (
    readonly entityId: string,
    structType: t.Type<any>
  ) {
    super('Entity not found')
    this.entityId = entityId
    this.structType = structType.meta.name
  }
}

export class QueryError extends Error {
  constructor (
    readonly query: string,
    readonly code: string,
    readonly name: string
  ) {
    super('Query error')
  }
}
