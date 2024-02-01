import aws from 'aws-sdk'
import path from 'path'
import uuid from 'uuid/v4'
import { exec } from 'child_process'
import fs from 'fs-extra'
import mime from 'mime-types'
import { logger } from '../infrastructure/logger'

import { metadataS3Config } from '../../config'
import { PutObjectRequest } from 'aws-sdk/clients/s3'

export async function uploadFile (prefix, filepath) {
  if (!filepath) {
    return null
  }

  const s3 = new aws.S3({ region: metadataS3Config.region })
  const data = await fs.readFile(filepath)
  const Key = keyName(prefix, filepath)

  const s3params: PutObjectRequest = {
    Bucket: metadataS3Config.bucket,
    Key,
    ACL: 'private',
    ContentType: mime.lookup(filepath),
    Body: data
  }

  return new Promise((resolve, reject) => {
    s3.upload(s3params, (err, response) => {
      if (err) {
        reject(err)
      } else {
        resolve(response.Location)
      }
    })
  })
}

function keyName (prefix, fileName) {
  return `${prefix}/${uuid()}${path.extname(fileName)}`
}

export async function uploadPreview (prefix, filepath) {
  if (!filepath) {
    return null
  }

  const s3 = new aws.S3()
  const data = await fs.readFile(filepath)
  const params = {
    Bucket: metadataS3Config.bucket,
    ACL: 'public-read',
    Key: keyName(prefix, filepath),
    Body: data,
    ContentType: mime.lookup(filepath)
  }
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, response) => {
      if (err) {
        reject(err)
      } else {
        resolve(response.Location)
      }
    })
  })
}

export function dropQueryParams (url) {
  return url.split('?')[0]
}

export function resolvePublicUrl (privateUrl) {
  if (!/amazonaws.com/.test(privateUrl)) {
    return privateUrl
  }

  const s3 = new aws.S3({
    signatureVersion: 'v4',
    region: metadataS3Config.region
  })
  const url = new URL(privateUrl)
  const params = {
    Bucket: metadataS3Config.bucket,
    Key: url.pathname.substr(1) // path without first slash
  }

  logger.info('signing metadata URL', { params })
  return s3.getSignedUrlPromise('getObject', params)
}

export async function makePreview (rawUrl) {
  const url = dropQueryParams(rawUrl)
  const extension = path.extname(url)
  logger.debug('aws#makePreview', { extension, url })
  switch (extension) {
  case '.pdf':
  case '.png':
  case '.jpg':
  case '.jpeg':
  case '.gif':
    return previewCMD(url)
  default:
    return null
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
async function previewCMD (url, geometry = '600x400', limitSize = '20kb', tempDir = '/tmp') {
  const ext = path.extname(url)
  const suffix = /pdf$/i.test(ext) ? '[0]' : ''
  const downloadUrl = resolvePublicUrl(url)
  const downloadPath = path.join(tempDir, `d-${uuid()}${ext}`)
  const previewPath = path.join(tempDir, `/d-${uuid()}.jpg`)

  const downloadCMD = `wget "${downloadUrl}" -O "${downloadPath}"`
  const previewCMD = `convert "${downloadPath}${suffix}" \\
    -background white \\
    -alpha remove \\
    -geometry ${geometry} \\
    -strip \\
    -interlace JPEG \\
    -sampling-factor 4:2:0 \\
    -colorspace RGB \\
    -define jpeg:extent=${limitSize} \\
    ${previewPath}`
  const removeDownloadCMD = `rm -rf ${downloadPath}`

  return new Promise((resolve, reject) => {
    const cmd = `${downloadCMD} && ${previewCMD} && ${removeDownloadCMD}`
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(stdout, stderr)
        reject(err)
      } else {
        resolve(previewPath)
      }
    })
  })
}
