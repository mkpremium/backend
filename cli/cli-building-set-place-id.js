#!/usr/bin/env babel-node

import _ from 'lodash'
import axios from 'axios'
import debug from 'debug'
import program from 'commander'
import Promise from 'bluebird'
import {actionWrapper} from './lib'
import {BuildingRepository} from '../src/building/models'

const debugCli = debug('app:migration:place-id')

if (require.main === module) {
  program
    .arguments('')
    .version('0.0.1')
    .option('-c --city <city>', 'Nombre municipio')
    .action(actionWrapper(main))
    .parse(process.argv)
}

async function main () {
  const {city} = program
  if (city) {
    await setBuildingsPlaceIdByCity(city)
  } else {
    program.help()
  }
}

export async function setBuildingsPlaceIdByCity (city) {
  debugCli(`buscando edificios que necesitan placeId para '${city}'`)
  const buildings = await queryBuildingByCity(city)
  debugCli(`se encontraron ${buildings.length} edificios, para la ciudad '${city}'`)

  const options = {
    concurrency: 3
  }

  if (buildings.length > 0) {
    await Promise.map(buildings, mapLocationToPlaceId, options)
  }
}

export async function queryBuildingByCity (city) {
  const repo = new BuildingRepository()
  const bucket = repo.getBucketName()
  const query = `SELECT id, location
                 FROM ${bucket}
                 WHERE _documentType = 'building'
                 AND address.city = '${city}'
                 AND (location.lat != 0 AND location.lng != 0)
                 AND (placeId IS NULL OR placeId IS MISSING)`
  return repo.raw(query)
}

async function mapLocationToPlaceId ({id, location}) {
  const placeId = await queryPlaceIdByLocation(location)
  if (placeId) {
    return setBuildingPlaceId(id, placeId)
  } else {
    debugCli(`no se encontró placeId para ${id}, ${JSON.stringify(location)}`)
  }
}

async function queryPlaceIdByLocation (location) {
  const requester = axios.create({
    baseURL: 'https://maps.googleapis.com/maps/api/geocode',
    params: {
      key: 'AIzaSyCUI2ZE7LZzG0V3ioe9gu8mJZKtFmQYPrY',
      latlng: `${location.lat},${location.lng}`
    }
  })
  const response = await requester.get('json')

  return _.get(response, 'data.results.0.place_id')
}

async function setBuildingPlaceId (id, placeId) {
  debugCli(`actualizando placeId = ${placeId} para edificio ${id}`)
  const repo = new BuildingRepository()
  const bucket = repo.getBucketName()
  const query = `UPDATE ${bucket} SET placeId = '${placeId}'
                 WHERE _documentType = 'building'
                 AND id = '${id}'`
  return repo.raw(query)
}
