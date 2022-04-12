"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subprocess = void 0;
const child_process = require("child_process");
const stream_1 = require("stream");
const WritableBuffer_1 = require("./WritableBuffer");
class Subprocess {
    args;
    process;
    stdinPipeDone;
    stdoutPipeDone;
    stderrPipeDone;
    constructor(args) {
        this.args = args;
        this.startProcess();
    }
    createInput(data) {
        if (data === undefined) {
            return 'ignore';
        }
        else if (data === 'inherit') {
            return 'inherit';
        }
        else if (data === 'pipe') {
            return 'pipe';
        }
        else if (data instanceof Uint8Array) {
            return stream_1.Readable.from(data);
        }
        else if (data instanceof stream_1.Readable) {
            return data;
        }
        else {
            throw new Error(`Subprocess: invalid input argument: ${data}`);
        }
    }
    createOutput(data) {
        if (data === undefined) {
            return 'ignore';
        }
        else if (data === 'inherit') {
            return 'inherit';
        }
        else if (data === 'pipe') {
            return 'pipe';
        }
        else if (data instanceof stream_1.Writable) {
            return data;
        }
        else {
            throw new Error(`Subprocess: invalid output argument: ${data}`);
        }
    }
    startProcess() {
        const stdin = this.createInput(this.args.stdin);
        const stdout = this.createOutput(this.args.stdout);
        const stderr = this.createOutput(this.args.stderr);
        this.process = child_process.spawn(this.args.command[0], this.args.command.slice(1), {
            timeout: this.args.timeout,
            cwd: this.args.workingDirectory,
            env: this.args.environment,
            stdio: [
                (stdin instanceof stream_1.Readable) ? 'pipe' : stdin,
                (stdout instanceof stream_1.Writable) ? 'pipe' : stdout,
                (stderr instanceof stream_1.Writable) ? 'pipe' : stderr,
            ],
            shell: this.args.shell || false,
            uid: this.args.uid,
            gid: this.args.gid,
        });
        if (stdin instanceof stream_1.Readable) {
            this.stdinPipeDone = new Promise((resolve, reject) => {
                stdin.pipe(this.process.stdin)
                    .on('error', (err) => reject(err))
                    .on('close', () => resolve());
            });
        }
        if (stdout instanceof stream_1.Writable) {
            this.stdoutPipeDone = new Promise((resolve, reject) => {
                this.process.stdout.pipe(stdout)
                    .on('error', (err) => reject(err))
                    .on('close', () => resolve());
            });
        }
        if (stderr instanceof stream_1.Writable) {
            this.stderrPipeDone = new Promise((resolve, reject) => {
                this.process.stderr.pipe(stderr)
                    .on('error', (err) => reject(err))
                    .on('close', () => resolve());
            });
        }
    }
    async waitFor() {
        await Promise.all([this.stdinPipeDone, this.stdoutPipeDone, this.stderrPipeDone]);
        return await new Promise((resolve, reject) => {
            this.process.on('error', (err) => reject(err));
            this.process.on('exit', (code, signal) => resolve((code !== null) ? code : (signal || '')));
        });
    }
    getProcess() {
        return this.process;
    }
    getExitCode() {
        return this.process.exitCode;
    }
    isRunning() {
        return this.process.exitCode === null;
    }
    static async exec(command, args = {}) {
        const proc = new Subprocess({
            command: command,
            stdout: 'inherit',
            stderr: 'inherit',
            ...args,
        });
        return await proc.waitFor();
    }
    // or rather return a Buffer?
    static async execOutput(command, args = {}) {
        const stdout = new WritableBuffer_1.WritableBuffer({
            ...args,
        });
        const proc = new Subprocess({
            command: command,
            stdout: stdout,
            stderr: 'inherit',
            ...args,
        });
        await proc.waitFor();
        return await stdout.waitForString();
    }
}
exports.Subprocess = Subprocess;
//# sourceMappingURL=Subprocess.js.map