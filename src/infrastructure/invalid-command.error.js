export class InvalidCommand extends Error {
  constructor (errors) {
    super(errors[ 0 ].message)
  }
}
