import t from 'tcomb'

export class EntityNotFound extends Error {
  readonly structType: string

  constructor (
    readonly entityId: string,
    structType?: t.Type<any>
  ) {
    super()
    this.entityId = entityId
    this.structType = structType?.meta.name
    this.message = `${this.structType} ${entityId} not found`
  }
}

export class KeyNotFound extends Error {
  constructor (readonly key: string) {
    super(`Key not found ${key}`);
  }
}

export class QueryError extends Error {
  constructor (
    readonly query: string,
    readonly name: string,
    readonly params?: any,
    readonly code?: string
  ) {
    super('Query error')
  }
}
