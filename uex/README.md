# UEX Backend - Multi-Currency Payment Processing

A comprehensive backend service for processing multi-currency payments with support for fiat-to-fiat, fiat-to-crypto, and crypto-to-fiat conversions, including blockchain and bank settlement emulation.

## Features

- **Multi-Currency Support**: USD, EUR, GBP, BTC, ETH
- **Payment Methods**: Fiat and Crypto payments
- **Settlement Methods**: Bank transfers and Blockchain settlements
- **Currency Conversion**: Real-time exchange rates with fee calculation
- **Transaction Management**: Complete transaction lifecycle tracking
- **Fee Structure**: Configurable conversion and management fees
- **Workflow Orchestration**: Step-by-step payment processing
- **Analytics**: Transaction statistics and reporting
- **Security**: Rate limiting, CORS, and input validation

## Architecture

The UEX backend supports four main currency conversion scenarios:

1. **Fiat-to-Fiat (Same Currency)**: Direct bank transfers
2. **Fiat-to-Fiat (Different Currency)**: Cross-currency bank transfers
3. **Fiat-to-Crypto**: Bank to blockchain settlements
4. **Crypto-to-Fiat**: Blockchain to bank settlements

## Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite3 (included)

## Installation

1. **Clone and navigate to the UEX directory**:
   ```bash
   cd uex
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**:
   ```bash
   npm run migrate
   # or
   yarn migrate
   ```

5. **Build the project**:
   ```bash
   npm run build
   # or
   yarn build
   ```

## Running the Application

### Development Mode
```bash
npm run dev
# or
yarn dev
```

### Production Mode
```bash
npm start
# or
yarn start
```

The server will start on `http://localhost:3001` by default.

## API Endpoints

### Payment Processing
- `POST /api/payments/process` - Process a new payment transaction
- `GET /api/payments/transaction/:id/status` - Get transaction status
- `PUT /api/payments/transaction/:id/status` - Update transaction status
- `GET /api/payments/transaction/:id/fees` - Get transaction fees
- `GET /api/payments/transaction/:id/conversions` - Get currency conversions

### Health & Documentation
- `GET /api/payments/health` - Health check
- `GET /api/payments` - API documentation
- `GET /` - Root endpoint with service info

## Example Usage

### Process a Payment

```bash
curl -X POST http://localhost:3001/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client123",
    "seller_id": "seller456",
    "amount": 100.00,
    "currency": "USD",
    "target_currency": "EUR",
    "payment_method": "fiat",
    "settlement_method": "bank"
  }'
```

### Get Transaction Status

```bash
curl http://localhost:3001/api/payments/transaction/{transaction_id}/status
```

### Update Transaction Status

```bash
curl -X PUT http://localhost:3001/api/payments/transaction/{transaction_id}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "metadata": {
      "transaction_hash": "0x123...",
      "bank_reference": "REF123456"
    }
  }'
```

## Database Schema

The application uses SQLite with the following main tables:

- `payment_transactions` - Main transaction records
- `currency_conversions` - Currency conversion details
- `management_tier_fees` - Fee breakdowns
- `exchange_rates` - Exchange rate history
- `seller_payout_accounts` - Seller account information
- `workflow_steps` - Processing step tracking

## Configuration

### Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL=./dev.sqlite3

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Fee Structure

The default fee structure is:
- Conversion Fee: 2% (min $1, max $50)
- Management Fee: 1% (min $0.50, max $25)

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run migrate:rollback` - Rollback migrations
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Project Structure

```
uex/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # HTTP request handlers
│   ├── database/        # Database migrations and seeds
│   ├── models/          # Database models
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Application entry point
├── package.json
├── tsconfig.json
├── knexfile.js
└── README.md
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up proper CORS origins
4. Configure rate limiting
5. Set up monitoring and logging

## Monitoring

The application includes:
- Request logging with Morgan
- Error tracking and reporting
- Health check endpoints
- Transaction analytics
- Performance metrics

## Security

- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration
- Helmet.js security headers
- SQL injection prevention with Knex
- Error message sanitization in production

## Support

For issues and questions:
1. Check the API documentation at `/api/payments`
2. Review the health check at `/api/payments/health`
3. Check the logs for detailed error information

## License

MIT License - see LICENSE file for details. 