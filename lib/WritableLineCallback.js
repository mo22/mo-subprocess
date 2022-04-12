"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WritableLineCallback = void 0;
const stream_1 = require("stream");
class WritableLineCallback extends stream_1.Writable {
    buffer = '';
    constructor(args) {
        super({
            objectMode: false,
            write: async (chunk, encoding, callback) => {
                try {
                    if (!(chunk instanceof Buffer)) {
                        throw new Error(`WritableCallback: expected Buffer, got ${chunk}`);
                    }
                    this.buffer += chunk.toString(args.encoding ?? 'utf-8');
                    const lines = this.buffer.split(args.separator ?? '\n');
                    while (lines.length > 1) {
                        await args.onLine(lines.shift());
                    }
                    this.buffer = lines[0];
                    callback();
                }
                catch (err) {
                    callback(err);
                }
            },
            final: async (callback) => {
                try {
                    if (this.buffer.length > 0) {
                        await args.onLine(this.buffer);
                    }
                    await args.onClose?.();
                    callback();
                }
                catch (err) {
                    callback(err);
                }
            }
        });
    }
}
exports.WritableLineCallback = WritableLineCallback;
//# sourceMappingURL=WritableLineCallback.js.map