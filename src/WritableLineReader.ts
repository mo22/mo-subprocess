import { Future } from "./Future";
import { WritableLineCallback, WritableLineCallbackArgs } from "./WritableLineCallback";

export type WritableLineReaderArgs = Omit<WritableLineCallbackArgs, 'onLine' | 'onClose'>;

export class WritableLineReader extends WritableLineCallback {
  private lines: string[] = [];
  private signal = new Future<void>();

  public constructor(args: WritableLineReaderArgs = {}) {
    super({
      ...args,
      onLine: (line: string) => {
        this.lines.push(line);
        this.signal.resolve();
      },
      onClose: () => {
        this.signal.resolve();
      },
    });
  }

  public async readLine(): Promise<string | undefined> {
    if (this.lines.length === 0) {
      await this.signal.promise;
      this.signal = new Future<void>();
    }
    if (this.lines.length > 0) {
      return this.lines.shift()!;
    } else {
      return undefined;
    }
  }
}
