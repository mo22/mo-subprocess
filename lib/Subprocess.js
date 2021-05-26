"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subprocess = exports.WritableBuffer = exports.WritableCallback = exports.Future = void 0;
const child_process = require("child_process");
const fs = require("fs");
const stream_1 = require("stream");
const tmp = require("tmp-promise");
class Future {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
exports.Future = Future;
class WritableCallback extends stream_1.Writable {
    constructor(args) {
        super({
            objectMode: false,
            write: async (chunk, encoding, callback) => {
                try {
                    if (!(chunk instanceof Buffer)) {
                        throw new Error(`WritableCallback: expected Buffer, got ${chunk}`);
                    }
                    await args.onData(chunk);
                    callback();
                }
                catch (e) {
                    callback(e);
                }
            },
            final: async (callback) => {
                try {
                    await args.onClose();
                    callback();
                }
                catch (e) {
                    callback(e);
                }
            }
        });
    }
}
exports.WritableCallback = WritableCallback;
class WritableBuffer extends stream_1.Writable {
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
                catch (e) {
                    callback(e);
                }
            },
            final: (callback) => {
                this.done.resolve();
                callback();
            }
        });
        this.size = 0;
        this.buffers = [];
        this.done = new Future();
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
class Subprocess {
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
        const stdout = new WritableBuffer({
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
if (require.main === module) {
    (async () => {
        const stdout1 = new WritableCallback({
            onData: (buffer) => {
                console.log('onData', buffer);
            },
            onClose: () => {
                console.log('onClose');
            }
        });
        const stdout2 = new WritableBuffer();
        const stderr2 = new WritableBuffer();
        if (0)
            console.log(stdout1, stdout2, stderr2);
        // const test = fs.createWriteStream('output.txt');
        await tmp.withFile(async (file) => {
            await Subprocess.exec(['ls', '-la'], { stdout: fs.createWriteStream('', { fd: file.fd }) });
            console.log(file.path);
            console.log(await fs.promises.readFile(file.path));
        });
        console.log(await Subprocess.execOutput(['ls', '-la']));
        const proc = new Subprocess({
            // command: ['ls', '-la'],
            command: ['cat', '-'],
            // stdin: 'hallo welt\n',
            stdin: fs.createReadStream('tsconfig.json'),
            // stdout: 'inherit',
            stdout: stdout2,
            stderr: stderr2,
        });
        const code = await proc.waitFor();
        console.log('done, exit code', code);
        console.log('stdout', JSON.stringify(await stdout2.waitForString()));
        console.log('stderr', JSON.stringify(await stderr2.waitForString()));
    })().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
//# sourceMappingURL=Subprocess.js.map