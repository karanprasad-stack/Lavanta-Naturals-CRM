import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedScripts = [
  'seed.ts',
  'seedTasks.ts',
  'seedAnnouncements.ts',
  'seedCalendar.ts',
  'seedChat.ts',
  'seedActivity.ts',
  'seedGoals.ts',
  'seedDocuments.ts',
  'seedProducts.ts',
  'seedSalesAndExpenses.ts'
];

async function runScript(scriptName: string): Promise<void> {
  console.log(`\n======================================================`);
  console.log(`[SeedAll] Running ${scriptName}...`);
  console.log(`======================================================`);

  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';
    const relScriptPath = `src/scripts/${scriptName}`;
    const child = spawn(npxCmd, ['tsx', `"${relScriptPath}"`], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
      shell: true,
      env: { ...process.env }
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[SeedAll] Finished ${scriptName} successfully.`);
        resolve();
      } else {
        reject(new Error(`Script ${scriptName} exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('🌿 Starting Lavanta Naturals Master Database Seeding...');
  const startTime = Date.now();

  for (const script of seedScripts) {
    try {
      await runScript(script);
    } catch (err) {
      console.error(`❌ [SeedAll] Error during ${script}:`, err);
      process.exit(1);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n======================================================`);
  console.log(` ALL SEED SCRIPTS COMPLETED IN ${duration}s`);
  console.log(` Database is fully populated with comprehensive dummy data.`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
