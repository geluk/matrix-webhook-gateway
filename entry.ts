import MatrixBridge from './src/bridge/MatrixBridge';
import Database from './src/repositories/Database';
import WebHookListener from './src/WebHookListener';
import WebHookService from './src/WebHookService';


const whs = new WebHookService(
  new MatrixBridge(),
  new Database(),
);
whs.start();

const webHook = new WebHookListener();
webHook.start();
