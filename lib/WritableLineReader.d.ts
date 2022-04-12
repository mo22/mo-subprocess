import { WritableLineCallback, WritableLineCallbackArgs } from "./WritableLineCallback";
export declare type WritableLineReaderArgs = Omit<WritableLineCallbackArgs, 'onLine' | 'onClose'>;
export declare class WritableLineReader extends WritableLineCallback {
    private lines;
    private signal;
    constructor(args: WritableLineReaderArgs);
    readLine(): Promise<string | undefined>;
}
