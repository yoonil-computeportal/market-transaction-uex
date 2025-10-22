const { spawn } = require('child_process');

const port = process.argv[2] || 3900;

console.log(`Starting Vite dev server on port ${port}...`);

const vite = spawn('npx', ['vite', '--port', port, '--host'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

vite.on('error', (error) => {
  console.error(`Failed to start Vite server: ${error.message}`);
  process.exit(1);
});

vite.on('close', (code) => {
  console.log(`Vite server exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\nShutting down Vite server...');
  vite.kill('SIGINT');
});

process.on('SIGTERM', () => {
  vite.kill('SIGTERM');
});
