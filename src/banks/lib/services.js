import {BanksCityDataRepository} from '../models';
import {cadastreLocationService} from './catastro/location';
import {nestoriaListingService} from './nestoria';
import {cadastreAddressService} from './catastro/address';

function priceSell(pricing, buildingInfo) {
  return pricing.priceZone / Math.max(1, buildingInfo.floorArea);
}

export async function retrievePricesAndLocationInfo(cadastreReference) {
  const location = await cadastreLocationService(cadastreReference);
  const pricing = await nestoriaListingService(location);
  const buildingInfo = await cadastreAddressService(cadastreReference);
  const {priceCity, rot, population} = await BanksCityDataRepository.findByName(buildingInfo.address.city);
  return Object.assign({}, pricing, buildingInfo, {
    priceCity,
    rot,
    population,
    priceSell: priceSell(pricing, buildingInfo)
  });
}
