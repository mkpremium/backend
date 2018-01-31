import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import ui from 'swagger-ui-dist';
import {resolve} from 'path';

const swaggerDefinition = {
  swagger: '2.0',
  info: {
    title: 'MK Premium',
    version: '1.0.0',
    description: 'MK Premium for call center API'
  }
};
const options = {
  swaggerDefinition,
  apis: [
    resolve(__dirname, '../**/*.js')
  ]
};
const specs = swaggerJSDoc(options);

function apiJSON(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
}

export default (app) => {
  app.use('/docs', express.static(resolve(__dirname, 'public')));
  app.use('/docs', express.static(ui.getAbsoluteFSPath()));
  app.get('/docs/api.json', apiJSON);
};
