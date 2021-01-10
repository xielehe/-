const ray65 = require('./ray')
const egb = require('./egb')
const compare = require('./cal')

const moment = require('moment')
const colors = require('colors/safe')

const main = async () => {
    const ray_bets = await ray65()

    const egb_bet = await egb()

    console.log(colors.green('-----------------------'))

    compare([
        { name: 'ray', data: ray_bets, },
        { name: 'egb', data: egb_bet, },
    ])

    console.log(moment().format('YYYY-MM-DD HH:mm'))
}
main()