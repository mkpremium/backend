import t from 'tcomb';

const recordActions = t.getEnumMap(t.RecordAction);
const recordContexts = t.getEnumMap(t.RecordContext);

function getModelName(contextModel) {
  return contextModel._documentType || contextModel;
}

function getOperatorContext(type) {
  switch (type) {
    case recordActions.Lista:
      return recordContexts.OPERATORS;
    default:
      return recordContexts.OPERATOR;
  }
}

function getOwnerContext(type) {
  switch (type) {
    case recordActions.Lista:
      return recordContexts.OWNERS;
    default:
      return recordContexts.OWNER;
  }
}

function getOwnerContactContext(type) {
  switch (type) {
    default:
      return recordContexts.OWNER_CONTACT;
  }
}

function getWorkSheetContext(type) {
  switch (type) {
    case recordActions.Lista:
      return recordContexts.WORKSHEETS;
    default:
      return recordContexts.WORKSHEET;
  }
}

function getWorkSheetQueueContext(type) {
  switch (type) {
    case recordActions.Lista:
      return recordContexts.SYSTEM_QUEUE;
    default:
      return recordContexts.WORKSHEET_QUEUE;
  }
}

function getContextDetail(type, model) {
  switch (model) {
    case 'worksheet':
      return getWorkSheetContext(type);
    case 'worksheet-queue':
      return getWorkSheetQueueContext(type);
    case 'operator':
      return getOperatorContext(type);
    case 'owner':
      return getOwnerContext(type);
    case 'owner-contact':
      return getOwnerContactContext(type);
    default:
      break;
  }
}

export function getRecordStruct(type, contextModel, user) {
  const model = getModelName(contextModel);
  return {
    model,
    id: contextModel.id || '-',
    user: {
      id: user.id,
      permissions: user.permissions
    },
    details: {
      action: type,
      context: getContextDetail(type, model)
    },
    timestamp: new Date()
  };
}
