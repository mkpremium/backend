import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'

export const callsEventListeners = (eventBus: EventListener, container: AwilixContainer) => {
  eventBus.on(
    'virtual-caller.input_gathered',
    'virtual-caller.process_gathered_input',
    container.resolve('virtualCallerInputGatheredListener')
  )
  eventBus.on(
    'virtual-caller.worksheet_done',
    'virtual-caller.continue_loop',
    container.resolve('virtualCallerWorksheetDoneListener')
  )
  eventBus.on(
    'virtual-caller.call_finished',
    'virtual-caller.continue_loop',
    container.resolve('continueVirtualCallerLoop')
  )
  eventBus.on(
    'virtual-caller.call_finished',
    'virtual-caller.send_sms',
    container.resolve('sendSmsToOwner')
  )
}
