const promisify = require('util').promisify;
const readdir = promisify(require('fs').readdir);

//Dynamically loads all trade parsers from the parsers directory
module.exports = async function () {
    const files = await readdir(__dirname + '/parsers');
    
    var result = [];

    for (var i = 0; i < files.length; ++i) {
        result.push(new (requireFromRoot('src/parse/parsers/' + files[i]))());
    }

    return result;
}