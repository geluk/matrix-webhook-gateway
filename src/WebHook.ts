import * as Express from 'express';
import logger from './util/logger';

export default class WebHook {
  public constructor() {
    const app = Express.default();

    app.get('*', (rq, rs) => {
      logger.debug(`${rq.method} ${rq.url}`);
      logger.trace(rq.body);
      rs.contentType('application/json').send('{}');
    });

    app.post('*', (rq, rs) => {
      logger.debug(`${rq.method} ${rq.url}`);
      logger.trace(rq.body);
      rs.contentType('application/json').send('{}');
    });

    app.put('*', (rq, rs) => {
      logger.debug(`${rq.method} ${rq.url}`);
      logger.trace(rq.body);
      rs.contentType('application/json').send('{}');
    });

    app.listen(8020, () => {
      logger.info('Web server ready.');
    });
  }
}
