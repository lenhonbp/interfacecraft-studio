import Ajv2020 from 'ajv/dist/2020.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const schemaRoot = fileURLToPath(new URL('../schemas/', import.meta.url));
const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);
ajv.addFormat('date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);

const cache = new Map();

export async function validateJsonSchema(schemaFile, value) {
  let validator = cache.get(schemaFile);
  if (!validator) {
    const schema = JSON.parse(await readFile(`${schemaRoot}/${schemaFile}`, 'utf8'));
    validator = ajv.compile(schema);
    cache.set(schemaFile, validator);
  }
  const valid = validator(value);
  return { valid: Boolean(valid), errors: valid ? [] : (validator.errors || []).map((error) => ({ instancePath: error.instancePath, keyword: error.keyword, message: error.message, params: error.params })) };
}

export async function assertJsonSchema(schemaFile, value, label = schemaFile) {
  const result = await validateJsonSchema(schemaFile, value);
  if (!result.valid) {
    const details = result.errors.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ');
    throw new Error(`${label} does not conform to ${schemaFile}: ${details}`);
  }
  return result;
}
