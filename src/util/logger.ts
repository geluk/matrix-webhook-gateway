import { Logger } from 'tslog';

const logger = new Logger({
  name: 'webhook-srv',
  displayFunctionName: false,
  displayFilePath: 'hidden',
  minLevel: 'trace',
});
export default logger;
