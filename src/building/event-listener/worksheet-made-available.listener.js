import { TNote } from '../../notes/types'

export const createWorksheetMadeAvailableListener = ({ buildingNotesRepository }) => async ({ buildingId }) => {
  const note = TNote({
    note: 'Ficha devuelta al callcenter',
    createdBy: 'SYSTEM',
    context: { buildingId }
  })
  await buildingNotesRepository.save(note)
}
