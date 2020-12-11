import t from 'tcomb'
import uuid from 'uuid/v4'
import { Building } from '../building/building'
import { Worksheet, WorkSheetStatus } from '../worksheet/domain/worksheet'

export const CreateWorksheetRequest = t.struct({
  building: Building,
  status: t.maybe(t.enums(WorkSheetStatus)),
  ownersId: t.list(t.String)
})

export const createBuildingWorksheetFactory = worksheetRepository => req => {
  t.assert(CreateWorksheetRequest.is(req))
  const { building, ownersId, status } = req
  return worksheetRepository.save(Worksheet({
    id: uuid(),
    relatedBuildingIds: [ building.id ],
    buildingId: building.id,
    buildingAddress: building.address,
    relatedOwnerIds: ownersId,
    status: status || WorkSheetStatus.AVAILABLE
  }))
}
