import { CallService } from '../service/call.service'
import { CallEvent, callEmitter } from './call-events'

export const registerCallCycleListener = (
  callService: CallService,
  logger: any
) => {
  callEmitter.on(CallEvent.CALL_COMPLETED, async (event) => {
    try {
      if (!event.city) return
      logger.info(
        `[CALL_COMPLETED] city=${event.city} buildingId=${event.buildingId} status=${event.status} vende=${event.vende} noLlamar=${event.noLlamar} rellamada=${event.rellamada}`)

      if (event.status === 'not connected') {
        const result = await callService.processBuildingContactCall(event.buildingId, event.city)
        if (result.status === 'empty') {
          await callService.processNextBuilding(event.city)
        }
        return
      }

      if (event.vende === true) {
        await callService.processNextBuilding(event.city)
        return
      }
      if (event.vende === false) {
        const result = await callService.processBuildingContactCall(event.buildingId, event.city)
        if (result.status === 'empty') {
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
