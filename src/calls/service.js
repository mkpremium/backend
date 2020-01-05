import axios from 'axios'
import t from 'tcomb'
import _get from 'lodash/get'
import { newHttpError } from '../lib/http-error'

import { Calls } from './models'
import { numintec } from '../../config'
import { encodePlusSign } from './helper'
import debug from 'debug'

const debugService = debug('app:calls:numintec')

const requester = axios.create({
  baseURL: numintec.apiUrl,
  params: {
    license: numintec.apiKey
  }
})

function getCallParams (from, to, serviceId) {
  const struct = t.CallService({
    from: from.agentNumber.split('-')[1],
    to: encodePlusSign(to.value),
    service_id: parseInt(serviceId),
    return_id: true
  })

  return `?from=${struct.from}&to=${struct.to}&options[service_id]=${struct.service_id}&options[return_id]=${true}&options[autoanswer]=1`
}

async function doCall (from, phone) {
  const params = getCallParams(from, phone, from.serviceId)
  const url = `/Call/rest/call/${params}`
  debugService('doCall', 'requester GET', url)
  try {
    const result = await requester.get(url)
    debugService('doCall', 'requester OK', result.data)
    return result.data
  } catch (e) {
    debugService('doCall', 'requester error', JSON.stringify(e))
    return _get(e, 'response.data', { status: false })
  }
}

async function call (from, phone) {
  const model = new Calls()
  const result = await doCall(from, phone)
  if (result.status) {
    return model.save({
      userId: from.id,
      from: from.agentNumber,
      to: phone.value,
      callId: result.id
    })
  } else {
    throw newHttpError(500, 'Internal server error')
  }
}

async function doHangUp (activeCall) {
  const url = `/Call/rest/hangup/?options[call_id]=${activeCall.callId}`
  debugService('doHangUp', 'requester GET', url)
  try {
    const result = await requester.get(url)
    debugService('doHangUp', 'requester OK', result.data)
    return result.data
  } catch (e) {
    debugService('doHangUp', 'requester error', JSON.stringify(e))
    return _get(e, 'response.data', { status: false })
  }
}

async function hangup (operatorId) {
  const model = new Calls()
  const activeCall = await model.findActiveCallByOperatorId(operatorId)
  if (!activeCall) {
    return true
  }

  const result = await doHangUp(activeCall)
  if (result.status) {
    return result
  } else {
    throw newHttpError(500, 'Internal server error')
  }
}

export const requestCall = call
export const requestHangup = hangup
