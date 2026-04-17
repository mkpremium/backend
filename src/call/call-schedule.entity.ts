import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'call_schedule' })
export class CallSchedule {
    @PrimaryColumn()
    city!: string

    @Column({ type: 'int', name: 'daily_limit' })
    limit!: number

    @Column({ type: 'time', name: 'start_hour' })
    startHour!: string

    @Column({ type: 'time', name: 'end_hour' })
    endHour!: string

    @Column({ type: 'text' })
    days!: string

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt!: Date

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt!: Date
}
