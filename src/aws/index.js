import debug from 'debug';
import Promise from 'bluebird';
import aws from 'aws-sdk';
import _pick from 'lodash/pick';
import path from 'path';
import uuid from 'uuid/v4';
import {exec} from 'child_process';
import fs from 'fs-extra';
import t from './types';
import mime from 'mime-types';

import {awsConfig} from '../../config';

const awsDebug = debug('app:aws');
const accountConfig = _pick(awsConfig, ['region', 'accessKeyId', 'secretAccessKey']);

aws.config.update(accountConfig);

export function getPrivateUploadUrl(prefix, config) {
  const {fileName, fileType} = t.SignedUrlRequest(config);
  const s3 = new aws.S3();

  const Key = keyName(prefix, fileName);

  const params = {
    Bucket: awsConfig.bucket,
    Key,
    ACL: 'private',
    ContentType: fileType
  };

  return s3.getSignedUrl('putObject', params);
}

function keyName(prefix, fileName) {
  return `${prefix}/${uuid()}${path.extname(fileName)}`;
}

export async function uploadPreview(prefix, filepath) {
  if (!filepath) {
    return null;
  }

  const s3 = new aws.S3();
  const data = await fs.readFile(filepath);
  const params = {
    Bucket: awsConfig.bucket,
    ACL: 'public-read',
    Key: keyName(prefix, filepath),
    Body: data,
    ContentType: mime.lookup(filepath)
  };
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response.Location);
      }
    });
  });
}

export function cleanUrl(url) {
  return url.split('?')[0];
}

export function resolvePublicUrl(url) {
  const Key = url.replace(`https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/`, '');
  const s3 = new aws.S3();
  const params = {
    Bucket: awsConfig.bucket,
    Key
  };

  return s3.getSignedUrl('getObject', params);
}

export async function makePreview(rawUrl) {
  const url = cleanUrl(rawUrl);
  const extension = path.extname(url);
  awsDebug('make preview', extension, url);
  switch (extension) {
    case '.pdf':
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
      return previewCMD(url);
    default:
      return null;
  }
}

/**
 * Generate a image preview when it's possible (images or PDF)
 * @param url
 * @param geometry
 * @param limitSize
 * @param tempDir
 * @return {Promise<String>}
 */
async function previewCMD(url, geometry = '600x400', limitSize = '20kb', tempDir = '/tmp') {
  const ext = path.extname(url);
  const suffix = /pdf$/i.test(ext) ? '[0]' : '';
  const downloadUrl = resolvePublicUrl(url);
  const downloadPath = path.join(tempDir, `d-${uuid()}${ext}`);
  const previewPath = path.join(tempDir, `/d-${uuid()}.jpg`);

  const downloadCMD = `wget "${downloadUrl}" -O "${downloadPath}"`;
  const previewCMD = `convert "${downloadPath}${suffix}" \\
    -background white \\
    -alpha remove \\
    -geometry ${geometry} \\
    -strip \\
    -interlace JPEG \\
    -sampling-factor 4:2:0 \\
    -colorspace RGB \\
    -define jpeg:extent=${limitSize} \\
    ${previewPath}`;
  const removeDownloadCMD = `rm -rf ${downloadPath}`;

  return new Promise((resolve, reject) => {
    const cmd = `${downloadCMD} && ${previewCMD} && ${removeDownloadCMD}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(stdout, stderr);
        reject(err);
      } else {
        resolve(previewPath);
      }
    });
  });
}
