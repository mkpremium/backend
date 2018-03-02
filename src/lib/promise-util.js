import Promise from 'bluebird';

// http://bluebirdjs.com/docs/api/deferred-migration.html
export function defer() {
  let resolve;
  let reject;
  const promise = new Promise(function() {
    resolve = arguments[0];
    reject = arguments[1];
  });

  return {promise, resolve, reject};
}
