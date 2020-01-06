import {BuildingRepository} from '../../src/building/models'
import {removeNullValue} from '../../src/migration/models/models-helper'
import {MigrateModelV3} from '../../src/migration/lib/migrate-model-v3'
import {NoteRepository} from '../../src/notes/models'
import {madrid} from '../../src/lib/date'

export async function migrateBuildingNotes (inputFile, bucket) {
  const migrate = new BuildingNotes(inputFile, bucket)
  await migrate.run()
}

export class BuildingNotes extends MigrateModelV3 {
  async parseToData (data, row) {
    try {
      if (isAutomaticCall(data)) {
        console.warn('row', row, 'ignored because', 'llamada automatica')
        return
      }
      await createBuildingNote(data)
    } catch (e) {
      console.error('row', row, 'ignored because', e.message)
    }
  }
}

async function createBuildingNote (data) {
  const building = await findBuilding(data)
  return migrateNote(building, data)
}

async function findBuilding (data) {
  const repo = new BuildingRepository()
  const buildingMigrateId = removeNullValue(data['ID_CATASTRO'])
  if (buildingMigrateId === null) {
    throw new Error(`invalid ID_CATASTRO '${data['ID_CATASTRO']}'`)
  }
  return repo.findOneByMigrateId(buildingMigrateId)
}

async function migrateNote (building, data) {
  const migrateId = removeNullValue(data['ID'])

  if (migrateId === null) {
    throw new Error('cannot migrate notes with invalid note ID')
  }

  const itWasMigrated = await noteWasMigrated(migrateId)

  if (itWasMigrated) {
    return
  }

  return createNote(data, building.id, migrateId)
}

async function noteWasMigrated (migrateId) {
  const repo = new NoteRepository()
  const qb = repo.getQueryBuilder()
    .where('context._migrateId = ?', migrateId)
    .limit(1)
  const result = await repo.query(qb)
  return result && result.length > 0
}

async function createNote (data, buildingId, migrateId) {
  const repo = new NoteRepository()

  const note = {
    note: noteBody(data),
    createdAt: noteDate(data),
    createdBy: 'migration',
    context: {
      buildingId: buildingId,
      _migrateId: migrateId
    }
  }
  return repo.createNoteMigration(note)
}

function noteBody (data) {
  let note = `${data['NOTAS']} - ${data['ID_OPERDADOR']}`
  const street = data['CALLE']

  if (street) {
    note += ' - ' + street
  }

  return note
}

function noteDate (data) {
  return madrid(new Date(data['FECHA'])).toDate()
}

const regexAutomaticCall = /llamada automatica/i

function isAutomaticCall (data) {
  return regexAutomaticCall.test(data['NOTAS'])
}
