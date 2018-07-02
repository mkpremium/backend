import Promise from 'bluebird';
import _get from 'lodash/get';
import debug from 'debug';
import request from 'axios';
import hash from 'object-hash';
import {nestoriaService} from '../../../config';

import geo from 'geolib';
import {ONE_WEEK} from '../../lib/constants';
import {BankFileRepository} from '../models';

const debugNestoria = debug('app:banks:nestoria');

function filterZeroPriceSize({size, price}) {
  return size > 0 && price > 0;
}

function sortDistanceNearest(a, b) {
  if (a.distance < b.distance) {
    return -1;
  }

  if (a.distance > b.distance) {
    return 1;
  }

  return 0;
}

function sortPriceLowest(a, b) {
  const priceA = a.price / Math.max(a.size, 1);
  const priceB = b.price / Math.max(b.size, 1);
  if (priceA < priceB) {
    return -1;
  }

  if (priceA > priceB) {
    return 1;
  }

  return 0;
}

function addDistance(refLocation) {
  return (obj) => {
    const {longitude, latitude} = obj;
    const distance = geo.getDistance(refLocation, {longitude, latitude});
    return Object.assign({distance}, obj);
  };
}

function calculatePriceAverageM2(listing = []) {
  const total = listing.reduce((acc, {price, size}) => acc + (price / size), 0);
  return total / Math.max(listing.length, 1);
}

function calculatePriceZoneRaw(listing = []) {
  const listingFiltered = listing
    .filter(filterZeroPriceSize);

  return calculatePriceAverageM2(listingFiltered);
}

function calculatePriceZone(listing = [], location) {
  const listingSortedAndFiltered = listing
    .filter(filterZeroPriceSize)
    .map(addDistance(location))
    .sort(sortDistanceNearest)
    .slice(0, 15)
    .sort(sortPriceLowest)
    .slice(0, 10);

  return calculatePriceAverageM2(listingSortedAndFiltered);
}

async function nestoriaSearchListing(location, radius = '0.5km') {
  await Promise.delay(nestoriaService.waitTimeMS);
  const response = await request.get(nestoriaService.serviceUrl, {
    params: {
      action: 'search_listings',
      encoding: 'json',
      listing_type: 'buy',
      property_type: 'flat',
      number_of_results: 50,
      radius: `${location.latitude},${location.longitude},${radius}`
    }
  });

  return _get(response.data, 'response.listings', []);
}

async function nestoriaSearchListingAutoRadius(location) {
  const firstListing = await nestoriaSearchListing(location);
  if (firstListing < 15) {
    return {
      listing: await nestoriaSearchListing(location, '4km'),
      radius: '4km'
    };
  }

  return {listing: firstListing, radius: '0.5km'};
}

async function nestoriaListingLive(location) {
  debugNestoria('nestoriaListingService', 'init', nestoriaService, location);
  const {listing} = await nestoriaSearchListingAutoRadius(location);
  const priceZoneRaw = calculatePriceZoneRaw(listing);
  const priceZone = calculatePriceZone(listing, location) * 0.75;

  return {priceZoneRaw, priceZone};
}

export async function nestoriaListingService(location) {
  const hashLocation = hash(location);
  const cacheKey = `nestoria:${hashLocation}`;
  const repo = new BankFileRepository();
  const cache = repo.getCache({expiry: ONE_WEEK});

  const cachedListing = await cache.getValue(cacheKey);
  if (cachedListing) {
    return cachedListing;
  }

  const liveListing = await nestoriaListingLive(location);
  await cache.setValue(cacheKey, liveListing);

  return liveListing;
}

if (require.main === module) {
  const sample = {
    latitude: 36.13053049991706,
    longitude: -5.446349541011438
  };
  nestoriaListingService(sample)
    .then(result => {
      console.log(result);
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
