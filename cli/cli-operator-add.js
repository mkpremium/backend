#!/usr/bin/env babel-node

import program from 'commander'
import {actionWrapper} from './lib'

import couchbase from '../src/db/couchbase'
import {OperatorRoles} from '../src/types/operator'
import {createFullOperator} from '../test/common'

program
  .version('0.0.1')
  .option('-u --username <username>', 'Nombre de usuario')
  .option('-P --password <password>', 'Contraseña')
  .option('-r --role <role>', `Rol de usuario (${rolesDesc(', ')})`, rolesArg(), 'OPERATOR')
  .action(actionWrapper(mainAction))
  .parse(process.argv)

async function mainAction () {
  const {username, password, role} = program

  if (!username || !password || !role) {
    program.help()
  }

  await couchbase()
  await createOperator({username, password, role})
}

function rolesArg () {
  return new RegExp(`^${rolesDesc()}$`)
}

function rolesDesc (union = '|') {
  return Object.values(OperatorRoles).join(union)
}

async function createOperator ({username, password, role}) {
  await createFullOperator({
    username,
    password,
    agentNumber: randomAgentNumber(),
    serviceId: randomServiceId(),
    roles: [
      role
    ],
    profile: {
      firstName: username,
      lastName: 'Operator'
    }
  })
}

function randomAgentNumber () {
  const first = Math.floor((Math.random() * 10200) + 10300)
  return `${first}-920`
}

function randomServiceId () {
  return Math.floor((Math.random() * 18000) + 15000) + ''
}
