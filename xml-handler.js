const xml2js = require('xml2js');
const jsonxml = require('jsontoxml');
const axios = require('axios');

const config = require('./config/config.js');
const CruiseSummary = require('./models/cruiseSummaryModel.js');

// Some default settings needed by xml2js. We can leave the as they are.
let options = {             // options passed to xml2js parser
    explicitCharkey: false, // undocumented
    trim: false,            // trim the leading/trailing whitespace from text nodes
    normalize: false,       // trim interior whitespace inside text nodes
    explicitRoot: false,    // return the root node in the resulting object?
    emptyTag: null,         // the default value for empty nodes
    explicitArray: true,    // always put child nodes in an array
    ignoreAttrs: false,     // ignore attributes, only create text nodes
    mergeAttrs: false,      // merge attributes and child elements
    validator: null         // a callable validator
};

const buildResponse = (statusCode, xmlResponse) => {
    let response = {
        // Return this as a successful "200" response
        statusCode: statusCode,
        headers: {
            // Note: This Content-Type corresponds to the Content-Type added as Mapping Template in the Integration Response of the API in API Gateway
            'Content-Type': 'text/xml'
        }
    }
    if (xmlResponse) {
        // Note: This body attribute is what the text/xml Mapping Template of the Integration Response refers to when it executes the following VTL:
        
        // #set($inputRoot = $input.path('$.body'))
        // $inputRoot
        response.body = xmlResponse;
	}
	console.log(JSON.stringify(response));
	return response;
};

// Let's change the default handler interface to the following "old" style notation so we have more control with the callback function
module.exports = async (event) => {
	// Let's create an instance of our xml2js parser
	let parser = new xml2js.Parser(options);
	// Retrieve the XML from the JSON body that API Gateway is sending because of this Method Execution VTL: { "body" : $input.json('$') }
	// Note: So, yes, internally API gateway still uses JSON to wrap around our XML to send it to Lambda. But, the JSON is never visibile to the sender of the API request or the consumer of the response.
	let xmlBodyStr = event.body;

	return new Promise((resolve, reject) => {
		// Let's turn the XML into a Javascript object
		parser.parseString(xmlBodyStr, async (err, resultJson) => {

		// If something went wrong, the callback first argument contains the error object that will be sent to API gateway
			if (err) {
				reject(err);
			} else {
				const targetURL = config.base_url + config.url_virtualise;
				const xmlconfig = {
					headers: {
						'User-Agent': config.user_agent,
						'Content-Type': config.content_type
					}
				};

				console.log(`sending request to target url ${targetURL}`);
				try {
					const result = await axios.post(targetURL, xmlBodyStr, xmlconfig);

					console.log(`response received from backend ${result.data}`);

					const xmlObject = { "_id": resultJson.MessageHeader[0].BookNum[0], "originalRequest": xmlBodyStr, "savedResponse": result.data };
					
					const cruiseSummary = new CruiseSummary(xmlObject);


					cruiseSummary.save((err) => {
						if (err) {
							console.log(`error saving request for booking reference number ${xmlObject._id} ${err}. Trying to update`);
							cruiseSummary.update(xmlObject._id, (err, login) => {
								if (err) {
									console.log(`error updating request for booking reference number ${xmlObject._id} ${err}. Returning original response to client`);
									resolve(buildResponse(200, result.data));
								} else {
									console.log(`updated request for booking reference number ${xmlObject._id}. Returning original response to client`);
									resolve(buildResponse(200, result.data));
								}
							});
						} else {
							console.log(`saved request for booking reference number ${xmlObject._id}`);
							resolve(buildResponse(200, result.data));
						}
					});
				}
				catch(err) {
					console.log(`error received from backend system ${err}. Fetching saved record`);
					//get the record from mongo.
					_id = resultJson.MessageHeader[0].BookNum[0]
					
					CruiseSummary.findById(_id, (err, cruiseSummary) => {
						if (err) {
							console.log(`error fetching saved record ${err}`);
							console.log(`error fetching saved record for id ${_id}`);
							resolve(buildResponse(500, "Internal server Error"));
						} else {
							console.log("object retrieved from db", cruiseSummary);
							if (cruiseSummary.savedResponse === "") {
								console.log(`no saved response found in db`);
								console.log(`no saved response found for  ${_id}`);
								resolve(buildResponse(404, `No saved Response found for  ${_id}`));
							} else {
								console.log(`returning saved response for id ${_id}`);
								console.log(` ${cruiseSummary.savedResponse}`);
								resolve(buildResponse(200, cruiseSummary.savedResponse));
							}
						}
					});
				};		
			}
		});
	});
};