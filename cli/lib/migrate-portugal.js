import debug from 'debug';
import t from 'tcomb';
import {OwnerRepository, PersonRepository} from '../../src/owner/models';
import {csvToJSON} from '../../src/migration/lib/migrate-model-v3';
import {cleanObjectKeys, removeNullValue, removeNullValues} from '../../src/migration/models/models-helper';
import uuid from 'uuid/v4';
import _ from 'lodash';
import axios from 'axios';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';
import {BuildingRepository} from '../../src/building/models';
import Promise from "bluebird";

const debugMigrate = debug('app:migration:portugal');

const requester = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api/geocode',
  params: {
    key: 'AIzaSyCUI2ZE7LZzG0V3ioe9gu8mJZKtFmQYPrY'
  }
});

export const Input = t.struct({
  id_finca: t.maybe(t.Str),
  calle: t.maybe(t.Str),
  no: t.maybe(t.Str),
  barrio: t.maybe(t.Str),
  ciudad: t.maybe(t.Str),
  matriz1: t.maybe(t.Str),
  matriz2: t.maybe(t.Str),
  matriz3: t.maybe(t.Str),
  propietario1: t.maybe(t.Str),
  dni1: t.maybe(t.Str),
  direccion1: t.maybe(t.Str),
  propietario2: t.maybe(t.Str),
  dni2: t.maybe(t.Str),
  direccion2: t.maybe(t.Str),
  propietario3: t.maybe(t.Str),
  dni3: t.maybe(t.Str),
  direccion3: t.maybe(t.Str),
  propietario4: t.maybe(t.Str),
  dni4: t.maybe(t.Str),
  direccion4: t.maybe(t.Str),
  propietario5: t.maybe(t.Str),
  dni5: t.maybe(t.Str),
  direccion5: t.maybe(t.Str),
  propietario6: t.maybe(t.Str),
  dni6: t.maybe(t.Str),
  direccion6: t.maybe(t.Str),
  propietario7: t.maybe(t.Str),
  dni7: t.maybe(t.Str),
  direccion7: t.maybe(t.Str),
  propietario8: t.maybe(t.Str),
  dni8: t.maybe(t.Str),
  direccion8: t.maybe(t.Str),
  propietario9: t.maybe(t.Str),
  dni9: t.maybe(t.Str),
  direccion9: t.maybe(t.Str),
  propietario10: t.maybe(t.Str),
  dni10: t.maybe(t.Str),
  direccion10: t.maybe(t.Str)
});

/**
 *
 * @param inputFile
 * @returns {Promise<void>}
 */
export async function migrate(inputFile) {
  debugMigrate('Process started...');
  const buildingWithErrors = [];
  await csvToJSON(inputFile, doOnEachRow);
  
  
  async function doOnEachRow(personRecord) {
    const input = Input(removeNullValues(cleanObjectKeys(personRecord)));
    try {
      await processBuilding(input);
    } catch (error) {
      console.error(error, ' in record with id_finca:', input.id_finca);
      buildingWithErrors.push({
        edificio: input.id_finca,
        error: error && error.toString()
      })
    }
  }
  
  debugMigrate('Building with errors:', JSON.stringify(buildingWithErrors, null, 2));
  debugMigrate('Process ended.');
}

/**
 *
 * @param input - csv row data
 * @returns {Promise<void>}
 */
async function processBuilding(input) {
  debugMigrate('\n[NEW ROW] Process Building record with id_finca:', input.id_finca);
  const catastro = getFieldNotNull(input, 'id_finca');
  
  if (catastro) {
    const building = await findBuilding(catastro);
    if (building) {
      debugMigrate(`Building found...skip row with catastro:`, catastro);
      throw new Error(`Building already existed.`);
    } else {
      debugMigrate(`Building not found, proceed to create building, worksheet, person and owner...`);
      await createAll(input);
      debugMigrate('\nProcess ended for building record with catastro / id_finca:', input.id_finca);
    }
  }
}

/**
 * Getting geo data from google api
 * @param input
 * @returns {Promise<*>}
 */
async function getGeoData(input){
  const address = `${input.calle} ${input.no}`;
  const url = 'json?address=' + address.replace(/ /g, '+');
  debugMigrate('getting geo data...', 'requester GET', url);
  try {
    let postalCode = '';
    let latitude = null;
    let longitude = null;
    const result = await requester.get(url);
  
    debugMigrate('geo data', 'requester OK', JSON.stringify(result.data, null, 2));
  
    if (result.data) {
      const data = _.first(result.data.results);
      const location = data && data.geometry && data.geometry.location;
      latitude = location && location.lat;
      longitude = location && location.lng;
      const searchAddressComponents = data && data['address_components'];
    
      if (searchAddressComponents) {
        searchAddressComponents.map(function (searchAddressComponent) {
          if (searchAddressComponent.types[0] === 'postal_code') {
            postalCode = searchAddressComponent.short_name;
          }
        });
      }
    }
    
    return {
      latitude: latitude,
      longitude: longitude,
      postalCode
    };
  } catch (exception) {
    debugMigrate('geo data', 'requester error',exception);
    return null;
  }
}

/**
 * Creates building, worksheet, owner and person.
 * @param input
 * @returns {Promise<void>}
 */
async function createAll(input) {
  const ownerRepository = new OwnerRepository();
  const personRepository = new PersonRepository();
  const {owners, building, worksheet} = await generateObjects(input);
  
  debugMigrate('Creating building with id:', building.id);
  const buildingRepository = new BuildingRepository();
  await buildingRepository.save(building, false);
  
  debugMigrate('Creating worksheet with id:', worksheet.id);
  const worksheetRepository = new WorksheetRepository();
  await worksheetRepository.save(worksheet, false);
  
  await Promise.map(owners, async (ownerAndPerson) => {
    await personRepository.save(ownerAndPerson.person);
    debugMigrate('Created person with id: ', ownerAndPerson.person.id);
    
    await ownerRepository.save(ownerAndPerson.owner);
    debugMigrate('Created owner with id: ', ownerAndPerson.owner.id);
  });
}


/**
 *
 * @param value
 * @returns {number}
 */
const number = value => {
  if (value) {
    const number = Number(value.replace(',', '.'));
    return isNaN(number) ? 0 : number;
  }
  
  return 0;
};

/**
 *
 * @param input
 * @returns {Promise<{owners: Array, building: *, worksheet: *}>}
 */
async function generateObjects(input) {
  const buildingId = uuid();
  const owners = [];
  let ownerForBuilding = null;
  
  for (let i = 1; i <= 10; i++) {
    const name = _.get(input, 'propietario' + i, '');
    
    if (name) {
      const address = {
        fullAddress: _.get(input, 'direccion' + i, '')
      };
      
      if (i === 1) {
        ownerForBuilding = {
          name,
          address: {
            fullAddress: address
          }
        }
      }
      
      const person = t.Person({
        id: uuid(),
        name,
        documentNumber: _.get(input, 'dni'+i, ''),
        addresses: [address],
        _address: address,
        personType: 'NINGUNO',
        _relatedTo: _.get(input, 'propietario1', ''),
        _migrateId: input.id_finca
      });
      
      const owner = t.Owner({
        id: uuid(),
        type: i === 1? 'PRINCIPAL' : 'SECUNDARIO',
        note: address,
        personId: person.id,
        person: person,
        name: person.name,
        _relatedTo: person._relatedTo,
        _migrateId: person._migrateId,
        buildingId: buildingId
      });
      
      owners.push({
        owner,
        person
      });
    }
  }
  
  const relatedTo = owners.length && owners[0].owner._relatedTo || '';
  const geodata = await getGeoData(input);
  
  const building = t.Building({
    id: buildingId,
    _migrateId: input.id_finca,
    _relatedTo: relatedTo,
    address: {
      street: input.calle,
      number: number(input.no),
      fullAddress: input.calle + ' ' + input.no,
      postalCode: {
        number: (geodata && geodata.postalCode) || null
      } ,
      city: input.ciudad,
      province: input.ciudad,
      neighborhood: input.barrio,
      registerNumber: null,
      type: null
    },
    buildingType: 'VERTICAL',
    cadastre: {
      reference: input.id_finca,
      address: input.calle + ' ' + input.no
    },
    location: {
      lat: (geodata && geodata.latitude) || null,
      lng: (geodata && geodata.longitude) || null
    },
    owner: ownerForBuilding,
    state: 'BUENO',
    elements: {
      number: 0,
      average: 0,
      commons: 0
    },
    use: null,
    propertyType: null
  });
  
  const worksheet = t.WorkSheet({
    id: uuid(),
    _relatedTo: building.owner && building.owner.name,
    relatedBuildingIds: [building.id],
    relatedOwnerIds: _.map(owners, 'owner.id'),
    buildingAddress: building.address,
    status: owners.length ? 'OPEN' : 'INVALID',
    queueId: null
  });
  
  return {owners, building, worksheet};
}

/**
 * Finds building by catastro.
 * @param catastro
 * @returns {Promise<*>}
 */
async function findBuilding(catastro) {
  const buildingRepository = new BuildingRepository();
  const building = await buildingRepository.findByCatastro(catastro, false);
  return building && building[0];
}

/**
 * Validates a field in the input cvs row.
 * @param input
 * @param field
 * @returns {*}
 */
export function getFieldNotNull(input, field) {
  const value = removeNullValue(input[field]);
  if (value === null) {
    debugMigrate(`Invalid ${field} '${input[field]}', skip record\n: ${input}`);
  }
  return value;
}
