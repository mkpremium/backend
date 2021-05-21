import _ from 'lodash'

const recordContexts = {
  OWNER: 'Propietario',
  OWNERS: 'Propietarios',
  OWNER_CONTACT: 'Contacto de propietario',
  WORKSHEET: 'Ficha de trabajo',
  WORKSHEETS: 'Fichas de trabajo',
  OPERATOR: 'Operador',
  OPERATORS: 'Operadores',
  WORKSHEET_QUEUE: 'Cola de fichas de trabajo',
  SYSTEM_QUEUE: 'Colas del sistema'
}

function getModelName (contextModel) {
  if (!contextModel) return 'UNDEFINED'
  return contextModel._documentType || contextModel
}

function getModelId (contextModel) {
  if (!contextModel) return 'UNDEFINED'
  return contextModel.id || '-'
}

function getRecordContext (model, plural = false) {
  switch (model) {
    case 'worksheet':
      if (plural) return recordContexts.WORKSHEETS
      return recordContexts.WORKSHEET
    case 'worksheet-queue':
      if (plural) return recordContexts.SYSTEM_QUEUE
      return recordContexts.WORKSHEET_QUEUE
    case 'operator':
      if (plural) return recordContexts.OPERATORS
      return recordContexts.OPERATOR
    case 'owner':
      if (plural) return recordContexts.OWNERS
      return recordContexts.OWNER
    case 'owner-contact':
      return recordContexts.OWNER_CONTACT
    default:
      return 'UNDEFINED'
  }
}

function getRecordDescription (model, username) {
  const recordContext = getRecordContext(model)
  return {
    DELETE: `${username} ha eliminado ${recordContext}`,
    CREATE: `${username} ha creado ${recordContext}`,
    UPDATE: `${username} ha actualizado ${recordContext}`,
    GET: `${username} ha obtenido ${recordContext}`,
    OPEN: `${username} ha abierto ${recordContext}`,
    LIST: `${username} ha listado ${getRecordContext(model, true)}`,
    TAKE: `${username} ha tomado ${recordContext}`,
    RELEASE: `${username} ha liberado ${recordContext}`
  }
}

export function getHistoryStruct ({ type, contextModel, user }) {
  const model = getModelName(contextModel)
  const username = _.get(user, 'operator.username', user.id)
  const recordType = contextModel ? type : 'ERROR'
  const id = getModelId(contextModel)

  return {
    modelName: model,
    modelId: id,
    operatorId: user.id,
    type: recordType,
    description: getRecordDescription(model, username)[ type ]
  }
}
