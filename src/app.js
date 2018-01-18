import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import morgan from 'morgan';
import cors from 'cors';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());
app.use(morgan('dev'));
app.use(cors());


import couchbase from './couchbase';

Object.assign(app.locals, couchbase);

export default app;