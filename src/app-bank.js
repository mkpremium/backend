import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';

import couchbase from './db/couchbase';

// app aware types
import './types';

// modules
import operator from './operator';
import banks from './banks';

import appErrorHandler from './lib/error-handler';

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(cors());

Promise.all([
  couchbase(app)
]).catch(err => {
  console.error(err);
});
operator(app);
banks(app);

app.use(appErrorHandler);

export default app;
