import t from 'tcomb';
import {CouchbaseModel} from '../db/model';
import fromJSON from 'tcomb/lib/fromJSON';

import {addBetweenQueryToBuilder, addDateQueryToBuilder} from '../lib/query/helpers';
import {saveNoteToFirebase} from '../firebase/lib/business';

export class Note extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Note;
  }
}

export class NoteRepository extends Note {
  async createNote(params = {}, createdBy) {
    const noteBody = t.NoteBody(params);
    const note = await this.save(t.update(noteBody, {$merge: {createdBy}}));
    await saveNoteToFirebase(note);
    return note;
  }

  async listNotes(query = {}) {
    const params = fromJSON(query, t.NoteListQuery);
    const qb = this.getQueryBuilder()
      .limit(params.limit)
      .offset(params.offset);
    const qbCount = this.getQueryBuilder('count');

    if (params.createdBy) {
      qb.where('createdBy = ?', params.createdBy);
      qbCount.where('createdBy = ?', params.createdBy);
    }

    if (params.createdAt) {
      addDateQueryToBuilder(qb, 'createdAt', params.createdAt);
      addDateQueryToBuilder(qbCount, 'createdAt', params.createdAt);
    } else if (params.createdBetween) {
      addBetweenQueryToBuilder(qb, 'createdBetween', params.createdBetween);
      addBetweenQueryToBuilder(qbCount, 'createdBetween', params.createdBetween);
    }

    if (params.context) {
      const context = JSON.parse(params.context);
      Object.keys(context).forEach(key => {
        qb.where(`context.${key} = ?`, context[key]);
        qbCount.where(`context.${key} = ?`, context[key]);
      });
    }

    const total = await this.countQuery(qbCount);
    const results = await this.query(qb);

    return fromJSON({total, results}, t.NoteListResponse);
  }
}
