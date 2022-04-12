import * as child_process from 'child_process';
import { Readable, Writable } from 'stream';
import { WritableBuffer, WritableBufferArgs } from './WritableBuffer';

export interface SubprocessArgs {
  command: string[];
  environment?: { [key: string]: string; };
  workingDirectory?: string;
  timeout?: number; // ms
  stdin?: Buffer | Uint8Array | Readable | 'inherit' | 'pipe';
  stdout?: Writable | 'inherit' | 'pipe';
  stderr?: Writable | 'inherit' | 'pipe';
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
    } else if (data === 'pipe') {
      return 'pipe';
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
    } else if (data === 'pipe') {
      return 'pipe';
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

  public getProcess() {
    return this.process;
  }

  public getExitCode() {
    return this.process.exitCode;
  }

  public isRunning() {
    return this.process.exitCode === null;
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
