import * as Express from 'express';
import logger from './util/logger';

export default class WebHookListener {
  app: Express.Express;

  public constructor() {
    this.app = Express.default();

    this.app.get('*', (rq, rs) => {
      logger.debug(`${rq.method} ${rq.url}`);
      logger.debug(rq.body);
      rs.contentType('application/json').send('{}');
    });

    this.app.post('*', (rq, rs) => {
      logger.debug(`${rq.method} ${rq.url}`);
      logger.debug(rq.body);
      rs.contentType('application/json').send('{}');
    });

    this.app.put('*', (rq, rs) => {
      logger.debug(`${rq.method} ${rq.url}`);
      logger.debug(rq.body);
      rs.contentType('application/json').send('{}');
    });
  }

  public start(): void {
    const port = 8020;
    this.app.listen(port, () => {
      logger.info(`Web server running on port ${port}.`);
    });
  }
}
