import axios from 'axios';
import https from 'https';

export default (config) => axios.create(Object.assign({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  headers: {
    'Content-Type': 'text/xml'
  }
}, config));
