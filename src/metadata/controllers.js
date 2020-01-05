import { resolvePublicUrl } from '../aws'
import { MetadataRepository } from '../building/models'
import { wrap } from 'express-promise-wrap/dist/index'

async function downloadMetadataFile (req, res) {
  const repo = new MetadataRepository()
  const metadata = await repo.findByIdOrThrow(req.params.id)
  res.redirect(resolvePublicUrl(metadata.url))
}

export const downloadMetadataFileController = wrap(downloadMetadataFile)
