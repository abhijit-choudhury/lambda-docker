const middy = require('@middy/core')
const sqsPartialBatchFailureMiddleware = require('@middy/sqs-partial-batch-failure')
const processAllRoomFarePrices = require('./util/processAllRoomFarePrices.js');
const processIndividualRoomFarePrices = require('./util/processIndividualRoomFarePrices.js');

const handler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    const messagePromises = event.Records.map(processMessage)

    return Promise.allSettled(messagePromises)
}

const processMessage = async (record) => {
	console.log("Record");
	console.log(JSON.stringify(record));

	const message = JSON.parse(record.body);
	if (message && message.roomFarePrices) {
		return await processAllRoomFarePrices(message, record.attributes)
	} else {
		return await processIndividualRoomFarePrices(message, record.attributes)
	}
};

exports.handler = middy(handler).use(sqsPartialBatchFailureMiddleware());