#!/usr/bin/env babel-node
import '../src/types'
import program from 'commander'
import Table from 'cli-table'
import {actionWrapper} from './lib'
import {WorksheetRepository} from '../src/worksheet/models/worksheet'

if (require.main === module) {
  program
    .option('-W --worksheet <worksheet>', 'worksheet id')
    .version('0.0.1')
    .action(actionWrapper(main))
    .parse(process.argv)
}

async function main () {
  const worksheetId = program.worksheet

  if (!worksheetId) {
    program.help()
  }

  const worksheetMeetings = await WorksheetRepository.findMeetings(worksheetId)

  if (worksheetMeetings.length > 0) {
    const table = new Table({
      head: ['Event Date', 'Created at', 'Id', 'Worksheet Id']
    })
    worksheetMeetings.map(meetingToLine).forEach(line => table.push(line))
    console.log(table.toString())
  }
}

function meetingToLine (meeting) {
  return [
    meeting.eventDate,
    meeting.createdAt,
    meeting.id,
    meeting.event.worksheetId
  ]
}
