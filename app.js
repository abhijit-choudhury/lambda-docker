const xmlHandler = require('./xml-handler.js');

exports.handler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    console.log('Request Event', event);

    let response;
    if (event.headers['Content-Type'] == 'application/xml') {
        try {
            response = await xmlHandler(event, callback);
	        callback(null, response);
        } catch(err) {
            callback(err, null);
        }
    }
};