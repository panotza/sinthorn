const run = require('./src/main')
const { sleep } = require('./src/util')
const interval = +process.env.INTERVAL || 30000

async function main () {
	while (true) {
		await run()
		await sleep(interval)
	}	
}

main()