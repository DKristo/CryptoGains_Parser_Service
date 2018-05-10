class FileImportJobRequestHeader {
    constructor() {
        this._headerFields = [];
        this._headerReceived = false;
    }

    //Size of zero indicates the size was given in the last field
    addField(name, size, readFunction) {
        const previousField = (this._headerFields.length > 0) ? this._headerFields[this._headerFields.length - 1] : null;
        var value = null;

        const field = {
            name: () => {
                return name;
            },
            size: () => {
                return (size > 0) ? size : previousField.value();
            },
            readFunction: (buffer, index) => {
                value = readFunction.call(field, buffer, index);
            },
            value: () => {
                return value;
            }
        };

        this._headerFields.push(field);
    }

    field(name) {
        for (var i = 0; i < this._headerFields.length; ++i) {
            const field = this._headerFields[i];

            if (field.name() === name) {
                return field;
            }
        }

        return null;
    }

    processHeaderBuffer(buffer) {
        var headerFieldByteIndex = 0;

        for (var i = 0; i < this._headerFields.length; ++i) {
            const field = this._headerFields[i];

            if (buffer.length >= headerFieldByteIndex + field.size()) {
                field.readFunction(buffer, headerFieldByteIndex);
                headerFieldByteIndex += field.size();

                if (i === this._headerFields.length - 1) {
                    this._headerReceived = true;
                }
            }
        }
    }

    headerReceived() {
        return this._headerReceived;
    }

    headerSize() {
        var result = 0;

        for (var i = 0; i < this._headerFields.length; ++i) {
            result += this._headerFields[i].size();
        }

        return result;
    }
}

module.exports = FileImportJobRequestHeader;