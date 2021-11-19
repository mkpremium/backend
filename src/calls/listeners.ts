import { AwilixContainer } from 'awilix'
import { EventListener } from '../infrastructure/event-bus'

export const callsEventListeners = (eventBus: EventListener, container: AwilixContainer) => {
  eventBus.on(
    'virtual_caller.input_gathered',
    'virtual_caller.process_gathered_input',
    container.resolve('virtualCallerInputGatheredListener')
  )
  eventBus.on(
    'virtual_caller.worksheet_done',
    'virtual_caller.continue_loop',
    container.resolve('virtualCallerWorksheetDoneListener')
  )
  eventBus.on(
    'virtual_caller.call_finished',
    'virtual_caller.continue_loop',
    container.resolve('continueVirtualCallerLoop')
  )
  eventBus.on(
    'virtual_caller.call_finished',
    'virtual_caller.send_sms',
    container.resolve('sendSmsToOwner')
  )
}
