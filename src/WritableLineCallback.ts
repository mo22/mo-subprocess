import { Writable } from 'stream';

export interface WritableLineCallbackArgs {
  onLine: (line: string) => PromiseLike<void> | void;
  onClose?: () => PromiseLike<void> | void;
  encoding?: BufferEncoding;
  separator?: string;
}

export class WritableLineCallback extends Writable {
  private buffer: string = '';
  public constructor(args: WritableLineCallbackArgs) {
    super({
      objectMode: false,
      write: async (chunk, encoding, callback) => {
        try {
          if (!(chunk instanceof Buffer)) {
            throw new Error(`WritableCallback: expected Buffer, got ${chunk}`);
          }
          this.buffer += chunk.toString(args.encoding ?? 'utf-8');
          const lines = this.buffer.split(args.separator ?? '\n');
          while (lines.length > 1) {
            await args.onLine(lines.shift()!);
          }
          this.buffer = lines[0];
          callback();
        } catch (err: any) {
          callback(err);
        }
      },
      final: async (callback) => {
        try {
          if (this.buffer.length > 0) {
            await args.onLine(this.buffer);
          }
          await args.onClose?.();
          callback();
        } catch (err: any) {
          callback(err);
        }
      }
    });
  }
}
