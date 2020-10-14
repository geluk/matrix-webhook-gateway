import { Logging as MatrixLogger } from 'matrix-appservice-bridge';

import MatrixBridge from './src/bridge/MatrixBridge';
import Database from './src/repositories/Database';
import WebHookListener from './src/WebHookListener';
import WebHookService from './src/WebHookService';

MatrixLogger.default.configure({
  console: 'error',
  maxFiles: 1,
});

const whs = new WebHookService(
  new MatrixBridge(),
  new Database(),
);
whs.start();
