import { ContactService } from './contact.service'
import { initLogger } from '../../infrastructure/logger'
import { ContactDTO } from '../types/contact-dto'
import { ScheduledTask } from 'node-cron'
import { AppDataSource } from '../../data-source'
import { DateTime } from 'luxon'
import { RetellCustomFunctionResponse } from '../types/call-log-response.dto'
import { CallQueue } from '../call-queue.entity'
import moment from 'moment-timezone'
import { RetellCallProvider } from '../infrastructure/retell/retell-call.provider'
import { transformContactToTask } from './mappers/contacts-to-task.mapper'
import { BatchCallRequest } from '../types/batch-call-request'
import { AddOwnerService, AddOwnerCommand } from '../../owner/service/add-owner.service'
import { UpdateOwnerTypeService } from '../../owner/service/update-owner-type.service'
import { SearchOwnerOrBuildingService } from '../../owner/service/search-owner-or-building.service'
import { FoundOwnerProps } from '../../owner/repository/owner.repository'
import { addOwnerCommandMapper } from './mappers/add-owner-command.mapper'
import { PostgresCallScheduleRepository } from '../repository/postgres-call-schedule.repository'

export class CallService {
    private scheduleTask: ScheduledTask | null = null

    constructor (
      private contactService: ContactService,
      private callScheduleRepository: PostgresCallScheduleRepository,
      private logger: ReturnType<typeof initLogger>,
      private retellCallProvider: RetellCallProvider,
      private addOwnerService: AddOwnerService,
      private updateOwnerTypeService: UpdateOwnerTypeService,
      private searchOwnerOrBuildingService: SearchOwnerOrBuildingService
    ) {}

    async processNextBuilding (currentCity:string) {
      if (!currentCity) return { status: 'error', message: 'No se proporcionó la ciudad' }
      try {
        while (true) {
          // Retorna el numero de edificios restantes por gestionar
          const remainingBuildings = await this.callScheduleRepository.getDailyRemainingBuildings(currentCity)
          // Si no quedan edificios por gestionar se acaba
          if (remainingBuildings === null || remainingBuildings <= 0) return { status: 'finished', message: `Limite de edificios diarios procesado para ${currentCity}` }
          // Coge Id del Edificio
          const buildingId = await this.contactService.getBuildingIdFromCallQueue(currentCity)
          if (!buildingId) return { status: 'empty', message: `No quedan edificios pendientes para ${currentCity}` }
          // Procesa todos los contactos del edificio hasta que no quede ninguno
          const result = await this.processBuildingContactCall(buildingId, currentCity)
          if (result!.status === 'empty') {
            await this.callScheduleRepository.updateDailyRemainingBuildings(currentCity)
            continue
          }
          this.logger.info(`[processNextBuilding] city=${currentCity}`)
          this.logger.info(`[processNextBuilding] buildingId=${buildingId}`)
          return result
        }
      } catch (error) {
        this.logger.info(error)
        return { status: 'error', message: 'Error procesando edificio' }
      }
    }

    async processBuildingContactCall (buildingId:string, currentCity:string) {
      let contact: ContactDTO | null = null
      if (!buildingId) return { status: 'error', message: 'No se proporcionó id del edificio' }
      try {
        // Consigue un contacto de ese edificio
        contact = await this.contactService.getNextContactInBuilding(currentCity, buildingId)
        if (!contact) return { status: 'empty', message: `No quedan contactos pendientes en el edificio ${buildingId}` }
        // Asignamos el número de telefono desde el que llamar
        const currentOriginTelf = this.assignOriginTelf(currentCity)
        this.logger.debug(`Telefono origen de la ciudad actual: ${currentOriginTelf}`)
        // Preparamos el request para llamar a retell y lanzamos llamada
        const batchCallRequest:BatchCallRequest = {
          originTelf: this.assignOriginTelf(currentCity)!,
          tasks: transformContactToTask(contact)
        }
        await this.contactService.changeContactStatus('IN_PROGRESS', false, contact.callQueueId)
        const batchCallResponse = await this.retellCallProvider.createBatchCall(batchCallRequest)
        this.logger.info('Full Retell Response:', JSON.stringify(batchCallResponse, null, 2))
        this.logger.info(`[processBuildingContactCall] buildingId=${buildingId}`)
        this.logger.info(`[processBuildingContactCall] contact=${contact?.callQueueId}`)
        this.logger.info(`[processBuildingContactCall] contact=${JSON.stringify(contact)}`)
        return { status: 'sent', city: currentCity, buildingId: buildingId, callQueueId: contact.callQueueId, message: `Llamada para el contacto ${contact} realizada` }
      } catch (error) {
        this.logger.info('Error Retell: ', error)
        if (contact?.callQueueId) {
          await this.contactService.changeContactStatus('PENDING', true, contact.callQueueId)
        }
        return { status: 'error', message: 'Error enviando llamada del edificio' }
      }
    }

    assignOriginTelf (city:string) {
      const portugalCities = ['PORTO', 'LISBOA', 'VILA NOVA DE GAIA']
      if (portugalCities.includes(city.toUpperCase())) return process.env.RETELL_ORIGIN_TELF_PORTUGAL
      return process.env.RETELL_ORIGIN_TELF_SPAIN
    }

    async configScheduledCall (body:RetellCustomFunctionResponse) {
      const metadata = body.call.metadata || {}
      const dynamicVar = body.call.retell_llm_dynamic_variables || {}
      const phoneNumber = body.call.to_number
      const originTelf = body.call.from_number!
      const scheduledAt = DateTime.fromISO(body.args.scheduled_at!, { zone: 'Europe/Madrid' }).toMillis()

      this.logger.info(`metadata: ${JSON.stringify(metadata, null, 2)}`)
      this.logger.info(body.args.scheduled_at)
      this.logger.info(DateTime.fromMillis(scheduledAt).setZone('Europe/Madrid').toLocaleString(DateTime.DATETIME_MED))

      if (!phoneNumber) throw new Error('Missing phoneNumber in call payload')
      if (!metadata) throw new Error('Missing metadata in call payload')

      const contact: ContactDTO = {
        phoneNumber,
        name: dynamicVar.nombre!,
        lastName: dynamicVar.apellido!,
        buildingId: metadata.buildingId!,
        ownerId: metadata.ownerId!,
        contactId: metadata.contactId!,
        city: metadata.city!,
        use: metadata.use!,
        callQueueId: metadata.callQueueId!,
        address: dynamicVar.direccion!
      }

      const batchCallRequest:BatchCallRequest = {
        originTelf,
        tasks: transformContactToTask(contact),
        timeStamp: scheduledAt
      }

      try {
        const batchCallResponse = await this.retellCallProvider.createBatchCall(batchCallRequest)
        this.logger.info(`Batch call created:${batchCallResponse.batchId}`)
      } catch (err:any) {
        this.logger.error(`Error creating batch call:${err.message || err}`)
        throw err
      }
    }

    async getLastCalledDate (buildingId:string, contactId:string) {
      const callQueueEntry = await AppDataSource.manager.findOne(CallQueue, {
        where: { buildingId, contactId }
      })

      if (!callQueueEntry?.lastCalledAt) return null
      return moment(callQueueEntry!.lastCalledAt).format('DD/MM/YY')
    }

    async takeNewOwnerContact (body: RetellCustomFunctionResponse) {
      const userId = '56ecc194-b998-43b5-a118-62e40b69aa84'
      const currentOwnerId = body.call.metadata?.ownerId
      if (!body.args.phone) return
      const foundOwner: FoundOwnerProps | undefined = (await this.searchOwnerOrBuildingService.search(body.args.phone))[0]
      const newOwnerFullName = [body.args.name, body.args.surname]
        .filter(Boolean)
        .join(' ')
        .toUpperCase()
        .trim()

      if (foundOwner) {
        if ((foundOwner.matchingContactId === body.call.metadata?.contactId) ||
            (foundOwner.name.toUpperCase().trim() === newOwnerFullName)) {
          if (foundOwner.type !== 'PRINCIPAL') await this.updateOwnerTypeService.updateOwnerType(foundOwner.id, 'PRINCIPAL')
          return
        }
      }
      const newOwner: AddOwnerCommand = addOwnerCommandMapper(body)
      await this.addOwnerService.addOwner(newOwner, userId)
      if (currentOwnerId) {
        await this.updateOwnerTypeService.updateOwnerType(currentOwnerId, 'SECUNDARIO')
      }
    }
}
