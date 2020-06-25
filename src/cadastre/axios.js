import axios from 'axios'
import https from 'https'

export const axiosCadastreClient = (config) => axios.create(Object.assign({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  headers: {
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/60.0',
    'Content-Type': 'text/xml'
  }
}, config))

export default axiosCadastreClient
