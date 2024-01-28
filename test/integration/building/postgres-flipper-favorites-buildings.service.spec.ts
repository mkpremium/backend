import { expect } from 'chai';
import {
  PostgresFlippersFavoritesBuildingsService
} from '../../../src/flipper/service/postgres-flipper-favorites-buildings.service';
import { buildingFactory, userFactory } from '../../factories';
import { orFail, resolveDependencies } from "../../helpers";
import { map } from 'fp-ts/TaskEither'
import { pipe } from "fp-ts/function";

describe('PostgresFlippersFavoritesBuildingsService - Integration (Postgres)', () => {
  it('adds and removes a favorite building', async () => {
    const deps = await resolveDependencies();

    const service = deps.container.resolve('flipperFavoritesBuildingsService') as PostgresFlippersFavoritesBuildingsService;

    const testBuilding = await deps.buildingsRepository.save(buildingFactory.build());
    const testFlipper = await deps.addFlipperService.addFlipper(userFactory.build());

    // Add the building to the flipper's favorites
    await service.addFavoriteBuildingToUserOfId(testFlipper.user.id, testBuilding.id);

    // Assert the building is in the flipper's favorites
    await pipe(
      service.withFavoriteBuilding(testBuilding.id),
      map((userWithBuilding) => {
        expect(userWithBuilding).to.exist;
        expect(userWithBuilding?.id).to.equal(testFlipper.user.id);
      }),
      orFail(),
    )();

    // Remove the building from the flipper's favorites
    await service.removeFavoriteBuildingToUserOfId(testFlipper.user.id, testBuilding.id);

    // Assert the building is not in the flipper's favorites
    await pipe(
      service.withFavoriteBuilding(testBuilding.id),
      map((userWithoutBuilding) => {
        expect(userWithoutBuilding).to.be.undefined
      }),
      orFail(),
    )();
  });
});
