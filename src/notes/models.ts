import t from 'tcomb'
import { CouchbaseModel } from '../db/model'
import { CreateNoteCommand, NoteBody, TNote } from './types'


export class NoteRepository extends CouchbaseModel {
  Struct = TNote

  createNote (params: CreateNoteCommand, createdBy: string) {
    const noteBody = NoteBody(params)
    return this.save(t.update(noteBody, { $merge: { createdBy } }))
  }
}
