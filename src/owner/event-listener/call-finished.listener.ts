import { CallDone } from '../../calls/controller/call-done-webhook.controller'

export function createCallFinishedListener() {
  return function(evt: CallDone) {
  }
}
