import * as TE from 'fp-ts/TaskEither'
import { Portugal2021BuildingsRepository } from '../repository/portugal2021-buildings.repository'
import { OwnerRepository } from '../../owner/repository/owner.repository'
import { pipe } from 'fp-ts/lib/function'
import uuid from 'uuid/v4'
import uniq from 'lodash/uniq'
import { Owner } from '../../owner/owner'
import { fromPromise } from '../../infrastructure/fp-utils'
import moment from 'moment'

export interface ImportOwnersOfCommand {
  sourceBuildingId: string
}

export class Portugal2021OwnersImporterService {
  constructor (
    private portugal2021BuildingsRepository: Portugal2021BuildingsRepository,
    private ownersRepository: OwnerRepository,
  ) {
  }

  importOwnersOf (cmd: ImportOwnersOfCommand): TE.TaskEither<Error, void> {
    const now = moment().format()
    return pipe(
      this.portugal2021BuildingsRepository.get(cmd.sourceBuildingId),
      TE.chain((sourceBuilding) => {
        const { importedWithBuildingId, owners } = sourceBuilding
        return pipe(
          this.portugal2021BuildingsRepository.phoneNumbersFor(owners.map(({ dni }) => dni)),
          TE.chain((phoneNumbers) => {
            return TE.sequenceSeqArray(
              owners.map(o => {
                const contacts = uniq(phoneNumbers.find(({ id }) => id === o.dni)!.phones).map(phoneNumber => ({
                  id: uuid(),
                  value: phoneNumber,
                  status: 'UNDEFINED',
                  type: 'TELEFONO'
                }))

                return Owner({
                  id: uuid(),
                  type: 'NINGUNO',
                  status: 'NO_VERIFICADO',
                  buildingId: importedWithBuildingId,
                  name: o.name,
                  note: `Import Portugal2021 ${now}`,
                  person: {
                    name: o.name,
                    documentNumber: o.dni,
                    addresses: [ { fullAddress: o.address } ],
                    contacts,
                  }
                })
              })
                .map((o: any) => fromPromise(this.ownersRepository.save(o)
                  .then(({ id }) => ({ id: id as string, dni: o.person.documentNumber as string }))))
            )
          }),
          TE.chain((importedOwners: {dni: string; id: string}[]) => {
            return this.portugal2021BuildingsRepository.save({
              ...sourceBuilding,
              status: 'OWNERS_IMPORTED',
              importedOwners: importedOwners,
              statusChangedAt: new Date(),
            })
          })
        )
      })
    )
  }
}
