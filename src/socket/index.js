import { SocketServer } from './server'

function startServer (server) {
  return new SocketServer(server)
}

export default { startServer }
