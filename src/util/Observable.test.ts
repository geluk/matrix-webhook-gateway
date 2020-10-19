import Observable from './Observable';

test('calls every handler once', () => {
  const obs = new Observable<string>();
  const h1 = jest.fn();
  const h2 = jest.fn();
  obs.observe(h1);
  obs.observe(h2);

  obs.notify('message');

  expect(h1).toBeCalledTimes(1);
  expect(h2).toBeCalledTimes(1);
});

test('forwards message to observer', () => {
  const obs = new Observable<string>();
  const h = jest.fn();
  obs.observe(h);

  obs.notify('message');

  expect(h).toBeCalledWith('message');
});

test('does not call handler when not notified', () => {
  const obs = new Observable<string>();
  const h = jest.fn();

  obs.observe(h);

  expect(h).toBeCalledTimes(0);
});

test('does not call remaining handlers if one throws', () => {
  const obs = new Observable<string>();
  const before = jest.fn();
  const after = jest.fn();
  const fail = () => {
    throw new Error();
  };

  obs.observe(before);
  obs.observe(fail);
  obs.observe(after);

  obs.notify('message');

  expect(before).toBeCalledTimes(1);
  expect(after).toBeCalledTimes(0);
});
