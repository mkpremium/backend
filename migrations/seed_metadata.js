import Promise from 'bluebird';
import klaw from 'klaw';
import path from 'path';
import mime from 'mime-types';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import debug from 'debug';
import {getPrivateUploadUrl} from '../src/aws';
import {BuildingRepository} from '../src/building/models';
import couchbase from '../src/db/couchbase';

const seedDebug = debug('app:seed:metadata');

export async function seed(directory) {
  seedDebug('seeding from', directory);
  await await couchbase();
  const files = await readAllFiles(directory);
  Promise.mapSeries(files, addMetadata);
}

async function addMetadata(filepath) {
  const lookupData = path.basename(filepath, path.extname(filepath));
  const repo = new BuildingRepository();
  const building = await repo.findBuildingByMetadataMigration(lookupData);
  if (building) {
    if (!filenameExistOnBuilding(building, filepath)) {
      const url = await uploadFile(filepath);
      await repo.addMetadataToBuilding(building, {url});
      seedDebug('addMetadata', 'added', filepath);
    } else {
      seedDebug('addMetadata', 'skip was added before', filepath);
    }
  } else {
    seedDebug('addMetadata', 'skip building not found', filepath);
  }
}

function filenameExistOnBuilding(building, filepath) {
  const name = path.basename(filepath);
  const findBy = metadata => metadata.name === name;

  return building.metadata &&
    building.metadata.length > 0 &&
    building.metadata.find(findBy);
}

async function uploadFile(filepath) {
  seedDebug('uploadFile', 'upload file to S3', filepath);
  const config = {
    fileName: path.basename(filepath),
    fileType: mime.lookup(filepath)
  };
  const url = getPrivateUploadUrl('metadata-dummy', config);
  await postFile(url, filepath);
  return url;
}

async function postFile(url, filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  return axios.post(url, form);
}

async function readAllFiles(directory, allowedFiles = /.jpeg|.jpg|.png|.pdf/i) {
  return new Promise((resolve, reject) => {
    const files = [];
    klaw(directory)
      .on('data', item => {
        if (allowedFiles.test(item.path)) {
          files.push(item.path);
        }
      })
      .on('error', err => reject(err))
      .on('end', () => {
        seedDebug('readAllFiles', `found ${files.length} files on ${directory}`);
        resolve(files);
      });
  });
}

if (require.main === module) {
  seed('/home/rkmax/data-dummy')
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(0);
    });
}
