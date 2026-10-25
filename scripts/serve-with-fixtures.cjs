// Builds and serves the site with GENERIC_LMS_FIXTURES=1, so signed-in pages can be viewed without the real sign-in cookie:
// set a cookie named dydBearer with the value "fixture" in the browser. Never use this for anything but local review.
const { spawn } = require('child_process');
const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'serve'], { cwd: require('path').join(__dirname, '..'), stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, GENERIC_LMS_FIXTURES: '1' } });
child.on('exit', code => process.exit(code ?? 0));
