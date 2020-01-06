import debug from 'debug'
import {BuildingRepository} from '../../src/building/models'
import Promise from 'bluebird'
import {WorksheetRepository} from '../../src/worksheet/models/worksheet'
import {WorkSheetStatus} from '../../src/types/worksheet'
import _ from 'lodash'

const debugQuery = debug('app:query:invalid-worksheets')

/**
 *
 * @returns {Promise<void>}
 */
export async function getList () {
  debugQuery('Process started...')
  const worksheets = await getInvalidWorksheets()
  const worksheetWithNoBuilding = []
  const worksheetsInvalidIdsWithAtLeastOneNote = []
  const worksheetsInvalidWithAtLeastOneNote = []
  const worksheetIdsInvalidWithNoNotes = []

  await Promise.mapSeries(worksheets, async (worksheet) => {
    try {
      if (worksheet.relatedBuildingIds && worksheet.relatedBuildingIds.length) {
        const buildingId = _.first(worksheet.relatedBuildingIds)
        const notesIds = await getBuildingNotes(buildingId)

        if (notesIds && notesIds.length) {
          worksheetsInvalidIdsWithAtLeastOneNote.push(worksheet.id)
          worksheetsInvalidWithAtLeastOneNote.push({
            worksheet: worksheet,
            notesIds: notesIds
          })
        } else {
          worksheetIdsInvalidWithNoNotes.push(worksheet.id)
        }
      } else {
        worksheetWithNoBuilding.push(worksheet.id)
      }
    } catch (e) {
      debug('Error', e)
    }
  })

  debugQuery('Worksheets ids inválidas y con al menos una nota:', JSON.stringify(worksheetsInvalidIdsWithAtLeastOneNote, null, 2))
  debugQuery('Worksheets inválidas y con al menos una nota - info:', JSON.stringify(worksheetsInvalidWithAtLeastOneNote, null, 2))
  // debugQuery('Worksheets invalid without notes:',  JSON.stringify(worksheetIdsInvalidWithNoNotes, null, 2));
  // debugQuery('Worksheets invalid without building:',  JSON.stringify(worksheetWithNoBuilding, null, 2));
  debugQuery('Process ended.')
}

/**
 * Get building notes
 * @param buildingId
 * @returns {Promise<void>}
 */
async function getBuildingNotes (buildingId) {
  const buildingRepository = new BuildingRepository()
  return buildingRepository.getBuildingNotesIds(buildingId)
}

async function getInvalidWorksheets () {
  const worksheetRepository = new WorksheetRepository()
  return worksheetRepository.findWorksheetsByStatus(WorkSheetStatus.INVALID)
}
