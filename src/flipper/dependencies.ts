import { asClass, asFunction, AwilixContainer } from 'awilix'
import { FlipperAvailabilityService } from './service/flipper-availability.service'
import { SetFlipperMaxLineService } from './service/set-flipper-max-line.service'
import { createFlipperBlockedAvailabilityController } from './controller/flipper-availability.controller'
import { createSetFlipperMaxLineController } from './controller/set-flipper-max-line.controller'
import { FlipperRepository } from './flipper.repository'

export const setupFlipperDependencies = (container: AwilixContainer) => {
  container.register({
    flipperAvailabilityService: asClass(FlipperAvailabilityService).singleton(),
    setFlipperMaxLineService: asClass(SetFlipperMaxLineService).singleton(),
    flipperBlockedAvailabilityController: asFunction(createFlipperBlockedAvailabilityController).singleton(),
    setFlipperMaxLineController: asFunction(createSetFlipperMaxLineController).singleton(),
    flippersRepository: asClass(FlipperRepository).classic().singleton(),
  })
}
