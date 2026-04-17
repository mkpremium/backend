import { AddOwnerCommand } from '../../../owner/service/add-owner.service'
import { RetellCustomFunctionResponse } from '../../types/call-log-response.dto'

export const addOwnerCommandMapper = (body:RetellCustomFunctionResponse):AddOwnerCommand => {
  if (!body.call.metadata?.buildingId) {
    throw new Error('buildingId is required')
  }

  if (!body.args.name || !body.args.surname || !body.args.phone) {
    throw new Error('name and phone are required')
  }

  const newOwner: AddOwnerCommand = {
    buildingId: body.call.metadata?.buildingId,
    status: 'VERIFICADO',
    type: 'PRINCIPAL',
    note: 'Obtenido en llamada a contacto principal',
    person: {
      name: [body.args.name, body.args.surname].filter(Boolean).join(' '),
      firstName: body.args.name,
      firstSurname: body.args.surname,
      contacts: [{
        type: 'MOVIL',
        value: body.args.phone,
        status: 'GOOD'
      }]
    }
  }
  return newOwner
}
