import t from 'tcomb'
import { cleanObjectKeys, cleanValues, removeNullValues } from './models-helper'

const NeighborhoodDTO = t.struct({
  name: t.String,
  zone: t.String,
  city: t.String,
  lat: t.String,
  lng: t.String
}, 'NeighborhoodDTO')

export default function migrateFromCsv (data) {
  const input = NeighborhoodDTO(cleanValues(removeNullValues(cleanObjectKeys(data))))

  return t.Neighborhood(Object.assign({}, input, {
    location: {
      lat: Number(input.lat),
      lng: Number(input.lng)
    }
  }))
}
