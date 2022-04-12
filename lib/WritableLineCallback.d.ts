/// <reference types="node" />
import { Writable } from 'stream';
export interface WritableLineCallbackArgs {
    onLine: (line: string) => PromiseLike<void> | void;
    onClose?: () => PromiseLike<void> | void;
    encoding?: BufferEncoding;
    separator?: string;
}
export declare class WritableLineCallback extends Writable {
    private buffer;
    constructor(args: WritableLineCallbackArgs);
}
