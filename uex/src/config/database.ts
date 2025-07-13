import dotenv from 'dotenv';

dotenv.config();

export const config = {
  client: 'sqlite3',
  connection: {
    filename: process.env['DATABASE_URL'] || './dev.sqlite3'
  },
  useNullAsDefault: true,
  migrations: {
    directory: './src/database/migrations'
  },
  seeds: {
    directory: './src/database/seeds'
  }
}; 