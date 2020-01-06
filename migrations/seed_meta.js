import Promise from 'bluebird'
import klaw from 'klaw'
import path from 'path'
import mime from 'mime-types'
import debug from 'debug'
import {BuildingRepository} from '../src/building/models'
import couchbase from '../src/db/couchbase'
import {uploadFile} from '../src/aws'

const seedDebug = debug('app:seed:metadata')

export async function seed (directory) {
  seedDebug('seeding from', directory)
  await couchbase()
  const files = await readAllFiles(directory)
  await Promise.mapSeries(files, async (file) => {
    try {
      await addMetadata(file)
    } catch (e) {
      seedDebug('ignore file', file, e)
    }
  })
}

async function addMetadata (filepath) {
  const lookupData = path.basename(filepath, path.extname(filepath))
  const repo = new BuildingRepository()
  const building = await repo.findBuildingByMetadataMigration(lookupData)
  if (building) {
    if (!filenameExistOnBuilding(building, filepath)) {
      const url = await uploadFileS3(filepath)
      await repo.addMetadataToBuilding(building, {
        url,
        name: path.basename(filepath),
        createdBy: 'migration'
      })
      seedDebug('addMetadata', 'added', filepath)
    } else {
      seedDebug('addMetadata', 'skip was added before', filepath)
    }
  } else {
    seedDebug('addMetadata', 'skip building not found', filepath)
  }
}

function filenameExistOnBuilding (building, filepath) {
  const name = path.basename(filepath)
  const findBy = metadata => metadata.name === name

  return building.metadata &&
    building.metadata.length > 0 &&
    building.metadata.find(findBy)
}

async function uploadFileS3 (filepath) {
  seedDebug('uploadFile', 'upload file to S3', filepath)
  const config = {
    fileName: path.basename(filepath),
    fileType: mime.lookup(filepath)
  }

  return uploadFile('metadata-migration', config, filepath)
}

async function readAllFiles (directory, allowedFiles = /.jpeg|.jpg|.png|.pdf/i) {
  return new Promise((resolve, reject) => {
    const files = []
    klaw(directory)
      .on('data', item => {
        if (allowedFiles.test(item.path)) {
          files.push(item.path)
        }
      })
      .on('error', err => reject(err))
      .on('end', () => {
        seedDebug('readAllFiles', `found ${files.length} files on ${directory}`)
        resolve(files)
      })
  })
}

const dir = path.resolve(process.argv[2]) || '/home/rkmax/data-dummy'

seed(dir)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(0)
  })
