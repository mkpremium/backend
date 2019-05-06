import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import ui from 'swagger-ui-dist';
import {resolve} from 'path';
import {socket} from '../../config';

const swaggerDefinition = require('./swaggerDef');
const options = {
  swaggerDefinition,
  apis: [
    resolve(__dirname, '../**/*.js')
  ]
};

let specs;

try {
  specs = swaggerJSDoc(options);
} catch (e) {
  console.error(e.mark);
  throw e;
}

function apiJSON(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
}

function socketSample(req, res) {
  res.render('socket', {
    socketPort: socket.port,
    socketServer: socket.server
  });
}

export default (app) => {
  app.set('view engine', 'ejs');
  app.set('views', resolve(__dirname, 'views'));
  app.use('/docs', express.static(resolve(__dirname, 'public')));
  app.use('/docs', express.static(ui.getAbsoluteFSPath()));
  app.get('/docs/api.json', apiJSON);
  app.get('/docs/socket', socketSample);
};
