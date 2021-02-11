import { TNote } from '../../notes/types'

export const createAddMeetingNoteToBuildingListener = ({ buildingNotesRepository }) => ({ buildingId, userId, note }) => {
  if (!note) {
    return Promise.resolve()
  }

  return buildingNotesRepository.save(TNote({
    createdBy: userId,
    context: { buildingId },
    note
  }))
}
