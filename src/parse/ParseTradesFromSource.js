const csvParse = require('csv-parse');
const iconv = require('iconv-lite');

function handleCharacterEncoding(buffer) {
    var isUtf16 = false;

    //Based on the filetypes we support, we know those using utf-16 have null bytes in the header
    for (var i = 0; i < 10; ++i) {
        if (buffer[i] === 0) {
            isUtf16 = true;
            break;
        }
    }

    if (isUtf16) {
        return new Buffer(iconv.decode(buffer, 'utf16'));
    }

    return buffer;
}

function parseCsv(fileContents) {
    return new Promise(resolve => {
        csvParse(fileContents.toString(), { delimiter: ',' }, (err, output) => {
            if (err) {
                throw new Error('Failed to parse CSV file');
            }

            resolve(output);
        });
    });
}

async function parseFile(fileContents, tradeParsers) {
    const output = await parseCsv(fileContents);

    if (output.length === 0) {
        throw new Error('CSV file is empty');
    }

    const parser = findAppropriateParserFromHeader(tradeParsers, output[0]);

    if (parser === null) {
        throw new Error('No suitable parser found for file');
    }

    return await parser.parse(output);
}

//Returns true if the parser's header is equal to the supplied header
function checkParser(parser, header) {
    var fileFormatHeader = parser.header();

    if (fileFormatHeader.length === header.length) {
        for (var j = 0; j < header.length; ++j) {
            if (header[j] !== fileFormatHeader[j]) {
                return false;
            }
        }

        return true; //All header column names were as expected, this parser is a match
    }

    return false;
}

//Looks at the header row to determine the appropriate parser to use for a given file
//Returns null if a parser can't be matched to the header
function findAppropriateParserFromHeader(tradeParsers, header) {
    for (var i = 0; i < tradeParsers.length; ++i) {
        var parser = tradeParsers[i];

        if (checkParser(parser, header)) {
            return parser;
        }      
    }

    return null;
}

module.exports = async function (tradeParsers, fileContents) {    
    return await parseFile(handleCharacterEncoding(fileContents), tradeParsers);
}