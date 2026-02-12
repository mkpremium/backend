import { Entity, Column, PrimaryColumn } from 'typeorm'

@Entity({ name: 'call_schedule' })
export class CallSchedule {
    @PrimaryColumn()
    city: string

    @Column({ type: 'int', name: 'daily_limit' })
    limit: number

    @Column({ type: 'time', name: 'start_hour' })
    startHour: string

    @Column({ type: 'time', name: 'end_hour' })
    endHour: string

    @Column({ type: 'text' })
    days: string
}
