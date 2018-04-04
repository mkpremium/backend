import t from 'tcomb';
import uuid from 'uuid/v4';

/**
 * @swagger
 * definitions:
 *   NoteBody:
 *     required:
 *       - note
 *       - context
 *     properties:
 *       note:
 *         type: string
 *         description: texto de la nota
 *       context:
 *         type: object
 *         description: Contexto de la nota, necesario para su posterior consulta
 */
t.NoteBody = t.struct({
  note: t.String,
  context: t.Object
}, 'NoteBody');

t.NoteListQuery = t.ListQuery.extend(
  {
    createdBy: t.maybe(t.String),
    createdAt: t.maybe(t.Date),
    createdBetween: t.maybe(t.StringSplitList),
    context: t.maybe(t.String)
  },
  {
    name: 'NoteListQuery',
    defaultProps: {
      createdBetween: ','
    }
  }
);

/**
 * @swagger
 * definitions:
 *   Note:
 *     properties:
 *       id:
 *         type: string
 *         format: uuid/v4
 *       note:
 *         type: string
 *         description: texto de la nota
 *       context:
 *         type: object
 *         description: Contexto de la nota, necesario para su posterior consulta
 *       createdBy:
 *         type: string
 *         format: uuid/v4
 *         description: Id del operador que crea la nota
 *       createdAt:
 *         type: string
 *         format: YYYY-MM-DDTHH:mm:ss.sssZ
 *         description: Fecha de creación de la nota
 */
t.Note = t.struct(
  {
    id: t.String,
    note: t.String,
    createdAt: t.Date,
    createdBy: t.String,
    context: t.Object,
    _documentType: t.enums.of(['note'])
  },
  {
    name: 'Note',
    defaultProps: {
      _documentType: 'note',
      get id() {
        return uuid();
      },
      get createdAt() {
        return new Date();
      }
    }
  }
);

/**
 * @swagger
 * definitions:
 *   NoteListResponse:
 *     required:
 *       - total
 *       - results
 *     properties:
 *       total:
 *         type: number
 *       results:
 *         type: array
 *         items:
 *           $ref: "#/definitions/Note"
 */
t.NoteListResponse = t.struct(
  {
    total: t.Number,
    results: t.list(t.Note)
  },
  {
    name: 'NoteListResponse',
    defaultProps: {
      total: 0,
      results: []
    }
  }
);
