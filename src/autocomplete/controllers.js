import { wrap } from 'express-promise-wrap'
import _uniqBy from 'lodash/uniqBy'
import { LegacyBuildingRepository } from '../building/models'

import t from './types'

async function suggestion (req, res) {
  const field = req.params.field
  const params = t.AutoCompleteQuery(req.query)
  const suggestions = await autocomplete(field, params.query)
  res.json(suggestions)
}

async function autocomplete (field, query) {
  const legacyBuildingRepository = new LegacyBuildingRepository()
  const fieldName = `address.${field}`
  const buildingSearchQuery = `${fieldName}:${query}*`
  const extractor = fieldExtractor(fieldName)
  const results = await legacyBuildingRepository.searchBuilding(buildingSearchQuery)
  return _uniqBy(results.map(extractor), 'value')
}

function fieldExtractor (fieldName) {
  return (result) => ({ value: result.fields[fieldName] })
}

export const suggestionController = wrap(suggestion)
