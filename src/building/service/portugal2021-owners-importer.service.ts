import * as TE from 'fp-ts/TaskEither'
import { Portugal2021BuildingsRepository } from '../repository/portugal2021-buildings.repository'
import { OwnerRepository } from '../../owner/repository/owner.repository'
import { pipe } from 'fp-ts/lib/function'
import uuid from 'uuid/v4'
import uniq from 'lodash/uniq'
import { Owner } from '../../owner/owner'
import { fromPromise } from '../../infrastructure/fp-utils'
import moment from 'moment'
import { Logger } from '../../infrastructure/logger'

export interface ImportOwnersOfCommand {
  sourceBuildingId: string
}

export class Portugal2021OwnersImporterService {
  constructor (
    private portugal2021BuildingsRepository: Portugal2021BuildingsRepository,
    private ownersRepository: OwnerRepository,
    private logger: Logger,
  ) {
  }

  importOwnersOf (cmd: ImportOwnersOfCommand): TE.TaskEither<Error, void> {
    const now = moment().format()
    return pipe(
      this.portugal2021BuildingsRepository.get(cmd.sourceBuildingId),
      TE.chain((sourceBuilding) => {
        const { importedWithBuildingId, owners: sourceOwners } = sourceBuilding
        return pipe(
          this.portugal2021BuildingsRepository.phoneNumbersFor(sourceOwners.map(({ dni }) => dni)),
          TE.chain((phoneNumbers) => {
            return TE.sequenceSeqArray(
              sourceOwners.map(this.toOwner(phoneNumbers, importedWithBuildingId, now))
                .filter(Boolean)
                .map((o: any) => fromPromise(this.ownersRepository.save(o)
                  .then(({ id }) => ({ id: id as string, dni: o.person.documentNumber as string }))))
            )
          }),
          TE.chain(this.updateWithSuccessfulStatus(sourceBuilding)),
          TE.orElse(this.handleError(sourceBuilding))
        )
      })
    )
  }

  private toOwner (phoneNumbers, importedWithBuildingId, now: string) {
    return sourceOwner => {
      const phonesForDNI = phoneNumbers.find(({ id }) => id === sourceOwner.dni)
      if (!phonesForDNI) {
        this.logger.warning('No phones found for owner', { dni: sourceOwner.dni })
        return undefined
      }
      const contacts = uniq(phonesForDNI.phones).map(phoneNumber => ({
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
        name: sourceOwner.name,
        note: `Import Portugal2021 ${now}`,
        person: {
          name: sourceOwner.name,
          documentNumber: sourceOwner.dni,
          addresses: [ { fullAddress: sourceOwner.address } ],
          contacts,
        }
      })
    }
  }

  private updateWithSuccessfulStatus (sourceBuilding) {
    return (importedOwners: { dni: string; id: string }[]) => {
      return this.portugal2021BuildingsRepository.save({
        ...sourceBuilding,
        status: 'OWNERS_IMPORTED',
        importedOwners: importedOwners,
        statusChangedAt: new Date(),
        failure: undefined,
      })
    }
  }

  private handleError (sourceBuilding) {
    return error => {
      this.logger.error('Owner import failed', { error: error.message, stack: error.stack })

      return this.portugal2021BuildingsRepository.save({
        ...sourceBuilding,
        status: 'FAILED',
        previousStatus: sourceBuilding.status,
        statusChangedAt: new Date(),
        failure: error.message,
      })
    }
  }
}
