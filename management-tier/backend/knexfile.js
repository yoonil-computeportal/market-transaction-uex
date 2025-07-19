const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './management_tier.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds')
    }
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_URL || './management_tier.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds')
    }
  }
}; 