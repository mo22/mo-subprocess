"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Future = void 0;
class Future {
    promise;
    resolve;
    reject;
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
exports.Future = Future;
//# sourceMappingURL=Future.js.map