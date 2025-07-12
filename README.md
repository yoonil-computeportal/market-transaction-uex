# ComputePortal Marketplace Transaction Engine

A comprehensive decentralized compute marketplace implementing a 3-tier Kubernetes-native architecture with real-time fee management and transaction processing.

## Architecture Overview

The Marketplace Transaction Engine follows a 3-tier architecture pattern:

```
CLIENT TIER (Frontend for Processing Tier Features)
├── Marketplace Web Interface
├── Resource Discovery Portal
├── Transaction Management Dashboard
├── Order Management System
└── Payment Center

PROCESSING TIER (Backend for Processing Tier Features)
├── Resource Registry Agents
├── Transaction Processing Pods
├── Payment Gateway Integrations
├── Resource Provisioning Controllers
└── Local Transaction Caching

MANAGEMENT TIER (Frontend + Backend for Management Features)
├── Marketplace Orchestration Service
├── Billing & Fee Management Engine
├── Multi-cluster Resource Coordination
├── Settlement & Compliance Service
└── Analytics & Reporting System
```

## Features Implemented

### Client Tier (Frontend for Processing Tier Features)

#### ✅ Resource Discovery and Search (FR-CT-001, FR-CT-002, FR-CT-003)
- **Advanced Resource Search**: Filter by resource type, price range, location, SLA tier
- **Real-time Resource Availability**: Updates every 30 seconds with live pricing
- **Resource Comparison Tool**: Side-by-side comparison of up to 5 resources

#### ✅ Transaction Management Dashboard (FR-CT-004, FR-CT-005, FR-CT-006)
- **Order Creation Workflow**: Single and bulk resource ordering with validation
- **Transaction History and Tracking**: Complete transaction management with real-time updates
- **Payment Integration**: Support for multiple payment methods (credit card, bank transfer, crypto)

### Processing Tier (Backend for Processing Tier Features)

#### ✅ Resource Registry Agents (FR-PT-001, FR-PT-002, FR-PT-003)
- **Local Resource Inventory**: Continuous monitoring of local resource availability
- **Resource Registry Synchronization**: Sync with central registry every 30 seconds
- **Resource Advertising**: Publish resources to marketplace with dynamic pricing

#### ✅ Transaction Processing Pods (FR-PT-004, FR-PT-005, FR-PT-006)
- **Order Processing Engine**: Handle order validation, matching, and state management
- **Resource Allocation Controller**: Manage resource allocation and provisioning
- **Transaction Fee Processing**: Calculate and apply fees based on current structure

#### ✅ Payment Gateway Integrations (FR-PT-007, FR-PT-008, FR-PT-009)
- **Payment Gateway Abstraction**: Support for multiple gateways (Stripe, PayPal, Square)
- **Payment Processing Pipeline**: Secure payment authorization and settlement
- **Cryptocurrency Support**: Integration with crypto payment processors

### Management Tier (Frontend + Backend for Management Features)

#### ✅ Marketplace Orchestration Service (FR-MT-001, FR-MT-002, FR-MT-003)
- **Cluster Coordination**: Manage global resource registry and cross-cluster transactions
- **Global State Management**: Maintain consistent global marketplace state
- **Marketplace Analytics Engine**: Comprehensive analytics and reporting

#### ✅ Billing & Fee Management Engine (FR-MT-004, FR-MT-005, FR-MT-006)
- **Fee Structure Management**: Centralized fee configuration with approval workflows
- **Billing Processing Engine**: Automated billing and invoice generation
- **Financial Settlement**: Process payouts to resource providers

#### ✅ Admin Fee Management Console (FR-CT-007, FR-CT-008, FR-CT-009)
- **Dynamic Fee Configuration**: Real-time fee adjustment with slider controls
- **Fee Analytics Dashboard**: Revenue metrics and optimization recommendations
- **Fee Tier Management**: Volume-based fee tier configuration

## Technology Stack

### Frontend Technologies
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Router** for navigation
- **Socket.io Client** for real-time updates
- **Recharts** for data visualization

### Backend Technologies
- **Node.js** with TypeScript
- **Express.js** for API framework
- **PostgreSQL** for primary database
- **Redis** for caching and sessions
- **Socket.io** for real-time communication
- **Stripe** for payment processing
- **Winston** for logging
- **Joi** for validation

### Infrastructure
- **Kubernetes** for container orchestration
- **Docker** for containerization
- **Helm** for Kubernetes deployments

## Project Structure

```
MarketPlaceTransactionEngine/
├── client-tier/                    # Frontend for Processing Tier Features
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Main application pages
│   │   ├── services/              # API service layer
│   │   ├── types/                 # TypeScript type definitions
│   │   └── utils/                 # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── processing-tier/               # Backend for Processing Tier Features
│   ├── src/
│   │   ├── services/              # Core business logic services
│   │   ├── routes/                # API route handlers
│   │   ├── middleware/            # Express middleware
│   │   ├── utils/                 # Utility functions
│   │   └── types/                 # TypeScript type definitions
│   ├── package.json
│   └── tsconfig.json
├── management-tier/               # Frontend + Backend for Management Features
│   ├── frontend/                  # Management dashboard frontend
│   │   ├── src/
│   │   │   ├── pages/             # Management pages
│   │   │   ├── components/        # Management UI components
│   │   │   └── services/          # Management API services
│   │   └── package.json
│   └── backend/                   # Management tier backend
│       ├── src/
│       │   ├── services/          # Management services
│       │   ├── routes/            # Management API routes
│       │   └── utils/             # Management utilities
│       ├── package.json
│       └── tsconfig.json
└── specifications.txt             # Detailed development specifications
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Docker and Kubernetes (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MarketPlaceTransactionEngine
   ```

2. **Install dependencies for all tiers**
   ```bash
   # Client Tier
   cd client-tier
   npm install
   
   # Processing Tier
   cd ../processing-tier
   npm install
   
   # Management Tier
   cd ../management-tier/frontend
   npm install
   cd ../backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env files for each tier
   cp .env.example .env
   ```

4. **Start the development servers**
   ```bash
   # Client Tier (Port 3000)
   cd client-tier
   npm run dev
   
   # Processing Tier (Port 8000)
   cd ../processing-tier
   npm run dev
   
   # Management Tier Backend (Port 9000)
   cd ../management-tier/backend
   npm run dev
   
   # Management Tier Frontend (Port 3001)
   cd ../frontend
   npm run dev
   ```

## API Endpoints

### Processing Tier API (Port 8000)
- `GET /api/resources/search` - Search for resources
- `GET /api/resources/:id` - Get resource details
- `POST /api/orders` - Create new order
- `GET /api/transactions/user` - Get user transactions
- `POST /api/payments/process` - Process payment

### Management Tier API (Port 9000)
- `GET /api/fees/current` - Get current fee structure
- `POST /api/fees/update` - Update fee structure
- `GET /api/analytics/revenue` - Get revenue analytics
- `POST /api/settlement/process` - Process settlements

## Fee Structure

The marketplace implements a dynamic fee structure with:
- **Buyer Fee**: 0.1% - 5.0% (default: 0.5%)
- **Seller Fee**: 0.1% - 5.0% (default: 0.5%)
- **Total Platform Fee**: 0.2% - 10.0% (default: 1.0%)

Fees can be adjusted in real-time through the management dashboard.

## Testing

Run tests for each tier:

```bash
# Client Tier
cd client-tier
npm test

# Processing Tier
cd ../processing-tier
npm test

# Management Tier
cd ../management-tier/backend
npm test
```

## Deployment

### Docker Deployment
```bash
# Build images
docker build -t marketplace-client ./client-tier
docker build -t marketplace-processing ./processing-tier
docker build -t marketplace-management ./management-tier/backend

# Run containers
docker-compose up -d
```

### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## Monitoring and Analytics

The system includes comprehensive monitoring:
- **Real-time Analytics**: Live dashboard with transaction metrics
- **Fee Performance**: Revenue tracking and optimization insights
- **Cluster Health**: Multi-cluster monitoring and failover
- **Transaction Tracking**: Complete audit trail for all transactions

## Security Features

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Payment Security**: PCI DSS compliant payment processing
- **Data Encryption**: End-to-end encryption for sensitive data
- **Audit Logging**: Comprehensive audit trails

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository. 