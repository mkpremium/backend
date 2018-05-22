import _some from 'lodash/some';
import {BankFileDataRepository, BanksCityDataRepository} from '../models';
import {cadastreLocationService} from './catastro/location';
import {nestoriaListingService} from './nestoria';
import {cadastreAddressService} from './catastro/address';

function calculatePriceSell(pricing, buildingInfo) {
  return pricing.priceZone / Math.max(1, buildingInfo.m2);
}

function calculatePriceInvest({itp, priceSell, priceBank}, discount) {
  return priceBank * (1 - discount / 100) * (1 + itp / 100) + priceSell * 0.05 + 1500;
}

function alwaysFalse() {
  return false;
}

function filterPopulation(threshold) {
  if (!threshold) return alwaysFalse;
  return ({population}) => population < threshold;
}

function filterBenefit(threshold) {
  if (!threshold) return alwaysFalse;
  return ({priceInvest, priceSell}) => priceSell - priceInvest < threshold;
}

function filterPriceSell(threshold) {
  if (!threshold) return alwaysFalse;
  return ({priceSell}) => priceSell < threshold;
}

function filterBlacklisted(blacklisted) {
  if (!blacklisted) return alwaysFalse;
  return ({cadastreReference}) => blacklisted.indexOf(cadastreReference) !== -1;
}

function calculateFilters(thresholds) {
  return (obj) => {
    const discount = thresholds.discount || 0;
    const priceInvest = calculatePriceInvest(obj, discount);
    const withPriceInvest = Object.assign({priceInvest}, obj);
    const filters = {
      population: filterPopulation(thresholds.population)(withPriceInvest),
      benefit: filterBenefit(thresholds.benefit)(withPriceInvest),
      priceSell: filterPriceSell(thresholds.priceSell)(withPriceInvest),
      blacklisted: filterBlacklisted(thresholds.blacklisted)(withPriceInvest)
    };
    const buy = !_some(Object.values(filters));
    return Object.assign({priceInvest, filters}, obj, {buy});
  };
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

export async function calculateFilter(bankFileId, thresholds) {
  const repo = new BankFileDataRepository();
  const bankFileDataRows = await repo.findByFileBankId(bankFileId);

  return bankFileDataRows.map(calculateFilters(thresholds));
}
