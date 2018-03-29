import t from 'tcomb';
import uuid from 'uuid/v4';

/**
 * @swagger
 * definitions:
 *   BuildingMetadata:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       name:
 *         type: string
 *         description: Nombre a mostrar
 *       buildingId:
 *         type: string
 *         format: uuid/v4
 *       url:
 *         type: string
 *         description: Url privada del archivo (no usar directamente)
 *       previewUrl:
 *         type: string
 *         description: "Url publica de amazon con un thumbnail del archivo (images, pdf)"
 *       createdAt:
 *         type: string
 *         format: YYYY-MM-DDTHH:MM:SSZ
 *       createdBy:
 *         type: string
 *         format: uuid/v4
 *   BuildingMetadataBody:
 *     required:
 *       - url
 *     properties:
 *       name:
 *         type: string
 *         description: Nombre a mostrar
 *       url:
 *         type: string
 *         description: URL usada para subir el archivo a amazon S3
 */
t.BuildingMetadata = t.struct(
  {
    id: t.String,
    buildingId: t.String,
    name: t.maybe(t.String),
    url: t.String,
    previewUrl: t.maybe(t.String),
    createdAt: t.Date,
    createdBy: t.String,

    _documentType: t.enums.of(['metadata'])
  },
  {
    name: 'BuildingMetadata',
    defaultProps: {
      get id() {
        return uuid();
      },
      get createdAt() {
        return new Date();
      },
      _documentType: 'metadata'
    }
  }
);

/**
 * @swagger
 * definitions:
 *   BuildingMetadataPreview:
 *     properties:
 *         id:
 *           type: string
 *           format: uuid/v4
 *         name:
 *           type: string
 *           description: Nombre a mostrar
 *         previewUrl:
 *           type: string
 *           description: "Url publica de amazon con un thumbnail del archivo (images, pdf)"
 */
t.BuildingMetadataPreview = t.struct({
  id: t.String,
  name: t.maybe(t.String),
  previewUrl: t.maybe(t.String)
});

t.Building = t.Building.extend(
  {
    metadata: t.list(t.BuildingMetadataPreview)
  },
  {
    defaultProps: {
      metadata: []
    }
  }
);
