import t from 'tcomb';

t.FirebaseUserStreet = t.struct({
  Nombre: t.String,
  Apellido: t.String,
  Barrio: t.String,
  Ciudad: t.String,
  Estado: t.String,
  Fecha_Alta: t.Number,
  Fecha_Baja: t.Number,
  Numero_Agente: t.Number,
  Numero_Nivel: t.Number,
  Timestamp: t.Number
}, 'FirebaseUserStreet');

t.FirebaseStreetBuildingData = t.struct({
  Id_Estado: t.maybe(t.String),
  Id_Edificio: t.String,
  Calle_Completa: t.String,
  Tipo_Calle: t.String,
  Ciudad: t.String,
  Nombre_Calle: t.String,
  Numero_Calle: t.String,
  Barrio: t.String,
  Distrito: t.String,
  Foto: t.maybe(t.String),
  Propietario: t.String,
  Telefono: t.String,
  Gps_Lat: t.Number,
  Gps_Lon: t.Number,
  Timestamp: t.Number
}, 'FirebaseStreetBuildingData');


export default t;
