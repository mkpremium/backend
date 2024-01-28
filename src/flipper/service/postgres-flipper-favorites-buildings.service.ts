import { EntityManager } from 'typeorm';
import { UserProps } from '../../types/user';
import { Flipper } from '../flipper.entity'
import { FlipperFavoritesBuildingsService } from "./flipper-favorites-buildings.service";
import { Building } from "../../building/building.entity";
import { fromPromise } from "../../infrastructure/fp-utils";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { map } from "fp-ts/TaskEither";
import { User } from "../../user/user.entity";
import { mapUserEntityToStruct } from "../../user/repository/postgres-user.repository";

export class PostgresFlippersFavoritesBuildingsService implements FlipperFavoritesBuildingsService {
  constructor(private entityManager: EntityManager) {
  }

  async addFavoriteBuildingToUserOfId(flipperUserId: string, buildingId: string): Promise<void> {
    const flipper = await this.getFlipper(flipperUserId);

    if (!flipper.favoriteBuildings.find((b) => b.id === buildingId)) {
      const building = await this.entityManager.findOneByOrFail(Building, {id: buildingId})
      flipper.favoriteBuildings.push(building);
      await this.entityManager.save(flipper);
    }
  }

  async removeFavoriteBuildingToUserOfId(flipperUserId: string, buildingId: string): Promise<void> {
    const flipper = await this.getFlipper(flipperUserId);

    flipper.favoriteBuildings = flipper.favoriteBuildings.filter(b => b.id !== buildingId);
    await this.entityManager.save(flipper);
  }

  withFavoriteBuilding(buildingId: string): TE.TaskEither<Error, UserProps | undefined> {
    return pipe(
      fromPromise(this.entityManager.findOne(User, {
        where: {
          flipper: {
            favoriteBuildings: {id: buildingId},
          }
        },
        relations: {
          flipper: true,
          caller: {
            flipper: true
          },
        }
      })),
      map(flipperUser => {
        if (!flipperUser) {
          return
        }

        return mapUserEntityToStruct(flipperUser)
      })
    )
  }

  private getFlipper(flipperUserId: string) {
    return this.entityManager.findOneOrFail(Flipper, {
      where: {user: {id: flipperUserId}},
      relations: {
        favoriteBuildings: true,
      }
    });
  }
}
