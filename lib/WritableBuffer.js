"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WritableBuffer = void 0;
const stream_1 = require("stream");
const Future_1 = require("./Future");
class WritableBuffer extends stream_1.Writable {
    size = 0;
    buffers = [];
    done = new Future_1.Future();
    constructor(args = {}) {
        super({
            objectMode: false,
            write: (chunk, encoding, callback) => {
                try {
                    if (!(chunk instanceof Buffer)) {
                        throw new Error(`WritableBuffer: expected Buffer, got ${chunk}`);
                    }
                    this.buffers.push(chunk);
                    this.size += chunk.byteLength;
                    if (args.maxSize !== undefined && this.size > args.maxSize) {
                        throw new Error(`WritableBuffer: maxSize ${args.maxSize} exceeded`);
                    }
                    callback();
                }
                catch (err) {
                    callback(err);
                }
            },
            final: (callback) => {
                this.done.resolve();
                callback();
            }
        });
    }
    waitFor() {
        return this.done.promise;
    }
    toBuffer() {
        return Buffer.concat(this.buffers, this.size);
    }
    toString() {
        return this.toBuffer().toString('utf-8');
    }
    async waitForBuffer() {
        await this.waitFor();
        return this.toBuffer();
    }
    async waitForString() {
        await this.waitFor();
        return this.toString();
    }
}
exports.WritableBuffer = WritableBuffer;
//# sourceMappingURL=WritableBuffer.js.map