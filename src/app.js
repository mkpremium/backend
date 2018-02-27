import Promise from 'bluebird';
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';

import couchbase from './db/couchbase';

// app aware types
import './types';

// modules
import operator from './operator';
import worksheet from './worksheet';
import owner from './owner';
import swagger from './swagger';
import calls from './calls';
import socket from './socket';

import appErrorHandler from './lib/error-handler';

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(cors());
swagger(app);
Promise.all([
  couchbase(app),
  socket(app)
]).catch(err => {
  console.error(err);
});
operator(app);
worksheet(app);
owner(app);
calls(app);
app.use(appErrorHandler);

export default app;
