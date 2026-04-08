import { RetellTaskCall } from '../types/retell-task-call'
import { TaskCall } from '../../../types/task-call'

export const transformTasktoRetellTask = (tasks:TaskCall[]) => {
  const retellTasks:RetellTaskCall[] = tasks.map(task => ({
    to_number: task.toNumber,
    retell_llm_dynamic_variables: {
      nombre: task.variables.name,
      apellido: task.variables.lastName,
      direccion: task.variables.address
    },
    metadata: {
      buildingId: task.metadata.buildingId,
      ownerId: task.metadata.ownerId,
      contactId: task.metadata.contactId,
      city: task.metadata.city,
      use: task.metadata.use,
      callQueueId: task.metadata.callQueueId,
      address: task.metadata.address
    }
  }))
  return retellTasks
}
