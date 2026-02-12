import { asClass, asFunction, AwilixContainer } from 'awilix'
import { CallService } from './service/call-service'
import { ContactService } from './service/contact-service'
import { getCityContactsController, getScheduleDailyCallsController, scheduleDailyCallsController } from './controller/contact-controller'

export const setupCallDependencies = async (container: AwilixContainer) => {
  container.register({
    callService: asClass(CallService).classic().singleton(),
    contactService: asClass(ContactService).classic().singleton(),
    getCityContactsController: asFunction(getCityContactsController).singleton(),
    scheduleDailyCallsController: asFunction(scheduleDailyCallsController).singleton(),
    getScheduleDailyCallsController: asFunction(getScheduleDailyCallsController).singleton()
  })
}
