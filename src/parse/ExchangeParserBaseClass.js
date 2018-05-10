class ExchangeParserBaseClass {
    constructor(parseTrade) {
        this._parseTrade = parseTrade;
    }

    header() {
        return [];
    }

    name() {
        return 'Exchange Parser Base Class';
    }

    async parse(rows) {
        var trades = [];

        for (var i = 1; i < rows.length; ++i) {
            try {
                const trade = this._parseTrade(rows[i]);
                trades.push(trade);
            } catch (err) {
                console.log(err);
            }
        }

        return trades;
    }
}

module.exports = ExchangeParserBaseClass;