export class WrongStructRecord extends Error {
  constructor (type, validationErrors, data) {
    super('A wrong struct record was tried to save')
    this.type = type
    this.errors = validationErrors.map(({ message }) => message)
    this.data = data
  }
}
