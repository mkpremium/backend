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
import scheduledEvents from './scheduledEvents';
import migration from './migration';
import webhooks from './webhooks';
import socket from './socket';
import history from './history';
import notes from './notes';
import building from './building';
import metadata from './metadata';
import people from './person';
import stats from './stats';
import street from './street';
import autocomplete from './autocomplete';

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
  socket.initModel()
]).catch(err => {
  console.error(err);
});
operator(app);
worksheet(app);
owner(app);
calls(app);
scheduledEvents(app);
history(app);
migration(app);
webhooks(app);
notes(app);
building(app);
metadata(app);
people(app);
stats(app);
street(app);
autocomplete(app);

app.use(appErrorHandler);

export default app;
