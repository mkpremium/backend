import { Column, Entity, ManyToOne } from 'typeorm'
import { BaseEntity } from '../infrastructure/entity'
import { Owner } from '../owner/owner.entity'
import { Building } from './building.entity'
import { User } from '../user/user.entity'
import { DecimalColumnTransformer } from '../infrastructure/postgres/decimal-column-transformer'

@Entity()
export class Proposal extends BaseEntity {
  @Column('text')
  status: 'ACCEPTED' | 'SENT' | 'PENDING'

  @ManyToOne(() => Building, building => building.proposals)
  building: Building

  @ManyToOne(() => Owner)
  owner: Owner

  @ManyToOne(() => User)
  author: User

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: new DecimalColumnTransformer() })
  amount: number

  @Column()
  notificationEmail: string

  @Column('text')
  notificationStatus: 'PENDING' | 'SENT' | 'DISABLED'

  @Column({ type: 'timestamptz', nullable: true })
  notificationSentAt?: Date

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'numeric', nullable: true })
  aspiration?: number;
}
