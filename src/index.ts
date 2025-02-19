import {Gateway} from './gateway.js';

const gateway = await Gateway.load();

process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());
process.on('SIGHUP', () => process.exit());
process.on('exit', async () => await gateway.stop());

await gateway.start();
