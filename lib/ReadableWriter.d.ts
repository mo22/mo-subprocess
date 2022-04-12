/// <reference types="node" />
import { Readable } from 'stream';
export interface ReadableWriterArgs {
    encoding?: BufferEncoding;
    separator?: string;
}
export declare class ReadableWriter extends Readable {
    private args;
    constructor(args?: ReadableWriterArgs);
    _read(size: number): void;
    writeBuffer(data: Buffer): void;
    writeLine(line: string): void;
}
