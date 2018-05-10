const moment = require('moment');
const ExchangeParserBaseClass = requireFromRoot('src/parse/ExchangeParserBaseClass.js');
const newTradeEntry = requireFromRoot('src/model/TradeEntry.js');
const prepareCsvHeader = requireFromRoot('src/parse/PrepareCsvHeader.js');

const header = prepareCsvHeader(['txid', 'ordertxid', 'pair', 'time', 'type', 'ordertype', 'price', 'cost', 'fee', 'vol', 'margin', 'misc', 'ledgers']);
const timestampFormat = 'YYYY-MM-DD HH:mm:ss.SSSS';

function parsePair(pairString) {
    var base = pairString.substring(1, 4).toUpperCase();
    var quote = pairString.substring(5).toUpperCase();

    //Replace Kraken's XBT ticker symbol with the more commonly used BTC symbol
    if (base === 'XBT') {
        base = 'BTC';
    }

    if (quote === 'XBT') {
        quote = 'BTC';
    }

    return {
        base: base,
        quote: quote
    };
}

//cost = price * volume
//price is in quote currency
//volume is the number of shares of base currency
//fee is in quote currency
//volume is actual volume sold or bought, fee is applied separately
function parseTrade(row) {
    const pairString = row[header.columns['pair']];

    const pair = parsePair(pairString);

    if (pair === null) {
        throw new Error('Failed to parse pair in Kraken file: ' + pairString);
    }

    const time = row[header.columns['time']];
    const timestamp = moment(time, timestampFormat);
    
    if (!timestamp.isValid()) {
        throw new Error('Invalid timestamp pulled from Kraken file: ' + timestamp);
    }

    const type = row[header.columns['type']];
    const price = parseFloat(row[header.columns['price']]);

    const fee = {
        fee: parseFloat(row[header.columns['fee']]),
        currency: pair.quote
    };
    
    const volume = parseFloat(row[header.columns['vol']]);

    return newTradeEntry(
        pair.base,
        pair.quote,
        type,
        price,
        volume,
        fee,
        timestamp.valueOf(),
        'Kraken'
    );
}

class KrakenParser extends ExchangeParserBaseClass {
    constructor() {
        super(parseTrade);
    }
    header() {
        return header.header;
    }

    name() {
        return 'Kraken';
    }
}

module.exports = KrakenParser;