import { resolvePublicUrl } from '../aws'
import { wrap } from 'express-promise-wrap/dist/index'
import { MetadataRepository } from '../building/repository/MetadataRepository'

async function downloadMetadataFile (req, res) {
  const repo = new MetadataRepository()
  const metadata = await repo.findByIdOrThrow(req.params.id)
  const publicUrl = await resolvePublicUrl(metadata.url)
  res.redirect(publicUrl)
}

export const downloadMetadataFileController = wrap(downloadMetadataFile)
