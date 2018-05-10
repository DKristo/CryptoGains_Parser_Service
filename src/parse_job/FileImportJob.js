const FileImportJobRequestHeader = requireFromRoot('src/parse_job/FileImportJobRequestHeader.js');
const loadTradeParsers = requireFromRoot('src/parse/LoadTradeParsers.js');
const parseTradesFromSource = requireFromRoot('src/parse/ParseTradesFromSource.js');

class FileImportJobHandler {
    constructor(fileName, payloadSize, onComplete) {
        this._onComplete = onComplete;
        this._assembledData = new Buffer(payloadSize);
        this._nextBufferIndex = 0;
    }

    onData(data) {
        data.copy(this._assembledData, this._nextBufferIndex);
        this._nextBufferIndex += data.length;
    }
    
    async onDataComplete() {
        try {
            const tradeParsers = await loadTradeParsers();
            const parsedTrades = await parseTradesFromSource(tradeParsers, this._assembledData);

            this._onComplete({ data: parsedTrades });
        } catch (err) {
            this._onComplete({ error: err.toString() });
        }
    }
}

class FileImportJob {
    constructor (socket) {
        var assembledHeaderBuffer = new Buffer(0);

        const header = new FileImportJobRequestHeader();
        header.addField('payloadSize', 8, (buffer, i) => { return buffer.readDoubleBE(i); });
        header.addField('fileNameSize', 2, (buffer, i) => { return buffer.readInt16BE(i); });
        header.addField('fileName', 0, function (buffer, i) { return buffer.slice(i, i + this.size()).toString('utf8'); });

        var totalBytesReceived = 0;
        var importer = null;

        socket.on('error', () => {});

        socket.on('data', (data) => {
            totalBytesReceived += data.length;

            if (header.headerReceived()) {
                importer.onData(data);
            } else {
                assembledHeaderBuffer = Buffer.concat([assembledHeaderBuffer, data]);

                header.processHeaderBuffer(assembledHeaderBuffer);

                if (header.headerReceived()) {
                    importer = new FileImportJobHandler(header.field('fileName').value(), header.field('payloadSize').value(), (importResult) => {
                        var jsonResult = null;

                        try {
                            jsonResult = JSON.stringify(importResult);
                        } catch (err) {
                            jsonResult = JSON.stringify({ error: 'Failed to convert import result to JSON' });
                        }
                        
                        socket.write(jsonResult);
                        socket.end();
                    });

                    importer.onData(assembledHeaderBuffer.slice(header.headerSize())); //Send remainder of data past header to the importer
                }
            }

            //We've received all of the data we are expecting
            if (header.headerReceived() && (totalBytesReceived === header.headerSize() + header.field('payloadSize').value())) {
                importer.onDataComplete();
            }
        });
    }
}

module.exports = FileImportJob;