import t from 'tcomb'
import uuid from 'uuid/v4'
import { Building } from '../types/building'
import { Worksheet, WorkSheetStatus } from '../types/worksheet'

export const CreateWorksheetRequest = t.struct({
  building: Building,
  status: t.maybe(t.enums(WorkSheetStatus)),
  ownerId: t.String
})

export const createBuildingWorksheetFactory = worksheetRepository => req => {
  t.assert(CreateWorksheetRequest.is(req))
  const { building, ownerId, status } = req
  return worksheetRepository.save(Worksheet({
    id: uuid(),
    relatedBuildingIds: [ building.id ],
    buildingId: building.id,
    buildingAddress: building.address,
    relatedOwnerIds: [ ownerId ],
    status: status || WorkSheetStatus.AVAILABLE
  }))
}
