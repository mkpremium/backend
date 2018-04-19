import t from 'tcomb';

t.FirebaseUserStreet = t.struct({
  Datos: t.struct({
    Nombre: t.String,
    Apellido: t.String,
    Barrio: t.String,
    Ciudad: t.String,
    Distrito: t.String,
    Estado: t.String,
    Fecha_Alta: t.Number,
    Fecha_Baja: t.Number,
    Numero_Agente: t.Number,
    Numero_Nivel: t.Number,
    Timestamp: t.Number
  }, 'Datos'),
  Edificio_Default: t.maybe(t.struct({
    id_Edificio: t.Number
  }, 'Edificio_Default'))
}, 'FirebaseUserStreet');
