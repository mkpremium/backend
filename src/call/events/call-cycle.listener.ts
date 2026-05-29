import { CallService } from '../service/call.service'
import { CallEvent, callEmitter } from './call-events'

export const registerCallCycleListener = (
  callService: CallService,
  logger: any
) => {
  callEmitter.on(CallEvent.CALL_COMPLETED, async (event) => {
    try {
      if (!event.city) return
      if (event.status === 'not connected') {
        logger.info(`[CALL_COMPLETED] [not_connected] city=${event.city} buildingId=${event.buildingId} status=${event.status} vende=${event.vende} noLlamar=${event.noLlamar} rellamada=${event.rellamada}`)
        const result = await callService.processBuildingContactCall(event.buildingId, event.city)
        if (result.status === 'building_without_contacts') {
          await callService.processNextBuilding(event.city)
        }
        return
      }
      if (event.vende === true) {
        await callService.processNextBuilding(event.city)
        logger.info(`[CALL_COMPLETED][vende_true] buildingId=${event.buildingId} city=${event.city}`)
        return
      }
      if (event.vende === false) {
        const result = await callService.processBuildingContactCall(event.buildingId, event.city)
        logger.info(`[CALL_COMPLETED][vende_false] result=${JSON.stringify(result)} buildingId=${event.buildingId} city=${event.city}`)
        if (result.status === 'building_without_contacts') {
          await callService.processNextBuilding(event.city)
        }
        return
      }
      await callService.processNextBuilding(event.city)
    } catch (error) {
      logger.error(`Error continuing call cycle: ${(error as Error).message}`)
    }
  })
}
