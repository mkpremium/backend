import {BanksCityDataRepository} from '../models';
import {cadastreLocationService} from './catastro/location';
import {nestoriaListingService} from './nestoria';
import {cadastreAddressService} from './catastro/address';

function calculatePriceSell(pricing, buildingInfo) {
  return pricing.priceZone / Math.max(1, buildingInfo.m2);
}

async function cityData(cityName) {
  const bankCityData = await BanksCityDataRepository.findByName(cityName);
  if (bankCityData) {
    const {priceCity, rot, population, itp} = bankCityData;
    return {priceCity, rot, population, itp};
  }
  return {};
}

export async function retrievePricesAndLocationInfo(cadastreReference) {
  const location = await cadastreLocationService(cadastreReference);
  const pricing = await nestoriaListingService(location);
  const buildingInfo = await cadastreAddressService(cadastreReference);
  const bankCityData = await cityData(buildingInfo.address.city);
  const priceSell = calculatePriceSell(pricing, buildingInfo);
  return Object.assign({}, pricing, buildingInfo, bankCityData, {
    priceSell,
    location
  });
}

export async function loadBankCity(filepath) {

}
