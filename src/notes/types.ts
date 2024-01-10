import t from 'tcomb'
import uuid from 'uuid/v4'
import { ListQuery } from '../types/params'
import { StringSplitList } from '../types/refinement'


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
  total: number,
  results: Note[],
}

export const NoteListResponse = t.struct<NoteListResponse>(
  {
    total: t.Number,
    results: t.list(TNote)
  },
  {
    name: 'NoteListResponse',
    defaultProps: {
      total: 0,
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
    createdBy: t.maybe(t.String),
    createdAt: t.maybe(t.Date),
    createdBetween: t.maybe(StringSplitList),
    context: t.maybe(t.String)
  },
  {
    name: 'NoteListQuery',
    defaultProps: {
      createdBetween: ','
    }
  }
)
