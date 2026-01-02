import { spawn } from 'child_process';

const proc = spawn('pnpm', ['db:push'], {
  cwd: '/home/ubuntu/fitprime-manager',
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

proc.stdout.on('data', (data) => {
  output += data.toString();
  console.log(data.toString());
  
  // Auto-confirm all prompts
  if (data.toString().includes('❯ +') || data.toString().includes('create column')) {
    setTimeout(() => {
      proc.stdin.write('\n');
    }, 100);
  }
});

proc.stderr.on('data', (data) => {
  console.error(data.toString());
});

proc.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
  process.exit(code);
});

// Send initial enter after 2 seconds
setTimeout(() => {
  proc.stdin.write('\n');
}, 2000);
