import t from 'tcomb';
import {Operator} from '../operator/models';

const recordContexts = t.RecordContext.meta.map;

async function getOperatorUsername(id) {
  const repo = new Operator();
  const operator = await repo.findById(id);

  if (operator) {
    return operator.username;
  }
  return '';
};

function getModelName(contextModel) {
  if (!contextModel) return 'UNDEFINED';
  return contextModel._documentType || contextModel;
}

function getModelId(contextModel) {
  if (!contextModel) return 'UNDEFINED';
  return contextModel.id || '-';
}

function getRecordContext(model, plural = false) {
  switch (model) {
    case 'worksheet':
      if (plural) return recordContexts.WORKSHEETS;
      return recordContexts.WORKSHEET;
    case 'worksheet-queue':
      if (plural) return recordContexts.SYSTEM_QUEUE;
      return recordContexts.WORKSHEET_QUEUE;
    case 'operator':
      if (plural) return recordContexts.OPERATORS;
      return recordContexts.OPERATOR;
    case 'owner':
      if (plural) return recordContexts.OWNERS;
      return recordContexts.OWNER;
    case 'owner-contact':
      return recordContexts.OWNER_CONTACT;
    default:
      return 'UNDEFINED';
  }
}

function getRecordDescription(model, username) {
  const recordContext = getRecordContext(model);
  return {
    CREATE: `${username} ha creado ${recordContext}`,
    UPDATE: `${username} ha actualizado ${recordContext}`,
    GET: `${username} ha obtenido ${recordContext}`,
    OPEN: `${username} ha abierto ${recordContext}`,
    LIST: `${username} ha listado ${getRecordContext(model, true)}`
  };
};

export async function getRecordStruct(type, contextModel, user) {
  const model = getModelName(contextModel);
  const username = await getOperatorUsername(user.id);
  const recordType = contextModel ? type : 'ERROR';
  const id = getModelId(contextModel);

  return {
    model,
    id,
    user: {
      id: user.id,
      permissions: user.permissions
    },
    type: recordType,
    description: getRecordDescription(model, username)[type],
    timestamp: new Date()
  };
}
