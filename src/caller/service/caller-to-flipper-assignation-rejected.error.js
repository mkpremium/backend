export class CallerToFlipperAssignationRejected extends Error {
  constructor (reason) {
    super(reason)
    this.reason = reason
  }
}
