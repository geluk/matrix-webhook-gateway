// Update with your config settings.

module.exports = {

  development: {
    client: "sqlite3",
    connection: {
      filename: "appservice-db.sqlite"
    },
    useNullAsDefault: true,
  },
};
