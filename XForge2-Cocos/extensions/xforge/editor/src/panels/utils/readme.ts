import { readFileSync } from 'fs';
import { join } from 'path';

export function getReadme(name: 'assembly' | 'assetbundle' | 'global' | 'module') {
    const Assets = join(__dirname, '../res/readme');
    return readFileSync(join(Assets, `${name}.md`), 'utf-8');
}
