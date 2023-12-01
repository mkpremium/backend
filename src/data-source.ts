import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from './entity/User'
import urlparse from 'url-parse'


const parsedDSN = urlparse(process.env['DATABASE_URL'])
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: parsedDSN.hostname,
  port: parseInt(parsedDSN.port) || 5432,
  username: parsedDSN.username,
  password: parsedDSN.password,
  database: parsedDSN.pathname.substring(1), // remove slash
  synchronize: process.env.NODE_ENV === 'dev',
  logging: false,
  entities: [],
  migrations: [],
  subscribers: [],
})

export async function initializeDataSource () {
  await AppDataSource.initialize()
  return AppDataSource
}
