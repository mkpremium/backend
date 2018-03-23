import t from 'tcomb';
import {CouchbaseModel} from '../db/model';
import fromJSON from 'tcomb/lib/fromJSON';

import firebase from '../firebase';
import {addBetweenQueryToBuilder, addDateQueryToBuilder} from '../lib/query/helpers';
import {firebaseTimestampFormat} from '../lib/date';

export class Note extends CouchbaseModel {
  constructor() {
    super();
    this.Struct = t.Note;
  }
}

function noteWithTimestamp(note) {
  const json = JSON.parse(JSON.stringify(note));
  const timestamp = firebaseTimestampFormat(note.createdAt);
  return Object.assign({}, json, {timestamp});
}

export class NoteRepository extends Note {
  async firebaseNote(note) {
    const buildingId = note.context.buildingId;
    if (!buildingId) {
      return;
    }

    const db = firebase.database();
    const noteRef = db.ref(`Notes/${note.id}`);
    noteRef.set(noteWithTimestamp(note));

    const buildingNotesRef = db.ref(`Buildings/${buildingId}/Notes`);
    buildingNotesRef.child('LastNote').set(note.note);
    buildingNotesRef.child('ids').update({[note.id]: true});
  }

  async createNote(params = {}, createdBy) {
    const noteBody = t.NoteBody(params);
    const note = await this.save(t.update(noteBody, {$merge: {createdBy}}));
    await this.firebaseNote(note);
    return note;
  }

  async listNotes(query = {}) {
    console.log(query);
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
