import { wrap } from 'express-promise-wrap'
import { PersonRepository } from '../owner/models'

async function searchPeople (req, res) {
  const repo = new PersonRepository()
  const people = await repo.searchPeople(req.query)

  res.json(people)
}

export const searchPeopleController = wrap(searchPeople)
