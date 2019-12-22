require('console-stamp')(console, {})
require('dotenv').config()

const util = require('./util')
const line = require('./line')

const Datastore = require('nedb')

async function setupDb () {
	console.log('setup db connection')
	const db = new Datastore({ filename: process.env.DB_PATH, autoload: true });

	return {
		listNotify: async function () {
			return new Promise((resolve, reject) => {
				db
					.find({ notified: false })
					.sort({ 'created_at': 1 })
					.exec((err, docs) => {
						if (err) {
							return reject(err)
						}

						resolve(docs)
					})
			})
		},
		saveTopics: async function ({ url, title, thumbnail, created_by }) {
			const topic = {
				_id: url,
				title,
				thumbnail,
				created_by,
				notified: false,
				created_at: new Date().getTime()
			}

			const isExists = await new Promise((resolve, reject) => {
				db.findOne({ _id: url }, (err, doc) => {
					if (err) {
						return reject(err)
					}
					resolve(doc)
				})
			})

			if (isExists) {
				return
			}

			return new Promise((resolve, reject) => {
				db.insert(topic, (err, newDocs) => {
					if (err) {
						return reject(err)
					}

					resolve(newDocs)
				})
			})
		},
		setNotified: function (topic) {
			topic.notified = true
			return new Promise((resolve, reject) => {
				db.update({ _id: topic._id }, topic, {}, (err, numReplaced) => {
					if (err) {
						return reject(err)
					}

					resolve(numReplaced)
				})
			})
		},
		close: function () {
			console.log('close db connection')
		}
	}
}

async function collectTopics (db) {
	console.log('collect topics')

	const url = 'https://pantip.com/tag/%E0%B8%AB%E0%B8%B8%E0%B9%89%E0%B8%99'
	const browser = await require('puppeteer-core').launch({
		headless: true,
		executablePath: process.env.CHROME_BIN || null,
		args: ['--no-sandbox', '--headless', '--disable-gpu']
	})
	const page = await browser.newPage()
	await page.goto(url, { waitUntil: 'networkidle2' })
	await page.waitForSelector('#pt-topic-left')

	const data = await page.evaluate(async () => {
		function extractThumbnail (s) {
			const r = s.match(/https:\/\/.+\.(png|jpg|gif)/)
			if (!r) {
				return null
			}
			return r[0]
		}

		function sleep (ms) {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve()
				}, ms)
			})
		}

		document.documentElement.style['scrollBehavior'] = 'auto' // disable page animation
		const container = document.querySelector('#pt-topic-left')
		const data = []
		const list = container.querySelectorAll('li')

		for (let i = 0; i < 10; i++) {
			const e = list[i]
			if (e.classList.contains('pt-list-item__no-img')) {
				data.push({ 
					url: e.children[0].children[0].children[0].href,
					title: e.children[0].children[0].children[0].innerText,
					thumbnail: null,
					created_by: e.children[2].children[1].innerText					
				})
			} else {
				e.scrollIntoView()
				let thumbnail;
				while (!thumbnail) {
					await sleep(100) // wait for scroll animation
					thumbnail = e.getElementsByClassName('pt-list-item__img img-thumbnail').item(0)
				}

				data.push({ 
					url: e.children[0].children[0].children[0].href,
					title: e.children[0].children[0].children[0].innerText,
					thumbnail: extractThumbnail(thumbnail.attributes.getNamedItem('style').nodeValue) || null,
					created_by: e.children[2].children[1].innerText
				})
			}
		}

		return data
	})
	for (dat of data.reverse()) {
		await db.saveTopics(dat)
		await util.sleep(1) // for timestamp order precision
	}
	await page.close()
	await browser.close()
}

async function notify (db) {

	const list = await db.listNotify()
	if (list.length > 0) {
		console.log('notify')
	} else {
		console.log('no new topic, skip notify')
	}
	for (const it of list) {
		await line.notify({
			uri: it._id,
			title: it.title,
			text: it.created_by,
			thumbnail: it.thumbnail
		})
		await db.setNotified(it)
		util.sleep(1000)
	}
}

async function run () {
	try {
		const db = await setupDb()
		await collectTopics(db)
		await notify(db)
		await db.close()
	} catch (err) {
		console.error(err)
	}

	setTimeout(() => { run() }, 30000)
}

module.exports = run