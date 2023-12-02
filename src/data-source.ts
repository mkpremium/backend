import 'reflect-metadata'
import { DataSource } from 'typeorm'
import urlparse from 'url-parse'
import { Building } from './building/building.entity'
import { BuildingImage } from './building/building-image.entity'
import { DealProposal } from './building/deal-proposal.entity'
import { DomainEvent } from './infrastructure/postgres/domain-event.entity'
import { Flipper } from './flipper/flipper.entity'
import { User } from './user/user.entity'
import { Owner } from './owner/owner.entity'
import { CouchbaseDocument } from './infrastructure/postgres/couchbase-document.entity'


const parsedDSN = urlparse(process.env[ 'DATABASE_URL' ])
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: parsedDSN.hostname,
  port: parseInt(parsedDSN.port) || 5432,
  username: parsedDSN.username,
  password: parsedDSN.password,
  database: parsedDSN.pathname.substring(1), // remove slash
  synchronize: process.env.NODE_ENV === 'dev',
  logging: false,
  entities: [
    Building,
    BuildingImage,
    CouchbaseDocument,
    DealProposal,
    DomainEvent,
    Flipper,
    Owner,
    User,
  ],
  migrations: [
    'migrations/*.ts'
  ],
  subscribers: [],
})

export async function initializeDataSource () {
  await AppDataSource.initialize()
  return AppDataSource
}
