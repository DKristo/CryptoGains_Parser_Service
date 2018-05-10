const moment = require('moment');
const ExchangeParserBaseClass = requireFromRoot('src/parse/ExchangeParserBaseClass.js');
const newTradeEntry = requireFromRoot('src/model/TradeEntry.js');
const prepareCsvHeader = requireFromRoot('src/parse/PrepareCsvHeader.js');

const header = prepareCsvHeader(['OrderUuid', 'Exchange', 'Type', 'Quantity', 'Limit', 'CommissionPaid', 'Price', 'Opened', 'Closed']);
const timestampFormat = 'MM/DD/YYYY HH:mm:ss A';

function parsePair(pairString) {
    const dashIndex = pairString.indexOf('-');

    if (dashIndex === -1) {
        return null;
    }

    return {
        base: pairString.substring(dashIndex + 1).toUpperCase(),
        quote: pairString.substring(0, dashIndex).toUpperCase()
    };
}

function parseTradeType(typeString) {
    const underscoreIndex = typeString.indexOf('_');

    if (underscoreIndex === -1) {
        return null;
    }

    return typeString.substring(underscoreIndex + 1).toLowerCase();
}

//Price column is the total paid/received for the entire volume sold/bought
//CommissionPaid is not included in the Quantity, paid in Quote currency
function parseTrade(row) {
    const pairString = row[header.columns['Exchange']];
    const pair = parsePair(pairString);

    if (pair === null) {
        throw new Error('Failed to parse pair in Bittrex file: ' + pairString);
    }

    const time = row[header.columns['Closed']];
    const timestamp = moment(time, timestampFormat);
    
    if (!timestamp.isValid()) {
        throw new Error('Invalid timestamp pulled from Bittrex file: ' + timestamp);
    }

    const typeString = row[header.columns['Type']];
    const type = parseTradeType(typeString);

    if (type === null) {
        throw new Error('Failed to parse trade type in Bittrex file: ' + typeString);
    }

    const volume = parseFloat(row[header.columns['Quantity']]);

    //Shouldn't happen but just to be sure
    if (volume === 0) {
        throw new Error('Invalid zero volume found while parsing Bittrex trade');
    }

    const price = parseFloat(row[header.columns['Price']]) / volume;

    const fee = {
        fee: parseFloat(row[header.columns['CommissionPaid']]),
        currency: pair.quote
    };
    
    return newTradeEntry(
        pair.base,
        pair.quote,
        type,
        price,
        volume,
        fee,
        timestamp.valueOf(),
        'Bittrex'
    );
}

class BittrexParser extends ExchangeParserBaseClass {
    constructor() {
        super(parseTrade);
    }

    header() {
        return header.header;
    }

    name() {
        return 'Bittrex';
    }
}

module.exports = BittrexParser;