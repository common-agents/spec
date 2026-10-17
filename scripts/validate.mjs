// Validates every CAF agent under the given directories (default: examples/).
// Checks the frontmatter against the JSON Schema, that `name` matches the
// directory name, and that each listed skill is bundled in skills/ (a warning
// only, since the skill may already be installed in the harness).
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(readFileSync('schema/caf-1.0.schema.json', 'utf8')));

let failures = 0;
for (const root of process.argv.slice(2).length ? process.argv.slice(2) : ['examples']) {
  for (const dir of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const agentDir = join(root, dir.name);
    const file = join(agentDir, 'AGENT.md');
    const errors = [];
    if (!existsSync(file)) {
      errors.push('missing AGENT.md');
    } else {
      const match = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
      if (!match) {
        errors.push('missing frontmatter');
      } else {
        const fm = YAML.parse(match[1]);
        if (!validate(fm)) errors.push(...validate.errors.map((e) => `${e.instancePath || '/'} ${e.message}`));
        if (fm.name !== basename(agentDir)) errors.push(`name "${fm.name}" does not match directory "${basename(agentDir)}"`);
        for (const skill of fm.skills ?? []) {
          if (!existsSync(join(agentDir, 'skills', skill, 'SKILL.md'))) {
            console.warn(`warn  ${agentDir}: skill "${skill}" is not bundled`);
          }
        }
      }
    }
    if (errors.length) {
      failures++;
      console.error(`FAIL  ${agentDir}\n      ${errors.join('\n      ')}`);
    } else {
      console.log(`ok    ${agentDir}`);
    }
  }
}
process.exit(failures ? 1 : 0);
