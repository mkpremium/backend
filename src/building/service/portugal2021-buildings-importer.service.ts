import * as TE from 'fp-ts/TaskEither'
import { Portugal2021BuildingsRepository } from '../repository/portugal2021-buildings.repository'
import { pipe } from 'fp-ts/function'
import { BuildingsRepository } from '../repository/buildings.repository'
import { fromPromise } from '../../infrastructure/fp-utils'

export interface ImportSlugCommand {
  slug: string
}

export class Portugal2021BuildingsImporterService {
  constructor (
    private portugal2021BuildingsRepository: Portugal2021BuildingsRepository,
    private buildingsRepository: BuildingsRepository,
  ) {
  }

  importSlug (cmd: ImportSlugCommand): TE.TaskEither<Error, any> {
    return pipe(
      this.portugal2021BuildingsRepository.pendingWithSlug(cmd.slug),
      TE.chain(buildings => {
        const sourceBuilding = this.mergeBuildings(buildings)
        const parsedBuilding = Portugal2021BuildingsImporterService.parseBuilding(sourceBuilding)

        return pipe(
          fromPromise(this.buildingsRepository.save(parsedBuilding)),
          TE.chain((building) => {
            return this.portugal2021BuildingsRepository.save({
              ...sourceBuilding,
              status: 'BUILDING_IMPORTED',
              importedWithBuildingId: building.id,
              statusChangedAt: new Date(),
            })
          }),
          TE.chain(() => {
            if (buildings.length === 1) {
              return TE.of(undefined)
            }
            return TE.sequenceSeqArray(
              buildings.slice(1).map(b => this.portugal2021BuildingsRepository.save({
                ...b,
                status: 'MERGED',
                mergeWith: sourceBuilding.id,
                statusChangedAt: new Date(),
              }))
            )
          }),
          TE.orElse(error => {
            return this.portugal2021BuildingsRepository.save({
              ...sourceBuilding,
              status: 'FAILED',
              failure: error.message,
              statusChangedAt: new Date(),
            })
          }),
          TE.chain(() => TE.of(sourceBuilding))
        )
      }),
    )
  }

  private mergeBuildings (buildings) {
    const sourceBuilding = buildings[ 0 ]
    buildings.slice(1).forEach(b => {
      sourceBuilding.address.floorArea = sourceBuilding.address.floorArea || b.address.floorArea
      sourceBuilding.address.usage = sourceBuilding.address.usage || b.address.usage
      sourceBuilding.address.militaryGeo = {
        x: sourceBuilding.address.militaryGeo.x || b.address.militaryGeo.x,
        y: sourceBuilding.address.militaryGeo.y || b.address.militaryGeo.y,
      }
      sourceBuilding.owners = sourceBuilding.owners.concat(b.owners)
    })

    return sourceBuilding
  }

  private static parseBuilding (building) {
    const {
      address: {
        cadastreReferenceA,
        cadastreReferenceAM,
        city,
        neighborhood,
        number,
        street,
        type,
        floorArea,
        militaryGeo,
        usage,
      }
    } = building

    return {
      address: {
        type,
        street,
        number: number || 'SN',
        city,
        neighborhood,
        fullAddress: `${type} ${street} ${number}, ${city}`,
        province: Portugal2021BuildingsImporterService.inferProvince(city),
      },
      floorArea: floorArea || '',
      use: usage,
      portugalSpecific: {
        militaryGeo,
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
