import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import morgan from 'morgan';
import cors from 'cors';
import couchbase from './db/couchbase';
import jwt from './middleware/jwt';
import numintec from './numintec';
import operator from './operator';

import migration from './migration';

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(fileUpload());
app.use(morgan('dev'));
app.use(cors());
app.use(jwt());
app.use(couchbase());
app.use(numintec());
app.use(migration());
app.use(operator());

export default app;
