var soap        = require('soap');

function verifyNumintecKey(req, res, next) {
    var numintecKey = req.headers['x-numintec-key'];
    if (!numintecKey) {
        return res.status(403).send({auth: false, message: 'No Numintec key provided.'});
    }

    var url = 'https://api.invoxcontact.com/Call/?wsdl';
    var args = {'license': numintecKey};
    soap.createClient(url, function(err, client) {
        client.Authentication(args, function(err, result) {
            if (err) {
                return res.status(500).send({auth: false, message: 'Failed to authenticate Numintec key.'});
            }

            if (result.return.$value) {
                // if everything good, save to request for use in other routes
                req.client = client;
                next();
            } else {
                return res.status(403).send({auth: false, message: 'Failed to authenticate Numintec key.'});
            }

        });
    });
}

module.exports = verifyNumintecKey;