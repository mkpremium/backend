import {wrap} from 'express-promise-wrap';
import {NoteRepository} from './models';
import {History} from '../history/models';

export async function listNotes(req, res) {
  const repo = new NoteRepository();
  const result = await repo.listNotes(req.query);
  res.json(result);
}

export async function addNote(req, res) {
  const repo = new NoteRepository();
  const note = await repo.createNote(req.body, req.user.id);
  History.registerCreate({
    contextModel: note,
    user: req.user
  });
  res.status(201).json(note);
}

export const addNoteController = wrap(addNote);
export const listNotesController = wrap(listNotes);
