import t from 'tcomb';

const recordContexts = t.RecordContext.meta.map;

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
}

export function getHistoryStruct({type, contextModel, user}) {
  const model = getModelName(contextModel);
  const username = user.operator.username;
  const recordType = contextModel ? type : 'ERROR';
  const id = getModelId(contextModel);

  return {
    model: {
      name: model,
      id
    },
    user: {
      id: user.id
    },
    type: recordType,
    description: getRecordDescription(model, username)[type],
    timestamp: new Date()
  };
}
