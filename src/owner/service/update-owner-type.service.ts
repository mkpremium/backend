import { OwnerType } from '../owner'
import { Logger } from 'winston'
import { PostgresOwnersRepository } from '../repository/postgres-owners.repository'

export class UpdateOwnerTypeService {
  constructor (
    private ownersRepository: PostgresOwnersRepository,
    private logger: Logger
  ) {
  }

  async updateOwnerType (ownerId:string, type:OwnerType): Promise<void> {
    await this.ownersRepository.updateOwnerType(ownerId, type)
    this.logger.info('Owner Type Updated')
  }
}
