import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

const getEnvName = (argv) => {
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (part === '--env' && argv[index + 1]) {
      return argv[index + 1];
    }

    if (part.startsWith('--env=')) {
      return part.slice('--env='.length);
    }
  }

  return 'production';
};

const envName = getEnvName(args);
const migrateScript = envName === 'staging' ? 'migrate:staging' : 'migrate:prod';

const run = (command, commandArgs) => {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.error) {
    throw result.error;
  }
};

run('npm', ['run', migrateScript]);

if (envName === 'staging') {
  run('npm', ['run', 'testbench:ensure:staging']);
}

run('wrangler', ['deploy', ...args]);
