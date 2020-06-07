import debug from 'debug'
import _get from 'lodash/get'
import _isNil from 'lodash/isNil'
import { fbInformadores } from '../'
import { firebaseTimestampFormat } from '../../lib/date'
import t from './../types/street'

const debugStreet = debug('app:firebase:street')

export async function saveStreetBuildingToFirebase (building, owner) {
  if (!fbInformadores.enabled) {
    return
  }
  debugStreet('saveStreetBuildingToFirebase', building.id)
  const db = fbInformadores.database()
  return db.ref(`${fbInformadores.prefixURL}Edificios_Data/${building.id}`).set(toFirebaseStreetBuilding(building, owner))
}

function toFirebaseStreetBuilding (building) {
  debugStreet('toFirebaseStreetBuilding', building, building.owner)
  // eslint-disable-next-line camelcase
  let Calle_Completa = _get(building, 'address.fullAddress')
  if (_isNil(Calle_Completa)) {
    // eslint-disable-next-line camelcase
    Calle_Completa = _get(building, 'cadastre.address', '')
  }

  return t.FirebaseStreetBuildingData({
    Id_Estado: building.Id_Estado,
    Id_Edificio: building.id,
    Calle_Completa,
    Tipo_Calle: building.address.type,
    Ciudad: building.address.city,
    Nombre_Calle: building.address.street,
    Numero_Calle: String(building.address.number),
    Barrio: building.address.neighborhood,
    Distrito: building.address.zone,
    Foto: null,
    Propietario: _get(building, 'owner.name', ''),
    Telefono: _get(building, 'owner.phones.0.value', ''),
    Gps_Lat: building.location.lat,
    Gps_Lon: building.location.lng,
    Timestamp: firebaseTimestampFormat(new Date())
  })
}

export function fromFirebaseStreetBuilding (firebase) {
  const building = {
    id: firebase.Id_building,
    Id_Estado: firebase.Id_Estado,
    address: {
      fullAddress: firebase.Calle_Completa,
      type: firebase.Tipo_Calle,
      city: firebase.Ciudad,
      street: firebase.Nombre_Calle,
      number: firebase.Numero_Calle,
      neighborhood: firebase.Barrio,
      zone: firebase.Distrito,
      location: {
        lat: firebase.Gps_Lat,
        lng: firebase.Gps_Lon
      }
    }
  }
  const owner = {
    name: firebase.Propietario,
    contact: firebase.Telefono
  }

  return { building, owner }
}
