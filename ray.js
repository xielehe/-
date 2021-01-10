const R = require('ramda')
const moment = require('moment')
const puppeteer = require('puppeteer')
const URL = 'https://incpgameinfo.esportsworldlink.com/v2/match?page=1&match_type=2'

const main = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 250,
        executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
        args: [`--window-size=${1200},${800}`, '--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    try {
        await page.goto(URL, { timeout: 9000, 'waitUntil': 'networkidle2' })
        const element = await page.$('pre')
        const text = await page.evaluate(element => element.textContent, element)
        const contents = JSON.parse(text)
        const bets = R.compose(
            R.map(R.evolve({
                date: a => moment(a, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm'),
                gamer_1: R.toLower,
                gamer_2: R.toLower,
            })),
            R.map(a => {
                const { odds } = a
                return {
                    gamer_1: odds[0].name,
                    gamer_2: odds[1].name,
                    coef_1: odds[0].odds,
                    coef_2: odds[1].odds,
                    date: a.start_time,
                    provider: 'ray65',
                    game: a.game_name,
                }
            }),
            R.filter(R.has('odds')),
            R.map(R.evolve({
                odds: R.map(R.pick(['name', 'odds'])),
            })),
            R.filter(a => moment().isBefore(moment(a.start_time, 'YYYY-MM-DD HH:mm:ss'))),
            R.map(R.pick(['odds', 'start_time', 'game_name'])),
            R.prop('result'),
        )(contents)
        await browser.close()
        console.log('ray65 finished...')
        return bets
    } catch (error) {
        console.log(error)
        await browser.close()
        return []
    }





}
module.exports = main
if (require.main === module) {
    main()
        .then(console.log)
}