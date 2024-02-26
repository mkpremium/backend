import 'reflect-metadata'
import { DataSource } from 'typeorm'
import urlparse from 'url-parse'
import path from 'path'

const parsedDSN = urlparse(process.env.DATABASE_URL)
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: parsedDSN.hostname,
  port: parseInt(parsedDSN.port) || 5432,
  username: parsedDSN.username,
  password: parsedDSN.password,
  database: parsedDSN.pathname.substring(1), // remove slash
  synchronize: ['dev', 'test'].includes(process.env.NODE_ENV),
  logging: !!process.env.DATABASE_LOG,
  entities: [
    path.join(__dirname, '**/*.entity.ts'),
    path.join(__dirname, '**/*.entity.js')
  ],
  migrations: [
    'migrations/*.ts',
    'migrations/*.js'
  ],
  subscribers: []
})

export async function initializeDataSource () {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }
  return AppDataSource
}
