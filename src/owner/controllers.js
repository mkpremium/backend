import t from 'tcomb'
import { Owner } from './owner'

export function updateOwnerControllerFactory ({ ownersRepository }) {
  return async function updateOwner (req, res) {
    const id = req.params.id

    const owner = await ownersRepository.get(id)
    let updatedOwner = t.update(owner, { $merge: Object.assign({}, req.body, { id }) })
    if (typeof req.body.verified !== 'undefined') {
      const owner = Owner(updatedOwner)
      updatedOwner = owner.verifyOwner(req.user.id, req.body.verified)
    }

    await ownersRepository.save(updatedOwner)
    res.status(204).send()
  }
}

export function addOwnerContactControllerFactory ({ addContactService }) {
  return async function (req, res) {
    const ownerId = req.params.id
    const updatedOwner = await addContactService.addContact({ ownerId, ...req.body })

    res.json(updatedOwner)
  }
}
