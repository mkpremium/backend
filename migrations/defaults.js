import {resolve} from 'path'

const DIR = typeof process.argv[2] !== 'undefined'
  ? resolve(process.argv[2])
  : resolve(__dirname, '..', 'data')

function resolvePath (filename) {
  return resolve(DIR, filename)
}

export const defaultFiles = {
  people: resolvePath('PERSONAS.csv'),
  buildings: resolvePath('EDIFICIOS.csv'),
  owners: resolvePath('PROPIETARIOS.csv'),
  calls: resolvePath('LLAMADAS.csv'),
  cross: resolvePath('CROSS_TABLE.csv'),
  entities: resolvePath('SITARR.csv')
}
