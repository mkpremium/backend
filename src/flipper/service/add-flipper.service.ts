import { DataSource } from 'typeorm'
import { Flipper } from '../flipper.entity'
import { addUserService } from '../../user/service/add-user.service'

type AddFlipperCommand = {
  username: string
  password: string
}

export class AddFlipperService {
  constructor (
    private ormDataSource: DataSource
  ) {
  }

  addFlipper (cmd: AddFlipperCommand): Promise<Flipper> {
    return new Promise(resolve => {
      this.ormDataSource.transaction(async (em) => {
        const user = await addUserService({
          em,
          password: cmd.password,
          username: cmd.username,
        })
        resolve(em.save(Flipper, { user }))
      })
    })
  }
}
