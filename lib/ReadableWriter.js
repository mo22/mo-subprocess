"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadableWriter = void 0;
const stream_1 = require("stream");
class ReadableWriter extends stream_1.Readable {
    args;
    constructor(args = {}) {
        super();
        this.args = args;
    }
    _read(size) {
        // ignored.
    }
    writeBuffer(data) {
        this.push(data);
    }
    writeLine(line) {
        this.writeBuffer(Buffer.from(line + (this.args.separator ?? '\n'), this.args.encoding ?? 'utf-8'));
    }
}
exports.ReadableWriter = ReadableWriter;
//# sourceMappingURL=ReadableWriter.js.map