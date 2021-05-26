/// <reference types="node" />
import { Readable, Writable } from 'stream';
export declare class Future<T> {
    readonly promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
    constructor();
}
export interface WritableCallbackArgs {
    onData: (buffer: Buffer) => PromiseLike<void> | void;
    onClose: () => PromiseLike<void> | void;
}
export declare class WritableCallback extends Writable {
    constructor(args: WritableCallbackArgs);
}
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
export interface SubprocessArgs {
    command: string[];
    environment?: {
        [key: string]: string;
    };
    workingDirectory?: string;
    timeout?: number;
    stdin?: Buffer | Uint8Array | Readable | 'inherit';
    stdout?: Writable | 'inherit';
    stderr?: Writable | 'inherit';
    uid?: number;
    gid?: number;
    shell?: boolean | string;
}
export declare class Subprocess {
    private args;
    private process;
    private stdinPipeDone?;
    private stdoutPipeDone?;
    private stderrPipeDone?;
    constructor(args: SubprocessArgs);
    private createInput;
    private createOutput;
    private startProcess;
    waitFor(): Promise<number | string>;
    static exec(command: SubprocessArgs['command'], args?: Omit<SubprocessArgs, 'command'>): Promise<string | number>;
    static execOutput(command: SubprocessArgs['command'], args?: Omit<Omit<SubprocessArgs, 'command'>, 'stdout'> & WritableBufferArgs): Promise<string>;
}
