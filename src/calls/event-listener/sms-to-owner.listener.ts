import { CallDone } from '../controller/call-done-webhook.controller'

export const createSmsToOwnerListener = ({}) => {
  return (evt: CallDone) => {
    return Promise.reject('Not implemented')
  }
}
