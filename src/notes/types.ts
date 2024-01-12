import t from 'tcomb'
import uuid from 'uuid/v4'
import { ListQuery } from '../types/params'


export type Note = {
  id: string,
  note: string,
  createdAt?: Date,
  createdBy: string,
  context: { buildingId: string }
}

export const TNote = t.struct<Note>(
  {
    id: t.String,
    note: t.String,
    createdAt: t.Date,
    createdBy: t.String,
    context: t.struct({
      buildingId: t.String
    }),
    _documentType: t.enums.of([ 'note' ])
  },
  {
    name: 'Note',
    defaultProps: {
      _documentType: 'note',
      get id () {
        return uuid()
      },
      get createdAt () {
        return new Date()
      }
    }
  }
)

export interface NoteListResponse {
  results: Note[],
}

export const NoteListResponse = t.struct<NoteListResponse>(
  {
    results: t.list(TNote)
  },
  {
    name: 'NoteListResponse',
    defaultProps: {
      results: []
    }
  }
)

export interface CreateNoteCommand {
  note: string,
  context: { buildingId: string }
}

export const NoteBody = t.struct<CreateNoteCommand>({
  note: t.String,
  context: t.Object
})

export const NoteListQuery = ListQuery.extend(
  {
    context: t.struct({
      buildingId: t.String
    })
  },
  {
    name: 'NoteListQuery',
    defaultProps: {
      createdBetween: ','
    }
  }
)
