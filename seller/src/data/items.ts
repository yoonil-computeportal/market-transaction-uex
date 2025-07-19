import { SellerItem } from '../types';

export const sellerItems: SellerItem[] = [
  {
    id: 'rtx-4090-gpu',
    name: 'NVIDIA RTX 4090 GPU',
    description: 'High-performance gaming and AI computing GPU with 24GB GDDR6X memory. Perfect for deep learning, 3D rendering, and high-end gaming.',
    category: 'GPU',
    price: 1599.99,
    currency: 'USD',
    availability: 15,
    specifications: {
      'Memory': '24GB GDDR6X',
      'CUDA Cores': '16384',
      'Memory Bandwidth': '1008 GB/s',
      'Base Clock': '2235 MHz',
      'Boost Clock': '2520 MHz',
      'Power Consumption': '450W',
      'Interface': 'PCIe 4.0 x16',
      'Display Outputs': '3x DisplayPort 1.4a, 1x HDMI 2.1',
      'Length': '304mm',
      'Width': '137mm',
      'Height': '61mm'
    },
    images: [
      '/images/rtx-4090-front.jpg',
      '/images/rtx-4090-back.jpg',
      '/images/rtx-4090-side.jpg'
    ],
    tags: ['gpu', 'nvidia', 'rtx-4090', 'gaming', 'ai', 'deep-learning', 'rendering'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'rtx-4080-gpu',
    name: 'NVIDIA RTX 4080 GPU',
    description: 'Advanced gaming GPU with 16GB GDDR6X memory. Excellent performance for 4K gaming and content creation.',
    category: 'GPU',
    price: 1199.99,
    currency: 'USD',
    availability: 25,
    specifications: {
      'Memory': '16GB GDDR6X',
      'CUDA Cores': '9728',
      'Memory Bandwidth': '716.8 GB/s',
      'Base Clock': '2205 MHz',
      'Boost Clock': '2505 MHz',
      'Power Consumption': '320W',
      'Interface': 'PCIe 4.0 x16',
      'Display Outputs': '3x DisplayPort 1.4a, 1x HDMI 2.1',
      'Length': '304mm',
      'Width': '137mm',
      'Height': '61mm'
    },
    images: [
      '/images/rtx-4080-front.jpg',
      '/images/rtx-4080-back.jpg'
    ],
    tags: ['gpu', 'nvidia', 'rtx-4080', 'gaming', '4k', 'content-creation'],
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z'
  },
  {
    id: 'rtx-4070-ti-gpu',
    name: 'NVIDIA RTX 4070 Ti GPU',
    description: 'Mid-range gaming GPU with 12GB GDDR6X memory. Great value for 1440p gaming and streaming.',
    category: 'GPU',
    price: 799.99,
    currency: 'USD',
    availability: 40,
    specifications: {
      'Memory': '12GB GDDR6X',
      'CUDA Cores': '7680',
      'Memory Bandwidth': '504.2 GB/s',
      'Base Clock': '2310 MHz',
      'Boost Clock': '2610 MHz',
      'Power Consumption': '285W',
      'Interface': 'PCIe 4.0 x16',
      'Display Outputs': '3x DisplayPort 1.4a, 1x HDMI 2.1',
      'Length': '285mm',
      'Width': '112mm',
      'Height': '40mm'
    },
    images: [
      '/images/rtx-4070ti-front.jpg',
      '/images/rtx-4070ti-back.jpg'
    ],
    tags: ['gpu', 'nvidia', 'rtx-4070ti', 'gaming', '1440p', 'streaming'],
    created_at: '2024-01-05T09:15:00Z',
    updated_at: '2024-01-05T09:15:00Z'
  },
  {
    id: 'high-performance-cpu',
    name: 'Intel Core i9-14900K Processor',
    description: 'High-end desktop processor with 24 cores and 32 threads. Perfect for gaming, content creation, and professional workloads.',
    category: 'CPU',
    price: 589.99,
    currency: 'USD',
    availability: 30,
    specifications: {
      'Cores': '24 (8P + 16E)',
      'Threads': '32',
      'Base Clock': '3.2 GHz (P-core), 2.4 GHz (E-core)',
      'Max Turbo': '6.0 GHz (P-core), 4.4 GHz (E-core)',
      'Cache': '68MB Intel Smart Cache',
      'TDP': '253W',
      'Socket': 'LGA 1700',
      'Memory Support': 'DDR4-3200, DDR5-5600',
      'PCIe Lanes': '20 (16 PCIe 5.0 + 4 PCIe 4.0)',
      'Integrated Graphics': 'Intel UHD Graphics 770'
    },
    images: [
      '/images/i9-14900k-front.jpg',
      '/images/i9-14900k-back.jpg'
    ],
    tags: ['cpu', 'intel', 'core-i9', '14900k', 'gaming', 'workstation'],
    created_at: '2024-01-12T11:45:00Z',
    updated_at: '2024-01-12T11:45:00Z'
  },
  {
    id: 'storage-cluster',
    name: 'Enterprise NVMe Storage Cluster',
    description: 'High-performance enterprise storage solution with 4TB NVMe SSDs in RAID configuration. Ideal for data centers and high-throughput applications.',
    category: 'Storage',
    price: 2499.99,
    currency: 'USD',
    availability: 8,
    specifications: {
      'Capacity': '16TB (4x 4TB NVMe)',
      'RAID Level': 'RAID 10',
      'Read Speed': 'Up to 7000 MB/s',
      'Write Speed': 'Up to 6000 MB/s',
      'Interface': 'PCIe 4.0 x8',
      'Form Factor': '2.5-inch',
      'Endurance': '3.5 DWPD',
      'MTBF': '2,000,000 hours',
      'Power Consumption': '25W idle, 45W active',
      'Operating Temperature': '0°C to 70°C'
    },
    images: [
      '/images/storage-cluster-front.jpg',
      '/images/storage-cluster-back.jpg'
    ],
    tags: ['storage', 'nvme', 'enterprise', 'raid', 'datacenter', 'high-performance'],
    created_at: '2024-01-08T16:20:00Z',
    updated_at: '2024-01-08T16:20:00Z'
  }
];

export const getItemById = (id: string): SellerItem | undefined => {
  return sellerItems.find(item => item.id === id);
};

export const getItemsByCategory = (category: string): SellerItem[] => {
  return sellerItems.filter(item => item.category.toLowerCase() === category.toLowerCase());
};

export const searchItems = (query: string): SellerItem[] => {
  const lowerQuery = query.toLowerCase();
  return sellerItems.filter(item => 
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery) ||
    item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}; 