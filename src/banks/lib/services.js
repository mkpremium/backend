import Promise from 'bluebird';
import _some from 'lodash/some';
import {BankFileDataRepository, BanksCityDataRepository} from '../models';
import {cadastreLocationService} from './catastro/location';
import {nestoriaListingService} from './nestoria';
import {cadastreAddressService} from './catastro/address';

function calculatePriceSell(pricing, buildingInfo) {
  return pricing.priceZone * Math.max(1, buildingInfo.m2);
}

function calculatePriceInvest({itp, priceSell, priceBank}, discount) {
  return priceBank * (1 - discount / 100) * (1 + itp / 100) + priceSell * 0.05 + 1500;
}

function calculateBenefit({priceInvest, priceSell}) {
  return (priceSell - priceInvest) / priceInvest * 100;
}

function alwaysFalse() {
  return false;
}

function filterPopulation(threshold) {
  if (!threshold) return alwaysFalse;
  return ({population}) => {
    if (population === 0) {
      return false;
    }
    return population < threshold;
  };
}

function filterBenefit(threshold) {
  if (!threshold) return alwaysFalse;
  return ({benefit}) => benefit < threshold;
}

function filterPriceSell(threshold) {
  if (!threshold) return alwaysFalse;
  return ({priceSell}) => priceSell < threshold;
}

function filterBlacklisted(blacklisted) {
  if (!blacklisted || blacklisted.length === 0) return alwaysFalse;
  return ({cadastreReference}) => blacklisted.indexOf(cadastreReference) !== -1;
}

function filterWhitelisted(whitelisted) {
  if (!whitelisted || whitelisted.length === 0) return alwaysFalse;
  return ({cadastreReference}) => whitelisted.indexOf(cadastreReference) === -1;
}

/**
 *
 * @param thresholds
 * @param [thresholds.discount]
 * @param [thresholds.population]
 * @param [thresholds.benefit]
 * @param [thresholds.priceSell]
 * @param [thresholds.blacklisted]
 * @param [thresholds.whitelisted]
 * @returns {function(*=): *}
 */
function calculateFilters(thresholds = {}) {
  return (obj) => {
    const discount = thresholds.discount || 0;
    const priceInvest = calculatePriceInvest(obj, discount);
    const withPriceInvest = Object.assign({priceInvest}, obj);
    const benefit = calculateBenefit(withPriceInvest);
    const withBenefit = Object.assign(withPriceInvest, {benefit});

    const filters = {
      population: filterPopulation(thresholds.population)(withBenefit),
      benefit: filterBenefit(thresholds.benefit)(withBenefit),
      priceSell: filterPriceSell(thresholds.priceSell)(withBenefit),
      blacklisted: filterBlacklisted(thresholds.blacklisted)(withBenefit),
      whitelisted: filterWhitelisted(thresholds.whitelisted)(withBenefit)
    };
    const buy = filters.whitelisted || !_some(Object.values(filters));
    return Object.assign({}, obj, {priceInvest, filters, buy, benefit});
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

async function updateFilters(bankFileData) {
  const repo = new BankFileDataRepository();
  return repo.save(bankFileData);
}

export async function calculateFilter(bankFileId, thresholds) {
  const repo = new BankFileDataRepository();
  const bankFileDataRows = await repo.findByFileBankId(bankFileId);

  return calculateFilterSpecific(bankFileDataRows, thresholds);
}

export async function calculateFilterSpecific(bankFileDataRows, thresholds) {
  const calculator = calculateFilters(thresholds);
  return Promise.map(bankFileDataRows, (data) => updateFilters(calculator(data)));
}
