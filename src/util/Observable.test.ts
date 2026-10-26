import Observable from './Observable';

test('calls every handler once', async () => {
  const obs = new Observable<string>();
  const h1 = jest.fn();
  const h2 = jest.fn();
  obs.observe(h1);
  obs.observe(h2);

  await obs.notify('message');

  expect(h1).toHaveBeenCalledTimes(1);
  expect(h2).toHaveBeenCalledTimes(1);
});

test('forwards message to observer', async () => {
  const obs = new Observable<string>();
  const h = jest.fn();
  obs.observe(h);

  await obs.notify('message');

  expect(h).toHaveBeenCalledWith('message');
});

test('does not call handler when not notified', async () => {
  const obs = new Observable<string>();
  const h = jest.fn();

  await obs.observe(h);

  expect(h).toHaveBeenCalledTimes(0);
});

test('does not call remaining handlers if one throws', async () => {
  const obs = new Observable<string>();
  const before = jest.fn();
  const after = jest.fn();
  const fail = () => {
    throw new Error();
  };

  obs.observe(before);
  obs.observe(fail);
  obs.observe(after);

  try {
    await obs.notify('message');
  } catch {
    // Ignored
  }

  expect(before).toHaveBeenCalledTimes(1);
  expect(after).toHaveBeenCalledTimes(0);
});
