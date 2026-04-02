import { asClass, asFunction, AwilixContainer } from 'awilix'
import { CallService } from './service/call-service'
import { ContactService } from './service/contact-service'
import { deleteScheduleDailyCallsController, getCallbackController, getCallLogController, getCityContactsController, getLastCalledDate, getScheduleDailyCallsController, scheduleDailyCallsController, sendCallsController } from './controller/contact-controller'
import { PostgresCallScheduleRepository } from './repository/postgres-call-schedule.repository'

export const setupCallDependencies = async (container: AwilixContainer) => {
  container.register({
    callScheduleRepository: asClass(PostgresCallScheduleRepository).singleton(),
    callService: asClass(CallService).classic().singleton(),
    contactService: asClass(ContactService).classic().singleton(),
    getCityContactsController: asFunction(getCityContactsController).singleton(),
    scheduleDailyCallsController: asFunction(scheduleDailyCallsController).singleton(),
    getScheduleDailyCallsController: asFunction(getScheduleDailyCallsController).singleton(),
    getCallLogController: asFunction(getCallLogController).singleton(),
    sendCallsController: asFunction(sendCallsController).singleton(),
    deleteScheduleDailyCallsController: asFunction(deleteScheduleDailyCallsController).singleton(),
    getCallbackController: asFunction(getCallbackController).singleton(),
    getLastCalledDate: asFunction(getLastCalledDate).singleton()
  })
}
