import { createApp } from './app.js';
import { loadConfig } from './config/env.js';

const config = loadConfig();
const app = createApp(config);

app.listen(config.port, () => {
  // Logger will be used here after the server bootstrap is extracted.
});