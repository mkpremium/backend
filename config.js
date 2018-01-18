export const port = parseInt(process.env.PORT || '9080');
export const couchbase = {
    uri: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1',
    bucket: process.env.COUCHBASE_BUCKET || 'mkpremium',
    user: process.env.COUCHBASE_USER || 'admin',
    pass: process.env.COUCHBASE_PASS || 'password'
};
export const jwt = {
    secret: process.env.JWT_SECRET || 'Bitdistrict1sGreat'
};

export const reportDir = process.env.REPORT_DIR || 'app/csv';
