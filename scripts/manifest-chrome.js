import { copyFileSync } from 'fs';
import { join } from 'path';

const src = join(process.cwd(), 'manifest.json');
const dest = join(process.cwd(), 'dist/manifest.json');

copyFileSync(src, dest);
console.log('Chrome manifest copied to dist/manifest.json'); 