import { expect } from 'chai'
import { AppDataSource } from '../../../src/data-source'
import { PostgresCallScheduleRepository } from '../../../src/call/repository/postgres-call-schedule.repository'

describe('PostgresCallScheduleRepository', () => {
  let repository: PostgresCallScheduleRepository

  before(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }

    repository = new PostgresCallScheduleRepository()
  })

  beforeEach(async () => {
    await AppDataSource.query(`
      DELETE FROM public.call_schedule
      WHERE city IN ('TEST_CITY')
    `)

    await AppDataSource.query(`
      INSERT INTO public.call_schedule (
        city,
        daily_limit,
        daily_remaining_buildings,
        days,
        start_hour,
        end_hour
      )
      VALUES (
        'TEST_CITY',
        5,
        3,
        '1-5',
        '10:00',
        '18:00'
      )
    `)
  })

  afterEach(async () => {
    await AppDataSource.query(`
      DELETE FROM public.call_schedule
      WHERE city IN ('TEST_CITY')
    `)
  })

  after(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
    }
  })

  it('gets daily remaining buildings by city', async () => {
    const remaining = await repository.getDailyRemainingBuildings('TEST_CITY')

    expect(remaining).to.equal(3)
  })

  it('returns null when city does not exist', async () => {
    const remaining = await repository.getDailyRemainingBuildings('UNKNOWN_CITY')

    expect(remaining).to.equal(null)
  })

  it('decrements daily remaining buildings', async () => {
    await repository.updateDailyRemainingBuildings('TEST_CITY')

    const remaining = await repository.getDailyRemainingBuildings('TEST_CITY')

    expect(remaining).to.equal(2)
  })

  it('does not decrement below zero', async () => {
    await AppDataSource.query(`
      UPDATE public.call_schedule
      SET daily_remaining_buildings = 0
      WHERE city = 'TEST_CITY'
    `)

    await repository.updateDailyRemainingBuildings('TEST_CITY')

    const remaining = await repository.getDailyRemainingBuildings('TEST_CITY')

    expect(remaining).to.equal(0)
  })

  it('resets daily remaining buildings to daily limit', async () => {
    await AppDataSource.query(`
    UPDATE public.call_schedule
    SET daily_limit = 5,
        daily_remaining_buildings = 0
    WHERE city = 'TEST_CITY'
  `)

    await repository.resetDailyRemainingBuildings()

    const [row] = await AppDataSource.query(`
    SELECT daily_limit, daily_remaining_buildings
    FROM public.call_schedule
    WHERE city = 'TEST_CITY'
  `)

    expect(row.daily_limit).to.equal(5)
    expect(row.daily_remaining_buildings).to.equal(5)
  })
})
