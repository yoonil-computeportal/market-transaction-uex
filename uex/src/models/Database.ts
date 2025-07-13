import knex from 'knex';
import { config } from '../config/database';

export const db = knex(config);

export const TABLES = {
  SELLER_PAYOUT_ACCOUNTS: 'seller_payout_accounts',
  PAYMENT_TRANSACTIONS: 'payment_transactions',
  CURRENCY_CONVERSIONS: 'currency_conversions',
  MANAGEMENT_TIER_FEES: 'management_tier_fees',
  EXCHANGE_RATES: 'exchange_rates',
  WORKFLOW_STEPS: 'workflow_steps'
} as const;

export interface DatabaseConfig {
  client: string;
  connection: {
    filename: string;
  };
  useNullAsDefault: boolean;
  migrations: {
    directory: string;
  };
  seeds: {
    directory: string;
  };
} 