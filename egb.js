const R = require('ramda')
const moment = require('moment')
const puppeteer = require('puppeteer')
const URL = 'https://egb.com/play/simple_bets'

const main = async () => {
    let result = null
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 250,
        executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
        args: [`--window-size=${1200},${800}`, '--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()

    try {
        page.on('response', async response => {
            const url = response.url()
            if (url.indexOf('bets') != -1 &&
                url.indexOf('ajax') != -1 &&
                url.indexOf('st=0') != -1 &&
                url.indexOf('ut=0') != -1
            ) {
                const text = await response.text()
                const res = JSON.parse(text)
                const bets = R.compose(
                    R.map(R.evolve({
                        date: a => moment.unix(a).format('YYYY-MM-DD HH:mm'),
                        gamer_1: R.toLower,
                        gamer_2: R.toLower,
                    })),
                    R.map(a => ({ ...a, provider: 'egb', })),
                    R.filter(a => moment().isBefore(moment.unix(a.date))),
                    R.filter(a => moment.unix(a.date).isBefore(moment().add(30, 'hours'))),
                    R.map(R.evolve({
                        gamer_1: R.prop('nick'),
                        gamer_2: R.prop('nick'),
                    })),
                    R.map(R.pick(['date', 'game', 'coef_1', 'coef_2', 'gamer_1', 'gamer_2'])),
                    R.prop('bets')
                )(res)
                result = bets
            }
        })
        await page.goto(URL, { timeout: 0, 'waitUntil': 'networkidle2' })
        await page.setViewport({ width: 1200, height: 800 })
        await page.waitFor(10000)
        await browser.close()
        console.log('egb finished...')
        return result
    } catch (error) {
        console.log(error)
        await browser.close()
        return []
    }
}

module.exports = main
if (require.main === module) {
    main().then(console.log)
}
