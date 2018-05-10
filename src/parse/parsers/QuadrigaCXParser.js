const moment = require('moment');
const ExchangeParserBaseClass = requireFromRoot('src/parse/ExchangeParserBaseClass.js');
const newTradeEntry = requireFromRoot('src/model/TradeEntry.js');
const prepareCsvHeader = requireFromRoot('src/parse/PrepareCsvHeader.js');

const header = prepareCsvHeader(['type', 'major', 'minor', 'amount', 'rate', 'value', 'fee', 'total', 'timestamp', 'datetime']);
const timestampFormat = 'MM/DD/YYYY HH:mm:ss';

//Use total as volume for buys since fees are taken out of amount
//Use amount as volume for sells
function parseTrade(row) {
    const timestamp = moment(row[header.columns['datetime']], timestampFormat);

    if (!timestamp.isValid()) {
        throw new Error('Invalid timestamp pulled from QuadrigaCX file: ' + timestamp);
    }

    const baseCurrency = row[header.columns['major']].toUpperCase();
    const quoteCurrency = row[header.columns['minor']].toUpperCase();
    const type = row[header.columns['type']];
    const price = parseFloat(row[header.columns['rate']]);

    const fee = {
        fee: parseFloat(row[header.columns['fee']]),
        currency: (type === 'buy') ? baseCurrency : quoteCurrency
    };

    const volume = parseFloat(row[header.columns['amount']]);

    return newTradeEntry(
        baseCurrency,
        quoteCurrency,
        type,
        price,
        volume,
        fee,
        timestamp.valueOf(),
        'QuadrigaCX'
    );
}

class QuadrigaCXParser extends ExchangeParserBaseClass {
    constructor() {
        super(parseTrade);
    }

    header() {
        return header.header;
    }

    name() {
        return 'QuadrigaCX';
    }
}

module.exports = QuadrigaCXParser;