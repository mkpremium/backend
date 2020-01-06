#!/usr/bin/env babel-node

import Promise from 'bluebird'
import program from 'commander'
import {actionWrapper} from './lib'
import {WorksheetRepository} from '../src/worksheet/models/worksheet'
import {WorkSheetStatus} from '../src/types/worksheet'
import {BuildingRepository} from '../src/building/models'

if (require.main === module) {
  program
    .arguments('')
    .version('0.0.1')
    .action(actionWrapper(main))
    .parse(process.argv)
}

async function main () {
  await addChangeStatusDate()
}

export async function addChangeStatusDate () {
  const repo = new WorksheetRepository()
  const worksheetIds = await repo.getAllIds()
  const options = {concurrency: 2}

  return Promise.map(worksheetIds, setStatusChangedAt, options)
}

async function setStatusChangedAt (worksheetId) {
  const worksheet = await findWorksheetById(worksheetId)

  if (worksheet.status === WorkSheetStatus.MEETING) {
    return setStatusChangeByMeeting(worksheet)
  } else {
    return setStatusChangeDefault(worksheet)
  }
}

async function setStatusChangeByMeeting (worksheet) {
  const buildingMeetings = await BuildingRepository.findMeetings(worksheet.relatedBuildingIds[0])

  if (buildingMeetings.length > 0) {
    const buildingMeeting = buildingMeetings[0]
    return updateWorksheet(worksheet.setStatusChangedAt(buildingMeeting.eventDate))
  } else {
    const worksheetMeetings = await WorksheetRepository.findMeetings(worksheet.id)
    if (worksheetMeetings.length > 0) {
      const worksheetMeeting = worksheetMeetings[0]
      return updateWorksheet(worksheet.setStatusChangedAt(worksheetMeeting.eventDate))
    } else {
      return setStatusChangeDefault(worksheet)
    }
  }
}

async function setStatusChangeDefault (worksheet) {
  const dateToSet = worksheet.viewedAt
    ? worksheet.viewedAt
    : new Date('2019-03-01T00:00:00.000Z') // hard coded first production day date

  const updatedWorksheet = worksheet.setStatusChangedAt(dateToSet)

  return updateWorksheet(updatedWorksheet)
}

async function findWorksheetById (buildingId) {
  const repo = new WorksheetRepository()
  return repo.findByIdOrThrow(buildingId)
}

async function updateWorksheet (worksheet) {
  const repo = new WorksheetRepository()
  return repo.save(worksheet, false)
}
