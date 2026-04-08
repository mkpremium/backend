import Retell from 'retell-sdk'
import { CallService } from './call/service/call-service'
import { RetellCallProvider } from './call/infrastructure/retell/retell-call.provider'
import { initLogger } from './infrastructure/logger'
import path from 'path'
import dotenv from 'dotenv'

//export const fakePhoneNumber = '+34634531701'
export const fakePhoneNumber = '+34629685014'
export const contactId = '32e8ead3-8a5e-4d32-b7b3-a3aa1ef809fa'
export const contactService = {
  getCityContacts: async () => [
    {
      name: 'Pepito',
      lastName: 'Grillo',
      phoneNumber: fakePhoneNumber,
      address: 'RUE DEL PERCEBE 13',
      buildingId: '225b998a-813b-4bb2-8e87-b5b74813f588',
      ownerId: '27037aab-f4c8-40db-b581-7e2f9eff3cb4',
      contactId,
      city: 'BARCELONA',
      use: 'Residencial',
      callQueueId: '4de15b19-b691-4728-864a-7ea31808c0ef'
    }
  ]
}

const updateBuildingNegotiationStatusService = {
  updateBuildingStatus: async () => {}
}

const callScheduleRepository = {
  getAll: async () => [],
  saveAll: async () => {}
}

async function main () {
  dotenv.config({
    path: path.resolve(__dirname, '../.env')
  })
  const logger = initLogger()

  const retellClient = new Retell({
    apiKey: process.env.RETELL_API_KEY!
  })

  const retellProvider = new RetellCallProvider(retellClient, logger)

  const service = new CallService(
    contactService as any,
    logger,
    updateBuildingNegotiationStatusService as any,
    callScheduleRepository as any,
    retellProvider
  )

  const request = {
    city: 'BARCELONA',
    limit: 1,
    timeWindow: {
      startHour: '19:00',
      endHour: '20:00'
    }
  }

  const result = service.makeBatchCall(request as any)
  console.log({ result })
}

main().catch(err => console.error(err))
