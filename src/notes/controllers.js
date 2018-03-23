import {wrap} from 'express-promise-wrap';
import {NoteRepository} from './models';
import {History} from '../history/models';
import {WorksheetRepository} from '../worksheet/models/worksheet';

export async function listNotes(req, res) {
  const repo = new NoteRepository();
  const result = await repo.listNotes(req.query);
  res.json(result);
}

export async function addNote(req, res) {
  const repo = new NoteRepository();
  const note = await repo.createNote(req.body, req.user.id);
  if (note.context.worksheetId) {
    await WorksheetRepository.notifyWorksheetUpdate(note.context.worksheetId);
  }
  
  History.registerCreate({
    contextModel: note,
    user: req.user
  });
  res.status(201).json(note);
}

export const addNoteController = wrap(addNote);
export const listNotesController = wrap(listNotes);
