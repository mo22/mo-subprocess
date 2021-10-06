"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const WritableBuffer_1 = require("./WritableBuffer");
const WritableCallback_1 = require("./WritableCallback");
const tmp = require("tmp-promise");
const fs = require("fs");
if (require.main === module) {
    (async () => {
        const stdout1 = new WritableCallback_1.WritableCallback({
            onData: (buffer) => {
                console.log('onData', buffer);
            },
            onClose: () => {
                console.log('onClose');
            }
        });
        const stdout2 = new WritableBuffer_1.WritableBuffer();
        const stderr2 = new WritableBuffer_1.WritableBuffer();
        if (0)
            console.log(stdout1, stdout2, stderr2);
        // const test = fs.createWriteStream('output.txt');
        await tmp.withFile(async (file) => {
            await _1.Subprocess.exec(['ls', '-la'], { stdout: fs.createWriteStream('', { fd: file.fd }) });
            console.log(file.path);
            console.log(await fs.promises.readFile(file.path));
        });
        console.log(await _1.Subprocess.execOutput(['ls', '-la']));
        const proc = new _1.Subprocess({
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
    })().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
//# sourceMappingURL=example.js.map