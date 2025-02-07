/**
 * Required External Modules
 */

import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import https from 'https';
import { punksRouter } from './punks/punks.router';

dotenv.config();

/**
 * App Variables
 */

// if (!process.env.PORT) {
//   process.exit(1);
// }

const PORT: string | number = process.env.PORT || 1337;

const app = express();

/**
 *  App Configuration
 */

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/punks', punksRouter);

const sslKeyPath = process.env.SSL_KEY;
const sslCertPath = process.env.SSL_CERT;

if (sslKeyPath && sslCertPath) {
  // Read the SSL key and certificate files
  const sslOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath)
  };

  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`HTTPS Server is running on port ${PORT}`);
  });
} else {
  // SSL keys not provided, start a regular HTTP server
  app.listen(PORT, () => {
    console.log(`HTTP Server is running on port ${PORT}`);
  });
}
