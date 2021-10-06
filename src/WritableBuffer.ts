import { Writable } from 'stream';
import { Future } from './Future';

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
        } catch (err: any) {
          callback(err);
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
