const line = require('@line/bot-sdk')

const util = require('./util')

const config = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config)

function notify (data) {
	const lineIds = JSON.parse(process.env.NOTIFY_LINE_ACCOUNT)

	return Promise.all(
		lineIds.map((id) => 
			client.pushMessage(id, composeMessage(data))
				.catch((err) => {
					console.error(data)
					console.error(err.originalError.response.data)
				})
		)
	)
}

function composeMessage({ title, text, uri, thumbnail = null }) {
	if (title.length > 40) {
		title = title.substring(0,37) + '...'
	}
	return {
		type: 'template',
		altText: `${title} ${text} link: ${uri}`,
		template: {
			type: 'buttons',
			actions: [
				{
					type: 'uri',
					label: 'Read',
					uri,
				}
			],
			thumbnailImageUrl: thumbnail,
			title,
			text,
		}
	}
}

module.exports = {
	notify
}