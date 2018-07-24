import Promise from 'bluebird';
import _get from 'lodash/get';
import debug from 'debug';
import request from 'axios';
import hash from 'object-hash';
import {nestoriaService} from '../../../config';

import {ONE_WEEK} from '../../lib/constants';
import {BankFileRepository} from '../models';

const debugNestoria = debug('app:banks:nestoria');

function filterZeroPriceSize({size, price}) {
  return size > 0 && price > 0;
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

function calculatePriceAverageM2(listing = []) {
  const total = listing.reduce((acc, {price, size}) => acc + (price / size), 0);
  return total / Math.max(listing.length, 1);
}

function calculatePriceZoneRaw(listing = []) {
  const listingFiltered = listing
    .filter(filterZeroPriceSize);

  return calculatePriceAverageM2(listingFiltered);
}

function calculatePriceZone(listing = []) {
  const listingZeroFiltered = listing.filter(filterZeroPriceSize);

  if (listing.length < 15) {
    return calculatePriceAverageM2(listingZeroFiltered);
  }

  const listingSortedAndFiltered = listingZeroFiltered
    .sort(sortPriceLowest)
    .slice(0, Math.ceil(listing.length * 0.5));

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

  return _get(response, 'data.response.listings', []);
}

async function nestoriaSearchListingAutoRadius(location) {
  const distances = [
    '0.1km',
    '0.2km',
    '0.5km'
  ];

  for (let i = 0; i < distances.length; i++) {
    const radius = distances[i];
    const listing = await nestoriaSearchListing(location, radius);
    if (listing.length >= 15) {
      return {listing, radius};
    }
  }

  return {listing: [], radius: '0.5km'};
}

async function nestoriaListingLive(location) {
  debugNestoria('nestoriaListingService', 'init', nestoriaService, location);
  const {listing} = await nestoriaSearchListingAutoRadius(location);
  const priceZoneRaw = calculatePriceZoneRaw(listing);
  const priceZone = calculatePriceZone(listing) * 0.7;

  return {priceZoneRaw, priceZone};
}

export async function nestoriaListingService(location) {
  const hashLocation = hash(location);
  const cacheKey = `${nestoriaService.cachePrefix}:${hashLocation}`;
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
