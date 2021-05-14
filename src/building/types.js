import t from 'tcomb'
import uuid from 'uuid/v4'

export const BuildingMetadata = t.struct(
  {
    id: t.String,
    buildingId: t.String,
    name: t.maybe(t.String),
    url: t.String,
    mimeType: t.maybe(t.String),
    previewUrl: t.maybe(t.String),
    createdAt: t.Date,
    createdBy: t.String,

    _documentType: t.enums.of(['metadata'])
  },
  {
    name: 'BuildingMetadata',
    defaultProps: {
      get id () {
        return uuid()
      },
      get createdAt () {
        return new Date()
      },
      _documentType: 'metadata'
    }
  }
)
