import { Entity, ManyToOne } from 'typeorm'
import { Flipper } from '../../flipper/flipper.entity'
import { BaseEntity } from '../../infrastructure/entity'
import { Owner } from '../../owner/owner.entity'
import { Worksheet } from '../../worksheet/worksheet.entity'
import { Building } from '../building.entity'
import { Caller } from '../../caller/caller.entity'
import { Contact } from '../../contacts/contact.entity'

@Entity()
export class BuildingOfferRequest extends BaseEntity {
  @ManyToOne(() => Flipper)
  flipper: Flipper

  @ManyToOne(() => Owner)
  ownerId: Owner

  @ManyToOne(() => Contact)
  contact: Contact

  @ManyToOne(() => Worksheet)
  worksheetId: Flipper

  @ManyToOne(() => Building)
  building: Building

  @ManyToOne(() => Caller)
  caller: Caller
}
