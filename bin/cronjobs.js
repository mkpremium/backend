import couchbase from '../src/db/couchbase';

import scheduledEventCronJob from '../src/scheduled-events/cron';
import scheduledTasksCronJob from '../src/firebase/cron';

const app = {locals: {}};

couchbase(app);
scheduledEventCronJob.start();
scheduledTasksCronJob.start();
