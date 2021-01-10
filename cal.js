const R = require('ramda')

const IncludeEachOther = (a, b) => R.contains(a, b) || R.contains(b, a)
const correspondX = (str1, str2, str1_, str2_) => IncludeEachOther(str1, str1_) && IncludeEachOther(str2, str2_)
const correspondY = (str1, str2, str1_, str2_) => IncludeEachOther(str1, str2_) && IncludeEachOther(str2, str1_)
const equialName = (str1, str2, str1_, str2_) => correspondX(str1, str2, str1_, str2_) || correspondY(str1, str2, str1_, str2_)

const main = (bets) => {
    bets.forEach(v => console.log(`${v.name} count: ${R.path(['data', 'length'], v)}`))

    const translate = R.compose(R.flatten, R.map(R.prop('data')))(bets)
    let trans = translate.map(R.clone)
    let allBets = []

    for (const bet of translate) {
        const sameGames = trans.filter(g2 => equialName(bet.gamer_1, bet.gamer_2, g2.gamer_1, g2.gamer_2))
        if (sameGames && sameGames.length > 1) {
            trans = trans.filter(g2 => !equialName(bet.gamer_1, bet.gamer_2, g2.gamer_1, g2.gamer_2))
            allBets.push(sameGames)
        }
    }

    const combineBets = allBets
        .filter(R.compose(R.lt(1), R.length, R.uniq, R.map(R.prop('provider'))))
        .map(games => {
            const first = games.shift()
            const lineUp = games.map(g => {
                if (correspondX(first.gamer_1, first.gamer_2, g.gamer_1, g.gamer_2)) return g
                else return {
                    ...g,
                    gamer_1: g.gamer_2,
                    gamer_2: g.gamer_1,
                    coef_1: g.coef_2,
                    coef_2: g.coef_1,
                }
            })
            return [first, ...lineUp]
        })
    console.log(`match count: ${combineBets.length}`)

    const usefulGames = combineBets.filter(a => {
        const coef_1 = Math.max(...a.map(R.prop('coef_1')))
        const coef_2 = Math.max(...a.map(R.prop('coef_2')))
        const b1Money = 100 / parseFloat(coef_1)
        const b2Money = 100 / parseFloat(coef_2)

        const profit = (100 - b1Money - b2Money)
        if (profit > 0) {
            const bet1 = a.find(g => g.coef_1 == coef_1)
            const bet2 = a.find(g => g.coef_2 == coef_2)

            // const startTime = moment(bet1.date, 'YYYY-MM-DD HH:mm')
            // const end = moment(bet2.date, 'YYYY-MM-DD HH:mm')
            // var duration = moment.duration(end.diff(startTime))
            // var hours = duration.asHours()
            // if (bet1.provider != bet2.provider && Math.abs(hours) < 1) {

            if (bet1.provider != bet2.provider) {
                const data = `
${bet1.provider} bet ${b1Money.toFixed(2)}% on "${bet1.gamer_1}(odd: ${coef_1}, game: "${bet1.game}, time: "${bet1.date});risk_odd: ${(100 / (coef_2 - 1)).toFixed(2)}%",
${bet2.provider} bet ${b2Money.toFixed(2)}% on "${bet2.gamer_2}(odd: ${coef_2}, game: "${bet2.game}, time: "${bet2.date});risk_odd: ${(100 / (coef_1 - 1)).toFixed(2)}%".
profit: ${profit.toFixed(2)}%
------------------------------------------------------------------------------------------`
                console.log('\x1b[32m', data)
            }
        }
        return profit > 0
    })
    console.log(`useful games count: ${usefulGames.length}`)
}

module.exports = main
if (require.main === module) {
    const { bet365, tray65, tegb } = require('./test/mockdata')
    main([
        { name: 'ray', data: tray65, },
        { name: 'egb', data: tegb, },
    ])
}