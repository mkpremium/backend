import { asClass, asFunction, AwilixContainer } from 'awilix'
import { FlipperAvailabilityService } from './service/flipper-availability.service'
import { SetFlipperMaxLineService } from './service/set-flipper-max-line.service'
import { createFlipperBlockedAvailabilityController } from './controller/flipper-availability.controller'
import { createSetFlipperMaxLineController } from './controller/set-flipper-max-line.controller'
import { listLeadsController } from './controller/list-leads.controller'
import { FlipperLeadsService } from './service/flipper-leads.service'

export const setupFlipperDependencies = (container: AwilixContainer) => {
  container.register({
    flipperAvailabilityService: asClass(FlipperAvailabilityService).singleton(),
    setFlipperMaxLineService: asClass(SetFlipperMaxLineService).singleton(),
    flipperBlockedAvailabilityController: asFunction(createFlipperBlockedAvailabilityController).singleton(),
    setFlipperMaxLineController: asFunction(createSetFlipperMaxLineController).singleton(),

    listLeadsController: asFunction(listLeadsController).singleton(),
    flipperLeadsService: asClass(FlipperLeadsService).classic().singleton(),
  })
}
