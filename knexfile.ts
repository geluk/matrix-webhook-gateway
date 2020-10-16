// Update with your config settings.

module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: 'webhook-db.sqlite',
    },
    useNullAsDefault: true,
  },
};
