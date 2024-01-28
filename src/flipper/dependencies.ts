import { aliasTo, asClass, asFunction, AwilixContainer } from 'awilix'
import { FlipperAvailabilityService } from './service/flipper-availability.service'
import { SetFlipperMaxLineService } from './service/set-flipper-max-line.service'
import { createFlipperBlockedAvailabilityController } from './controller/flipper-availability.controller'
import { createSetFlipperMaxLineController } from './controller/set-flipper-max-line.controller'
import { FlipperRepository } from './flipper.repository'
import { AddFlipperService } from './service/add-flipper.service'
import { PostgresFlippersFavoritesBuildingsService } from "./service/postgres-flipper-favorites-buildings.service";

export const setupFlipperDependencies = (container: AwilixContainer) => {
  const usePostgres = container.resolve('usePostgres') as boolean
  container.register({
    addFlipperService: asClass(AddFlipperService).singleton().classic(),
    flipperAvailabilityService: asClass(FlipperAvailabilityService).singleton(),
    setFlipperMaxLineService: asClass(SetFlipperMaxLineService).singleton(),
    flipperBlockedAvailabilityController: asFunction(createFlipperBlockedAvailabilityController).singleton(),
    setFlipperMaxLineController: asFunction(createSetFlipperMaxLineController).singleton(),
    flippersRepository: asClass(FlipperRepository).classic().singleton(),

    postgresFlippersFavoritesBuildingsService: asClass(PostgresFlippersFavoritesBuildingsService).classic().singleton(),
    flipperFavoritesBuildingsService: aliasTo(usePostgres ? 'postgresFlippersFavoritesBuildingsService' : 'couchbaseUsersRepository'),
  })
}
