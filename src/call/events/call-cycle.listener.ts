import { CallService } from '../service/call.service'
import { ContactService } from '../service/contact.service'
import { CallEvent, callEmitter } from './call-events'

export const registerCallCycleListener = (
  callService: CallService,
  contactService: ContactService,
  logger: any
) => {
  callEmitter.on(CallEvent.CALL_COMPLETED, async (event) => {
    try {
      if (!event.city) return
      if (event.status === 'not_connected') {
        logger.info(`[CALL_COMPLETED] [not_connected] city=${event.city} buildingId=${event.buildingId} status=${event.status} vende=${event.vende} noLlamar=${event.noLlamar} rellamada=${event.rellamada}`)
        const result = await callService.processBuildingContactCall(event.buildingId, event.city)
        logger.info(`[CALL_COMPLETED][not_connected] result=${JSON.stringify(result)} buildingId=${event.buildingId} city=${event.city}`)
        if (result.status === 'building_without_contacts') {
          await callService.finishBuilding(event.buildingId, event.city)
          const nextResult = await callService.processNextBuilding(event.city)
          logger.info(`[CALL_COMPLETED][vende_false] nextResult=${JSON.stringify(nextResult)} city=${event.city}`)
        }
        return
      }
      if (event.noLlamar === true) {
        logger.info(`[CALL_COMPLETED][no_llamar] buildingId=${event.buildingId} city=${event.city}`)
        await callService.finishBuilding(event.buildingId, event.city)
        const nextResult = await callService.processNextBuilding(event.city)
        logger.info(`[CALL_COMPLETED][vende_false] nextResult=${JSON.stringify(nextResult)} city=${event.city}`)
        return
      }
      if (event.rellamada === true) {
        logger.info(`[CALL_COMPLETED][rellamada] buildingId=${event.buildingId} city=${event.city}`)
        await contactService.markCallback(event.calledAt, event.callQueueId)
        const result = await callService.processBuildingContactCall(event.buildingId, event.city)
        logger.info(`[CALL_COMPLETED][rellamada] result=${JSON.stringify(result)} buildingId=${event.buildingId} city=${event.city}`)
        if (result.status === 'building_without_contacts') {
          await callService.finishBuilding(event.buildingId, event.city)
          const nextResult = await callService.processNextBuilding(event.city)
          logger.info(`[CALL_COMPLETED][rellamada] nextResult=${JSON.stringify(nextResult)} city=${event.city}`)
        }
      }
      if (event.vende === true) {
        logger.info(`[CALL_COMPLETED][vende_true] buildingId=${event.buildingId} city=${event.city}`)
        await callService.finishBuilding(event.buildingId, event.city)
        const nextResult = await callService.processNextBuilding(event.city)
        logger.info(`[CALL_COMPLETED][vende_false] nextResult=${JSON.stringify(nextResult)} city=${event.city}`)
        return
      }
      if (event.vende === false) {
        const result = await callService.processBuildingContactCall(event.buildingId, event.city)
        logger.info(`[CALL_COMPLETED][vende_false] result=${JSON.stringify(result)} buildingId=${event.buildingId} city=${event.city}`)
        if (result.status === 'building_without_contacts') {
          await callService.finishBuilding(event.buildingId, event.city)
          const nextResult = await callService.processNextBuilding(event.city)
          logger.info(`[CALL_COMPLETED][vende_false] nextResult=${JSON.stringify(nextResult)} city=${event.city}`)
        }
        return
      }
      const nextResult = await callService.processNextBuilding(event.city)
      logger.info(`[CALL_COMPLETED][fallback] nextResult=${JSON.stringify(nextResult)} city=${event.city}`)
    } catch (error) {
      logger.error(`Error continuing call cycle: ${(error as Error).message}`)
    }
  })
}
