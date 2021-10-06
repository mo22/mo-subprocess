/// <reference types="node" />
import { Writable } from 'stream';
export interface WritableCallbackArgs {
    onData?: (buffer: Buffer) => PromiseLike<void> | void;
    onClose?: () => PromiseLike<void> | void;
}
export declare class WritableCallback extends Writable {
    constructor(args: WritableCallbackArgs);
}
