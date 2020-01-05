import t from 'tcomb'
import { cleanObjectKeys, cleanValues, removeNullValues } from './models-helper'

const CityDTO = t.struct({
  name: t.String,
  lat: t.String,
  lng: t.String
}, 'CityDTO')

export default function migrateFromCsv (data) {
  const input = CityDTO(cleanValues(removeNullValues(cleanObjectKeys(data))))

  return t.City(Object.assign({}, input, {
    location: {
      lat: Number(input.lat),
      lng: Number(input.lng)
    }
  }))
}
