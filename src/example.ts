import { Subprocess } from '.';
import { WritableBuffer } from './WritableBuffer';
import { WritableCallback } from './WritableCallback';
import * as tmp from 'tmp-promise';
import * as fs from 'fs';

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

  })().catch((err: any) => {
    console.error(err);
    process.exit(1);
  });
}
