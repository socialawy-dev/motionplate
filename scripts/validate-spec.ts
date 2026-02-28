import fs from 'fs';
import path from 'path';
import { validateSequence } from '../src/spec/validator';

/**
 * CLI utility to validate a MotionPlate sequence.json file.
 * Usage: npx tsx scripts/validate-spec.ts path/to/sequence.json
 */

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Usage: npx tsx scripts/validate-spec.ts <path-to-json>');
        process.exit(1);
    }

    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: File not found at ${absolutePath}`);
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(absolutePath, 'utf8');
        const json = JSON.parse(content);

        console.log(`\n🔍 Validating: ${path.basename(absolutePath)}...`);
        const result = validateSequence(json);

        if (result.valid) {
            console.log('✅ VALID: Sequence spec is strictly schema-compliant.');
            if (result.warnings.length > 0) {
                console.log('\n⚠️ Warnings:');
                result.warnings.forEach(w => console.log(`  - ${w}`));
            }
        } else {
            console.error('❌ INVALID: Schema validation failed.');
            console.error('\nErrors:');
            result.errors.forEach(e => console.error(`  - ${e}`));
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Error reading or parsing JSON:', err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
}

main();
