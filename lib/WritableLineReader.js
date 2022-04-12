"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WritableLineReader = void 0;
const Future_1 = require("./Future");
const WritableLineCallback_1 = require("./WritableLineCallback");
class WritableLineReader extends WritableLineCallback_1.WritableLineCallback {
    lines = [];
    signal = new Future_1.Future();
    constructor(args = {}) {
        super({
            ...args,
            onLine: (line) => {
                this.lines.push(line);
                this.signal.resolve();
            },
            onClose: () => {
                this.signal.resolve();
            },
        });
    }
    async readLine() {
        if (this.lines.length === 0) {
            await this.signal.promise;
            this.signal = new Future_1.Future();
        }
        if (this.lines.length > 0) {
            return this.lines.shift();
        }
        else {
            return undefined;
        }
    }
}
exports.WritableLineReader = WritableLineReader;
//# sourceMappingURL=WritableLineReader.js.map