# Cloud Provider B - Seller Dashboard

A comprehensive seller dashboard for Cloud Provider B, showcasing their selling items and transaction history in the ComputePortal marketplace.

## 🚀 Features

### **Selling Items Management**
- **NVIDIA RTX 4090 GPU** - High-performance gaming and AI computing GPU
- **NVIDIA RTX 4080 GPU** - Advanced gaming GPU for 4K gaming
- **NVIDIA RTX 4070 Ti GPU** - Mid-range gaming GPU for 1440p gaming
- **Intel Core i9-14900K Processor** - High-end desktop processor
- **Enterprise NVMe Storage Cluster** - High-performance enterprise storage

### **Transaction Management**
- Real-time transaction tracking
- Status filtering (completed, pending, processing, failed)
- Detailed transaction history with fees breakdown
- Revenue analytics and reporting

### **Analytics Dashboard**
- Total revenue and monthly revenue tracking
- Top selling items analysis
- Sales performance metrics
- Transaction status distribution

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **API**: RESTful API design

## 📁 Project Structure

```
seller/
├── src/
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── data/
│   │   ├── items.ts              # Sample items data
│   │   └── transactions.ts       # Sample transactions data
│   ├── routes/
│   │   ├── items.ts              # Items API routes
│   │   └── transactions.ts       # Transactions API routes
│   └── index.ts                  # Main server file
├── public/
│   ├── dashboard.html            # Main dashboard interface
│   └── images/                   # Product images
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Navigate to the seller directory:**
   ```bash
   cd seller
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the dashboard:**
   - Dashboard: http://localhost:3004/dashboard
   - API Base: http://localhost:3004/api
   - Health Check: http://localhost:3004/health

## 📊 API Endpoints

### Items API
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get item by ID
- `GET /api/items/category/:category` - Get items by category
- `GET /api/items/search/:query` - Search items
- `GET /api/items/categories` - Get all categories

### Transactions API
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `GET /api/transactions/status/:status` - Get transactions by status
- `GET /api/transactions/item/:item_id` - Get transactions by item
- `GET /api/transactions/recent/:limit` - Get recent transactions
- `GET /api/transactions/stats` - Get transaction statistics

## 🎯 Sample Data

### Featured Products

#### **NVIDIA RTX 4090 GPU**
- **Price**: $1,599.99
- **Category**: GPU
- **Specifications**:
  - Memory: 24GB GDDR6X
  - CUDA Cores: 16,384
  - Memory Bandwidth: 1008 GB/s
  - Power Consumption: 450W

#### **Intel Core i9-14900K Processor**
- **Price**: $589.99
- **Category**: CPU
- **Specifications**:
  - Cores: 24 (8P + 16E)
  - Threads: 32
  - Max Turbo: 6.0 GHz
  - TDP: 253W

#### **Enterprise NVMe Storage Cluster**
- **Price**: $2,499.99
- **Category**: Storage
- **Specifications**:
  - Capacity: 16TB (4x 4TB NVMe)
  - RAID Level: RAID 10
  - Read Speed: Up to 7000 MB/s
  - Write Speed: Up to 6000 MB/s

## 📈 Transaction Analytics

The dashboard provides comprehensive analytics including:
- Total revenue tracking
- Monthly revenue analysis
- Top selling items ranking
- Transaction status distribution
- Sales performance metrics

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Interface**: Clean, professional design with Tailwind CSS
- **Interactive Elements**: Hover effects, smooth transitions
- **Real-time Updates**: Live data loading and refresh
- **Status Indicators**: Color-coded transaction status badges

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Environment Variables
- `PORT` - Server port (default: 3004)
- `NODE_ENV` - Environment (development/production)

## 🌐 Integration

This seller dashboard integrates with the ComputePortal marketplace ecosystem:
- **Client-Tier**: Marketplace interface for buyers
- **Processing-Tier**: Transaction processing and order management
- **Management-Tier**: Fee management and analytics
- **UEX Backend**: Payment processing and settlement

## 📝 License

MIT License - see LICENSE file for details

## 👥 Support

For support and questions, please contact the development team or refer to the main ComputePortal documentation. 