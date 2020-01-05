import t from 'tcomb'

/**
 * @swagger
 * definitions:
 *   SignedUrlRequest:
 *     required:
 *       - fileName
 *       - fileType
 *     properties:
 *       fileName:
 *         type: string
 *         description: "nombre del archivo (ej; foto.jpeg, catastro.pdf)"
 *       fileType:
 *         type: string
 *         description: "mime type del archivo (ej: image/jpeg, application/pdf)"
 */
t.SignedUrlRequest = t.struct({
  fileName: t.String,
  fileType: t.String
})

export default t
