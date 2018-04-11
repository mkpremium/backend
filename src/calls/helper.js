import _get from 'lodash/get';
import {CallsRawEvents} from './models';
import {CallStatus} from '../types/enums';

export const encodePlusSign = (string) => {
  return string.replace(/\+/g, '%2B');
};

export const getCallId = (body) => {
  const serviceData = _get(body, 'data.ServiceData', null);
  if (serviceData) {
    return serviceData.split('#')[2];
  }
  return null;
};

export const isUnknownEvent = async(body) => {
  const callId = getCallId(body);
  if (!callId) {
    const modelRawEvents = new CallsRawEvents();
    await modelRawEvents.save({
      content: body
    });
    return true;
  }
  return false;
};

export const shouldOmitEvent = (body) => {
  const fromUser = _get(body, 'data.fromuser', null);
  const [fromUserServiceData] = _get(body, 'data.ServiceData', '').split('#');

  return fromUser !== fromUserServiceData;
};

export const getCallStatus = (body) => {
  const state = _get(body, 'data.state', null);
  if (state in CallStatus) {
    return CallStatus[state];
  }
  return CallStatus.unknown;
};

export const buildCallEvent = (body) => {
  const originalStatus = _get(body, 'data.state', null);
  const callStatus = getCallStatus(body);
  const processed = callStatus !== CallStatus.unknown;

  return {
    processed,
    status: originalStatus,
    timestamp: new Date()
  };
};
