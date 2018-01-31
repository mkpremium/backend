import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';

import couchbase from './db/couchbase';
// import jwt from './middleware/jwt';
// import numintec from './numintec';
import operator from './operator';
import swagger from './swagger';

// import migration from './migration';

// app aware types
import './types';
import appErrorHandler from './lib/error-handler';

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());
swagger(app);
// app.use(jwt());
couchbase(app);
// app.use(numintec());
// app.use(migration());
operator(app);

app.use(appErrorHandler);

export default app;
