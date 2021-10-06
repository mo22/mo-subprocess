/// <reference types="node" />
import * as child_process from 'child_process';
import { Readable, Writable } from 'stream';
import { WritableBufferArgs } from './WritableBuffer';
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
    getProcess(): child_process.ChildProcess;
    getExitCode(): number | null;
    isRunning(): boolean;
    static exec(command: SubprocessArgs['command'], args?: Omit<SubprocessArgs, 'command'>): Promise<string | number>;
    static execOutput(command: SubprocessArgs['command'], args?: Omit<Omit<SubprocessArgs, 'command'>, 'stdout'> & WritableBufferArgs): Promise<string>;
}
