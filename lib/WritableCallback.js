"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WritableCallback = void 0;
const stream_1 = require("stream");
class WritableCallback extends stream_1.Writable {
    constructor(args) {
        super({
            objectMode: false,
            write: async (chunk, encoding, callback) => {
                try {
                    if (!(chunk instanceof Buffer)) {
                        throw new Error(`WritableCallback: expected Buffer, got ${chunk}`);
                    }
                    await args.onData?.(chunk);
                    callback();
                }
                catch (err) {
                    callback(err);
                }
            },
            final: async (callback) => {
                try {
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
exports.WritableCallback = WritableCallback;
//# sourceMappingURL=WritableCallback.js.map