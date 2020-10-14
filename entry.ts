import MatrixBridge from './src/bridge/MatrixBridge';
import Database from './src/repositories/Database';
import WebHook from './src/WebHook';
import WebHookService from './src/WebHookService';


const whs = new WebHookService(
  new MatrixBridge(),
  new Database(),
);
whs.start();

const webHook = new WebHook();
webHook.start();
