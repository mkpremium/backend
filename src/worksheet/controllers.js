import t from 'tcomb';
import {wrap} from 'express-promise-wrap';
import {WorksheetRepository} from './models/worksheet';

async function list(req, res) {
  const params = new t.ListQuery(req.query || {});
  const repo = new WorksheetRepository();
  const qb = repo.getQueryBuilder('select')
    .limit(params.limit)
    .offset(params.offset);
  const worksheets = await repo.query(qb);

  res.json(worksheets);
}

async function findById(req, res) {
  const id = req.params.id;
  const repo = new WorksheetRepository();
  const worksheet = await repo.findById(id);
  if (worksheet) {
    return res.json(worksheet);
  }

  const e = new Error(`worksheet ${id} no encontrada`);
  e.code = 404;
  throw e;
}

export const listController = wrap(list);
export const findByIdController = wrap(findById);
