export function fromFirebaseStreetBuilding (firebase) {
  const building = {
    id: firebase.Id_building,
    Id_Estado: firebase.Id_Estado,
    address: {
      fullAddress: firebase.Calle_Completa,
      type: firebase.Tipo_Calle,
      city: firebase.Ciudad,
      street: firebase.Nombre_Calle,
      number: firebase.Numero_Calle,
      neighborhood: firebase.Barrio,
      zone: firebase.Distrito,
      location: {
        lat: firebase.Gps_Lat,
        lng: firebase.Gps_Lon
      }
    }
  }
  const owner = {
    name: firebase.Propietario,
    contact: firebase.Telefono
  }

  return { building, owner }
}
