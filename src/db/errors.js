export class EntityNotFound extends Error {
  constructor (entityId, structType) {
    super('Entity not found')
    this.entityId = entityId
    this.structType = structType.name
  }
}
