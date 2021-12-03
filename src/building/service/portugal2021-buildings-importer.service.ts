import * as TE from 'fp-ts/TaskEither'
import { Portugal20210BuildingsRepository } from '../repository/portugal20210-buildings.repository'
import { pipe } from 'fp-ts/function'
import { BuildingsRepository } from '../repository/buildings.repository'
import { fromPromise } from '../../infrastructure/fp-utils'

export interface ImportSlugCommand {
  slug: string
}

export class Portugal2021BuildingsImporterService {
  constructor (
    private portugal20210BuildingsRepository: Portugal20210BuildingsRepository,
    private buildingsRepository: BuildingsRepository,
  ) {
  }

  importSlug (cmd: ImportSlugCommand): TE.TaskEither<Error, void> {
    return pipe(
      this.portugal20210BuildingsRepository.pendingWithSlug(cmd.slug),
      TE.chain(buildings => {
        const sourceBuilding = buildings[ 0 ]
        const parsedBuilding = Portugal2021BuildingsImporterService.parseBuilding(sourceBuilding)
        return fromPromise(this.buildingsRepository.save(parsedBuilding).then(() => sourceBuilding))
      }),
      TE.chain((sourceBuilding) => {
        return this.portugal20210BuildingsRepository.save({
          ...sourceBuilding,
          status: 'BUILDING_IMPORTED',
          statusChangedAt: new Date(),
        })
      })
    )
  }

  private static parseBuilding (building) {
    const {
      id,
      address: {
        cadastreReferenceA,
        cadastreReferenceAM,
        city,
        neighborhood,
        number,
        street,
        type,
        floorArea,
        portugalSpecific,
        usage,
      }
    } = building

    return {
      id,
      address: {
        type,
        street,
        number,
        city,
        neighborhood,
        fullAddress: `${type} ${street} ${number}, ${city}`,
        province: Portugal2021BuildingsImporterService.inferProvince(city),
      },
      floorArea: floorArea,
      use: usage,
      portugalSpecific: {
        militaryGeo: portugalSpecific,
        artigo: cadastreReferenceA,
        artigoMatricial: cadastreReferenceAM,
      }
    }
  }

  private static inferProvince (city) {
    return provincesCityMap[ city ] || ''
  }
}

const provincesCityMap = {
  'BONFIM': 'PORTO',
  'PORTO': 'PORTO',
  'LISBOA': 'LISBOA',
  'VILA NOVA DE GAIA': 'PORTO',
  'PARQUE DAS NACOES': 'LISBOA',
}
