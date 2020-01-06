#!/usr/bin/env babel-node

import program from 'commander'

program
  .version('0.0.1')
  .command('synchronize-firebase', 'Sincronizar la metadata que esta en couchbase a firebase')
  .parse(process.argv)
