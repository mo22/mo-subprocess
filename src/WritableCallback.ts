import { Writable } from 'stream';

export interface WritableCallbackArgs {
  onData?: (buffer: Buffer) => PromiseLike<void> | void;
  onClose?: () => PromiseLike<void> | void;
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
          await args.onData?.(chunk);
          callback();
        } catch (err: any) {
          callback(err);
        }
      },
      final: async (callback) => {
        try {
          await args.onClose?.();
          callback();
        } catch (err: any) {
          callback(err);
        }
      }
    });
  }
}
