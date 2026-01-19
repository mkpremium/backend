import { DataSource } from 'typeorm'
import { Flipper } from '../flipper.entity'
import { AddUserService } from '../../user/service/add-user.service'
import { UserProfileProps } from '../../types/user'

export interface AddFlipperCommand {
  username: string
  password: string
  profile: UserProfileProps
}

export class AddFlipperService {
  constructor (
    private ormDataSource: DataSource,
    private addUserService: AddUserService
  ) {
  }

  addFlipper (cmd: AddFlipperCommand): Promise<Flipper> {
    return this.ormDataSource.transaction<Flipper>(async (em) => {
      const user = await this.addUserService.addUserService({
        em,
        password: cmd.password,
        username: cmd.username,
        profile: cmd.profile,
        enabled: true
      })
      return em.save(Flipper, { user })
    })
  }
}
