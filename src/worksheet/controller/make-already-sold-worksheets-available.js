import { logger } from '../../infrastructure/logger'

export const createMakeAlreadySoldWorksheetAvailable = (worksheetRepository, eventBus) => async (req, res) => {
  res.sendStatus(202)

  const worksheetIds = await worksheetRepository.getAllWorksheetIdForAlreadySoldBuildings()
  logger.info('starting to make worksheets available to callcenter', { count: worksheetIds.length, worksheetIds })

  worksheetIds.forEach(async (id) => {
    const worksheet = await worksheetRepository.get(id)
    const availableWorksheet = worksheet.makeAvailable()

    await worksheetRepository.save(availableWorksheet)
    eventBus.publish({ name: 'worksheet.made_available', buildingId: worksheet.relatedBuildingIds[ 0 ] })
  })
}
