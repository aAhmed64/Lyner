import { createLynerApiApp } from '../src/server/lynerApiRouter.js';

export const config = {
  maxDuration: 60,
};

const app = createLynerApiApp();

export default app;
