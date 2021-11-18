import { AwilixContainer } from 'awilix'
import { EventBus } from '../infrastructure/event-bus'

export const callsEventListeners = (eventBus: EventBus, container: AwilixContainer) => {
  eventBus.on('virtual-caller.input_gathered', container.resolve('virtualCallerInputGatheredListener'))
  eventBus.on('virtual-caller.worksheet_done', container.resolve('virtualCallerWorksheetDoneListener'))
  eventBus.on('virtual-caller.call_finished', container.resolve('continueVirtualCallerLoop'))
  eventBus.on('virtual-caller.call_finished', container.resolve('sendSmsToOwner'))
}
