import { Readable } from 'stream';

export interface ReadableWriterArgs {
  encoding?: BufferEncoding;
  separator?: string;
}

export class ReadableWriter extends Readable {
  public constructor(private args: ReadableWriterArgs = {}) {
    super();
  }

  public _read(size: number) {
    // ignored.
  }

  public writeBuffer(data: Buffer) {
    this.push(data);
  }

  public writeLine(line: string) {
    this.writeBuffer(Buffer.from(line + (this.args.separator ?? '\n'), this.args.encoding ?? 'utf-8'));
  }
}
