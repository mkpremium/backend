#!/usr/bin/env babel-node

import _ from 'lodash'
import path from 'path'
import fs from 'fs-extra'
import program from 'commander'
import Promise from 'bluebird'
import {actionWrapper} from './lib'
import {WorksheetRepository} from '../src/worksheet/models/worksheet'
import {isInvalid, ownerVefifiedNoConfirmed, ownerVerified} from '../src/types/owner'

const defaultFile = path.join(process.cwd(), `worksheet-detail-stats.csv`)

const labels = {
  worksheetId: 'ID worksheet',
  worksheetStatus: 'Estado worksheet',
  calculateWorksheetStatus: 'Estado calculado',
  statusInvalid: 'Estado invalido',
  totalOwners: 'Propietarios',
  totalInvalidOwners: 'Propietarios invalidos',
  totalVerifiedOwners: 'Propietarios verificados',
  totalVerifiedNoConfirmed: 'Propietarios confirmados',
  totalOwnersWithDNI: 'Propietarios con DNI',
  someOwnerHaveDNI: 'Tiene propietarios con DNI',
  metadataJPGCount: 'Total JPG',
  metadataPDFCount: 'Total PDF',
  cadastreReference: 'Catastro',
  buildingProvince: 'Provincia',
  buildingCity: 'Municipio'
}

if (require.main === module) {
  program
    .arguments('')
    .option('-o --output <output>', 'archivo de salida', defaultFile)
    .version('0.0.1')
    .action(actionWrapper(main))
    .parse(process.argv)
}

async function main () {
  await gatherWorksheetStatusCsv(program.output)
}

async function gatherWorksheetStatusCsv (output) {
  const outputStream = fs.createWriteStream(output)

  const writeLine = (content) => {
    outputStream.write(`${content}\n`)
  }

  const repo = new WorksheetRepository()
  const worksheetIds = await repo.getAllIds()
  const options = {concurrency: 1}

  const weightedKeys = Object.keys(labels)

  // headers
  writeLine(orderValues(weightedKeys, labels).join(';'))

  // content
  return Promise.map(worksheetIds, async (worksheetId) => {
    const status = await getWorksheetStats(worksheetId)
    writeLine(orderValues(weightedKeys, status).join(';'))
  }, options)
}

function orderValues (weightedKeys, obj) {
  const orderedValues = []

  weightedKeys.forEach(key => {
    orderedValues.push(obj[key])
  })

  return orderedValues
}

async function getWorksheetStats (worksheetId) {
  const repo = new WorksheetRepository()
  const worksheet = await repo.findByIdWIthIncludes(worksheetId)

  const worksheetStatus = worksheet.status
  const totalOwners = worksheet.relatedOwnerIds.length
  const totalOwnersWithDNI = countOwnersWithDNI(worksheet.relatedOwners)
  const totalInvalidOwners = countInvalidOwners(worksheet.relatedOwners)
  const totalVerifiedOwners = countVerifiedOwners(worksheet.relatedOwners)
  const totalVerifiedNoConfirmed = countVerifiedNoConfirmed(worksheet.relatedOwners)
  const calculateWorksheetStatus = await calculateStatus(worksheet)
  const someOwnerHaveDNI = totalOwnersWithDNI > 0 ? ' SI' : 'NO'
  const cadastreReference = _.get(worksheet, 'relatedBuildings.0.cadastre.reference')
  const buildingProvince = _.get(worksheet, 'buildingAddress.province')
  const buildingCity = _.get(worksheet, 'buildingAddress.city')
  const statusDiff = worksheetStatus !== calculateWorksheetStatus
  const statusInvalid = statusDiff ? 'SI' : 'NO'
  const metadataJPGCount = countMetadata(worksheet.relatedBuildings[0], true)
  const metadataPDFCount = countMetadata(worksheet.relatedBuildings[0], false)

  return {
    worksheetId,
    worksheetStatus,
    calculateWorksheetStatus,
    statusInvalid,
    totalOwners,
    totalInvalidOwners,
    totalOwnersWithDNI,
    totalVerifiedOwners,
    totalVerifiedNoConfirmed,
    someOwnerHaveDNI,
    cadastreReference,
    buildingProvince,
    buildingCity,
    metadataJPGCount,
    metadataPDFCount
  }
}

function countOwnersWithDNI (owners) {
  let totalOwners = 0

  _.forEach(owners, (owner) => {
    if (_.chain(owner).get('person.documentNumber', null).isEmpty()) {
      totalOwners += 1
    }
  })

  return totalOwners
}

function countInvalidOwners (owners) {
  let totalOwners = 0
  _.map(owners, (owner) => {
    if (isInvalid(owner)) {
      totalOwners += 1
    }
  })

  return totalOwners
}

function countVerifiedOwners (owners) {
  let totalOwners = 0
  _.map(owners, (owner) => {
    if (ownerVerified(owner)) {
      totalOwners += 1
    }
  })

  return totalOwners
}

function countVerifiedNoConfirmed (owners) {
  let totalOwners = 0
  _.map(owners, (owner) => {
    if (ownerVefifiedNoConfirmed(owner)) {
      totalOwners += 1
    }
  })

  return totalOwners
}

function calculateStatus (worksheet) {
  const repo = new WorksheetRepository()
  return repo.calculateFixedStatus(worksheet)
}

function countMetadata (building, onlyImages) {
  const check = onlyImages
    ? (m) => m.mimeType === 'image/jpeg'
    : (m) => m.mimeType !== 'image/jpeg'

  return building.metadata.filter(check).length
}
