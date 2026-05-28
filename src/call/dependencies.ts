import { asClass, asFunction, AwilixContainer } from 'awilix'
import { CallService } from './service/call.service'
import { ContactService } from './service/contact.service'
import { getCityContactsController } from './controller/get-city-contacts.controller'
import { saveScheduleCallsController, getScheduleCallsController, deleteScheduleCallsController } from './controller/call-schedule.controller'
import { getCallLogController } from './controller/get-call-log.controller'
import { getCallbackController } from './controller/get-callback.controller'
import { sendCallsController } from './controller/send-calls.controller'
import { PostgresCallScheduleRepository } from './repository/postgres-call-schedule.repository'
import { RetellCallProvider } from './infrastructure/retell/retell-call.provider'
import { CallScheduleService } from './service/call-schedule.service'
import { CallLogService } from './service/call-log.service'
import { PostgresCallLogRepository } from './repository/postgres-call-log.repository'
import { getNewOwnerContactController } from './controller/get-new-owner-contact.controller'
import { processNextBuildingController } from './controller/process-next-building.controller'
import { emitCallCompletedController } from './controller/emit-call-completed.controller'
import { PostgresCallQueueRepository } from './repository/postgres-call-queue.repository'
import { fakeRetellWebhookController } from './controller/fake-retell-webhook.controller'

export const setupCallDependencies = async (container: AwilixContainer) => {
  container.register({
    callScheduleRepository: asClass(PostgresCallScheduleRepository).singleton(),
    callLogRepository: asClass(PostgresCallLogRepository).singleton(),
    callQueueRepository: asClass(PostgresCallQueueRepository).singleton(),
    callService: asClass(CallService).classic().singleton(),
    callScheduleService: asClass(CallScheduleService).classic().singleton(),
    contactService: asClass(ContactService).classic().singleton(),
    callLogService: asClass(CallLogService).classic().singleton(),
    retellCallProvider: asClass(RetellCallProvider).classic().singleton(),
    processNextBuildingController: asFunction(processNextBuildingController).singleton(),
    fakeRetellWebhookController: asFunction(fakeRetellWebhookController).singleton(),
    emitCallCompletedController: asFunction(emitCallCompletedController).singleton(),
    getCityContactsController: asFunction(getCityContactsController).singleton(),
    saveScheduleCallsController: asFunction(saveScheduleCallsController).singleton(),
    getScheduleCallsController: asFunction(getScheduleCallsController).singleton(),
    getCallLogController: asFunction(getCallLogController).singleton(),
    sendCallsController: asFunction(sendCallsController).singleton(),
    deleteScheduleCallsController: asFunction(deleteScheduleCallsController).singleton(),
    getCallbackController: asFunction(getCallbackController).singleton(),
    getNewOwnerContactController: asFunction(getNewOwnerContactController).singleton()
  })
}
