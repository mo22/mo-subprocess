import * as child_process from 'child_process';
import * as fs from 'fs';
import { Readable, Writable } from 'stream';
import * as tmp from 'tmp-promise';

export class Future<T> {
  public readonly promise: Promise<T>;
  public resolve!: (value: T | PromiseLike<T>) => void;
  public reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}


export interface WritableCallbackArgs {
  onData: (buffer: Buffer) => PromiseLike<void> | void;
  onClose: () => PromiseLike<void> | void;
}

export class WritableCallback extends Writable {
  public constructor(args: WritableCallbackArgs) {
    super({
      objectMode: false,
      write: async (chunk, encoding, callback) => {
        try {
          if (!(chunk instanceof Buffer)) {
            throw new Error(`WritableCallback: expected Buffer, got ${chunk}`);
          }
          await args.onData(chunk);
          callback();
        } catch (e) {
          callback(e);
        }
      },
      final: async (callback) => {
        try {
          await args.onClose();
          callback();
        } catch (e) {
          callback(e);
        }
      }
    });
  }
}


export interface WritableBufferArgs {
  maxSize?: number;
}

export class WritableBuffer extends Writable {
  private size: number = 0;
  private buffers: Buffer[] = [];
  private done = new Future<void>();

  public constructor(args: WritableBufferArgs = {}) {
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
        } catch (e) {
          callback(e);
        }
      },
      final: (callback) => {
        this.done.resolve();
        callback();
      }
    });
  }

  public waitFor(): Promise<void> {
    return this.done.promise;
  }

  public toBuffer() {
    return Buffer.concat(this.buffers, this.size);
  }

  public toString() {
    return this.toBuffer().toString('utf-8');
  }

  public async waitForBuffer() {
    await this.waitFor();
    return this.toBuffer();
  }

  public async waitForString() {
    await this.waitFor();
    return this.toString();
  }
}


export interface SubprocessArgs {
  command: string[];
  environment?: { [key: string]: string; };
  workingDirectory?: string;
  timeout?: number; // ms
  stdin?: Buffer | Uint8Array | Readable | 'inherit';
  stdout?: Writable | 'inherit';
  stderr?: Writable | 'inherit';
  uid?: number;
  gid?: number;
  shell?: boolean | string;
}

export class Subprocess {
  private process!: child_process.ChildProcess;
  private stdinPipeDone?: Promise<void>;
  private stdoutPipeDone?: Promise<void>;
  private stderrPipeDone?: Promise<void>;

  public constructor(private args: SubprocessArgs) {
    this.startProcess();
  }

  private createInput(data: SubprocessArgs['stdin']) {
    if (data === undefined) {
      return 'ignore';
    } else if (data === 'inherit') {
      return 'inherit';
    } else if (data instanceof Uint8Array) {
      return Readable.from(data);
    } else if (data instanceof Readable) {
      return data;
    } else {
      throw new Error(`Subprocess: invalid input argument: ${data}`);
    }
  }

  private createOutput(data: SubprocessArgs['stdout']) {
    if (data === undefined) {
      return 'ignore';
    } else if (data === 'inherit') {
      return 'inherit';
    } else if (data instanceof Writable) {
      return data;
    } else {
      throw new Error(`Subprocess: invalid output argument: ${data}`);
    }
  }

  private startProcess() {
    const stdin = this.createInput(this.args.stdin);
    const stdout = this.createOutput(this.args.stdout);
    const stderr = this.createOutput(this.args.stderr);

    this.process = child_process.spawn(
      this.args.command[0],
      this.args.command.slice(1),
      {
        timeout: this.args.timeout,
        cwd: this.args.workingDirectory,
        env: this.args.environment,
        stdio: [
          (stdin instanceof Readable) ? 'pipe' : stdin,
          (stdout instanceof Writable) ? 'pipe' : stdout,
          (stderr instanceof Writable) ? 'pipe' : stderr,
        ],
        shell: this.args.shell || false,
        uid: this.args.uid,
        gid: this.args.gid,
      },
    );

    if (stdin instanceof Readable) {
      this.stdinPipeDone = new Promise<void>((resolve, reject) => {
        stdin.pipe(this.process.stdin!)
          .on('error', (err) => reject(err))
          .on('close', () => resolve());
      });
    }
    if (stdout instanceof Writable) {
      this.stdoutPipeDone = new Promise<void>((resolve, reject) => {
        this.process.stdout!.pipe(stdout)
          .on('error', (err) => reject(err))
          .on('close', () => resolve());
      });
    }
    if (stderr instanceof Writable) {
      this.stderrPipeDone = new Promise<void>((resolve, reject) => {
        this.process.stderr!.pipe(stderr)
          .on('error', (err) => reject(err))
          .on('close', () => resolve());
      });
    }
  }

  public async waitFor(): Promise<number | string> {
    await Promise.all([this.stdinPipeDone, this.stdoutPipeDone, this.stderrPipeDone]);
    return await new Promise<number | string>((resolve, reject) => {
      this.process.on('error', (err) => reject(err));
      this.process.on('exit', (code, signal) => resolve((code !== null) ? code : (signal || '')));
    });
  }

  public static async exec(command: SubprocessArgs['command'], args: Omit<SubprocessArgs, 'command'> = {}) {
    const proc = new Subprocess({
      command: command,
      stdout: 'inherit',
      stderr: 'inherit',
      ...args,
    });
    return await proc.waitFor();
  }

  // or rather return a Buffer?
  public static async execOutput(command: SubprocessArgs['command'], args: Omit<Omit<SubprocessArgs, 'command'>, 'stdout'> & WritableBufferArgs = {}) {
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

    if (0) console.log(stdout1, stdout2, stderr2);

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
