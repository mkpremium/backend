import debug from 'debug';
import proxyList from 'proxy-lists';
import {defer} from '../../../lib/promise-util';

const debugProxy = debug('app:banks:proxies');

function formatter(proxy) {
  const {ipAddress, port} = proxy;
  return {host: ipAddress, port};
}

export async function getRandomProxy() {
  const proxies = await getProxies();
  return proxies[Math.floor(Math.random() * proxies.length)];
}

export async function getProxies(min = 1) {
  const options = {
    countries: ['es', 'us', 'ca', 'fr', 'cl'],
    protocols: ['http', 'https'],
    sourcesWhiteList: ['freeproxylists'],
    sourcesBlackList: ['bitproxies', 'kingproxies'],
    anonymityLevel: ['anonymous']
  };
  const {promise, resolve, reject} = defer();
  const getting = proxyList.getProxies(options);

  let proxies = [];

  getting.on('data', more => {
    proxies = proxies.concat(more);
  });
  getting.on('error', err => reject(err));
  getting.on('end', () => {
    const formattedProxies = proxies.map(formatter);
    if (proxies.length < min) {
      return reject(new Error('Not enough proxies were gathered'));
    }

    debugProxy('gattered', formattedProxies.length, 'proxies');
    resolve(formattedProxies);
  });

  return promise;
}
