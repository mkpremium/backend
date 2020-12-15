import t from 'tcomb'
import uuid from 'uuid/v4'
import { ListQuery } from '../types/params'
import { StringSplitList } from '../types/refinement'

t.NoteBody = t.struct({
  note: t.String,
  context: t.Object
}, 'NoteBody')

t.NoteListQuery = ListQuery.extend(
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

export const TNote = t.struct(
  {
    id: t.String,
    note: t.String,
    createdAt: t.Date,
    createdBy: t.String,
    context: t.struct({
      buildingId: t.String
    }),
    _documentType: t.enums.of(['note'])
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

t.NoteListResponse = t.struct(
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
