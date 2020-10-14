import Express = require('express');

export default class WebHook {
  public constructor() {
    const app = Express();

    app.get('*', (rq, rs) => {
      console.log(`${rq.method} ${rq.url}`);
      console.log(rq.body);
      rs.contentType('application/json').send('{}');
    });

    app.post('*', (rq, rs) => {
      console.log(`${rq.method} ${rq.url}`);
      console.log(rq.body);
      rs.contentType('application/json').send('{}');
    });

    app.put('*', (rq, rs) => {
      console.log(`${rq.method} ${rq.url}`);
      console.log(rq.body);
      rs.contentType('application/json').send('{}');
    });

    app.listen(8020, () => {
      console.log('Web server ready.');
    });
  }
}
