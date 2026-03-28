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

if (envName === 'staging') {
  run('wrangler', ['d1', 'migrations', 'apply', 'AUTH_DB', '--remote', '--env', 'staging']);
} else {
  run('wrangler', ['d1', 'migrations', 'apply', 'AUTH_DB', '--remote']);
}

if (envName === 'staging') {
  run('node', ['./test/ensure-test-bench.mjs', '--env', 'staging']);
}

run('wrangler', ['deploy', ...args]);
