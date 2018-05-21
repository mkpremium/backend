import Promise from 'bluebird';
import _get from 'lodash/get';
import debug from 'debug';
import request from 'axios';
import {nestoriaService} from '../../../config';

import geo from 'geolib';

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

function calculatePriceAverage(listing = []) {
  const total = listing.reduce((acc, {price, size}) => (price / size), 0);
  return total / Math.max(listing.length, 1);
}

function calculatePriceZoneRaw(listing = []) {
  const listingFiltered = listing
    .filter(filterZeroPriceSize);

  return calculatePriceAverage(listingFiltered);
}

function calculatePriceZone(listing = [], location) {
  const listingSortedAndFiltered = listing
    .filter(filterZeroPriceSize)
    .map(addDistance(location))
    .sort(sortDistanceNearest)
    .slice(0, 15)
    .sort(sortPriceLowest)
    .slice(0, 10);

  return calculatePriceAverage(listingSortedAndFiltered);
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

export async function nestoriaListingService(location) {
  debugNestoria('nestoriaListingService', 'init', nestoriaService, location);
  const {listing} = await nestoriaSearchListingAutoRadius(location);
  const priceZoneRaw = calculatePriceZoneRaw(listing);
  const priceZone = calculatePriceZone(listing, location);

  return {priceZoneRaw, priceZone};
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
