//Maps CSV header column names to their respective column index
module.exports = function (header) {
    var columns = {};

    for (var i = 0; i < header.length; ++i) {
        columns[header[i]] = i;
    }

    return {
        header: header,
        columns: columns
    };
}