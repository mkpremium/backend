import app from '../../../src/app';
import {deleteAll} from '../../common';
import request from 'supertest';
import Promise from 'bluebird';
import {Calls} from '../../../src/calls/models';
import {CallStatus} from '../../../src/types/enums';

const numintecEvents = [
  {
    'tag': 'dialog-info',
    'data': {
      'queueid': 'NONE',
      'remoteidentity': '675594824',
      'displayname': 'LLamar a...',
      'GetDialInfo': '0|10106-920|0|1|5060|675594824|0|3|-1',
      'callid': '78cd387a192731e66cc07abf4b8a7fe7@172.16.78.78:5060',
      'localidentity': '10106-920',
      'accountcode': '10106-920-17146-675594824-CEO',
      'CI': 'NONE',
      'direction': 'inbound',
      'state': 'early',
      'proxy': '128.140.201.226',
      'fromuser': '675594824',
      'ServiceData': '675594824#17146#9154705234692096434###1###1',
      'called': '10106-920'
    }
  },
  {
    'tag': 'dialog-info',
    'data': {
      'queueid': 'NONE',
      'remoteidentity': '675594824',
      'displayname': 'LLamar a...',
      'GetDialInfo': '0|10106-920|0|1|5060|675594824|0|3|-1',
      'callid': '78cd387a192731e66cc07abf4b8a7fe7@172.16.78.78:5060',
      'localidentity': '10106-920',
      'accountcode': '10106-920-17146-675594824-CEO',
      'CI': 'NONE',
      'direction': 'inbound',
      'state': 'confirmed',
      'proxy': '128.140.201.226',
      'fromuser': '675594824',
      'ServiceData': '675594824#17146#9154705234692096434###1###1',
      'called': '10106-920'
    }
  },
  {
    'tag': 'dialog-info',
    'data': {
      'queueid': 'NONE',
      'remoteidentity': '934922728',
      'displayname': 'operador.920',
      'GetDialInfo': '213.27.162.77|+34675594824|194|1|5060|+34934922728|0|30|-1',
      'callid': '7148124f0e2a343b68812f371346ae0a@172.16.78.78:5060',
      'localidentity': '675594824',
      'accountcode': '10106-920-17146-CA',
      'CI': 'NONE',
      'direction': 'inbound',
      'state': 'early',
      'proxy': '128.140.201.161',
      'fromuser': '934922728',
      'ServiceData': '675594824#17146#9154705234692096434###1#',
      'called': '+34675594824'
    }
  },
  {
    'tag': 'dialog-info',
    'data': {
      'queueid': 'NONE',
      'remoteidentity': '675594824',
      'displayname': 'LLamar a...',
      'GetDialInfo': '0|10106-920|0|1|5060|675594824|0|3|-1',
      'callid': '78cd387a192731e66cc07abf4b8a7fe7@172.16.78.78:5060',
      'localidentity': '10106-920',
      'accountcode': '10106-920-17146-675594824-CEO',
      'CI': 'NONE',
      'direction': 'inbound',
      'state': 'terminated',
      'proxy': '128.140.201.226',
      'fromuser': '675594824',
      'ServiceData': '675594824#17146#9154705234692096434###1###1',
      'called': '10106-920'
    }
  },
  {
    'tag': 'dialog-info',
    'data': {
      'queueid': 'NONE',
      'remoteidentity': '934922728',
      'displayname': 'operador.920',
      'GetDialInfo': '213.27.162.77|+34675594824|194|1|5060|+34934922728|0|30|-1',
      'callid': '7148124f0e2a343b68812f371346ae0a@172.16.78.78:5060',
      'localidentity': '675594824',
      'accountcode': '10106-920-17146-CA',
      'CI': 'NONE',
      'direction': 'inbound',
      'state': 'terminated',
      'proxy': '128.140.201.161',
      'fromuser': '934922728',
      'ServiceData': '675594824#17146#9154705234692096434###1#',
      'called': '+34675594824'
    }
  }
];

describe('Numintec Web Hook', () => {
  beforeEach(async() => {
    await app.locals.bucketPromise;
    await deleteAll();
  });

  it('web hook should be able to update a call from until his finish', async() => {
    const {id} = await createMockCall();
    await Promise.mapSeries(numintecEvents, numintecRequest);
    const call = await findCall(id);
    call.events.length.should.equal(3);
    CallStatus[call.events[0].status].should.equal(CallStatus.early);
    CallStatus[call.events[1].status].should.equal(CallStatus.confirmed);
    CallStatus[call.events[2].status].should.equal(CallStatus.terminated);
    call.status.should.equal(CallStatus.terminated);
  });
});

async function numintecRequest(body) {
  return request(app)
    .post(`/webhook/calls`)
    .send(body);
}

async function findCall(id) {
  const repo = new Calls();
  return repo.findById(id);
}

async function createMockCall() {
  const callData = {
    'id': 'b3dd073b-9cc8-4679-a1f8-8872e28e4a52',
    'userId': '622174fb-0282-4b57-9d67-5a328e9fff19',
    'from': '1010-920',
    'to': '675594824',
    'callId': '9154705234692096434',
    'notes': [],
    'events': [],
    'date': '2019-01-09T16:46:00.897Z',
    'status': 'INICIADA',
    'origin': 'SYSTEM',
    '_documentType': 'calls'
  };

  const repo = new Calls();
  return repo.save(callData, false);
}
