/// <reference types="node" />
import { Writable } from 'stream';
export interface WritableBufferArgs {
    maxSize?: number;
}
export declare class WritableBuffer extends Writable {
    private size;
    private buffers;
    private done;
    constructor(args?: WritableBufferArgs);
    waitFor(): Promise<void>;
    toBuffer(): Buffer;
    toString(): string;
    waitForBuffer(): Promise<Buffer>;
    waitForString(): Promise<string>;
}
