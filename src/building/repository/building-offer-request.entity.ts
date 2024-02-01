import { Entity, ManyToOne } from 'typeorm'
import { Flipper } from '../../flipper/flipper.entity'
import { BaseEntity } from '../../infrastructure/entity'
import { Owner } from '../../owner/owner.entity'
import { Building } from '../building.entity'
import { Caller } from '../../caller/caller.entity'
import { Contact } from '../../contacts/contact.entity'

@Entity()
export class BuildingOfferRequest extends BaseEntity {
  @ManyToOne(() => Flipper, { nullable: false })
  flipper: Flipper

  @ManyToOne(() => Owner, { nullable: false })
  owner: Owner

  @ManyToOne(() => Contact, { nullable: false })
  contact: Contact

  @ManyToOne(() => Building, { nullable: false })
  building: Building

  @ManyToOne(() => Caller, { nullable: false })
  caller: Caller
}
