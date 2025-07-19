// API Base URL
const API_BASE = '/api';

// Tab functionality
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active', 'border-blue-500', 'text-blue-600');
            b.classList.add('border-transparent', 'text-gray-500');
        });
        btn.classList.add('active', 'border-blue-500', 'text-blue-600');
        btn.classList.remove('border-transparent', 'text-gray-500');
        
        // Show tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        
        // Load tab data
        if (tabName === 'items') loadItems();
        else if (tabName === 'transactions') loadTransactions();
        else if (tabName === 'analytics') loadAnalytics();
    });
});

// Load dashboard data
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/transactions/stats`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalItems').textContent = data.data.total_items;
            document.getElementById('completedSales').textContent = data.data.completed_transactions;
            document.getElementById('totalRevenue').textContent = `$${data.data.total_revenue.toLocaleString()}`;
            document.getElementById('monthlyRevenue').textContent = `$${data.data.monthly_revenue.toLocaleString()}`;
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load items
async function loadItems() {
    try {
        const response = await fetch(`${API_BASE}/items`);
        const data = await response.json();
        
        if (data.success) {
            const itemsGrid = document.getElementById('itemsGrid');
            itemsGrid.innerHTML = '';
            
            data.data.forEach(item => {
                const itemCard = createItemCard(item);
                itemsGrid.appendChild(itemCard);
            });
        }
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

// Create item card
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden card-hover';
    card.innerHTML = `
        <div class="p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">${item.name}</h3>
                <span class="text-sm text-gray-500">${item.category}</span>
            </div>
            <p class="text-gray-600 text-sm mb-4">${item.description}</p>
            <div class="flex justify-between items-center">
                <span class="text-2xl font-bold text-gray-900">$${item.price.toLocaleString()}</span>
                <span class="text-sm text-gray-500">${item.availability} in stock</span>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
                ${item.tags.slice(0, 3).map(tag => `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${tag}</span>`).join('')}
            </div>
        </div>
    `;
    return card;
}

// Load transactions
async function loadTransactions() {
    try {
        const response = await fetch(`${API_BASE}/transactions`);
        const data = await response.json();
        
        if (data.success) {
            const tableBody = document.getElementById('transactionsTable');
            tableBody.innerHTML = '';
            
            data.data.forEach(txn => {
                const row = createTransactionRow(txn);
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Create transaction row
function createTransactionRow(txn) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${txn.id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${txn.item_name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${txn.total_amount.toLocaleString()}</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="status-badge status-${txn.status}">${txn.status}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(txn.created_at).toLocaleDateString()}</td>
    `;
    return row;
}

// Load analytics
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/transactions/stats`);
        const data = await response.json();
        
        if (data.success) {
            // Load top selling items
            const topItemsContainer = document.getElementById('topSellingItems');
            topItemsContainer.innerHTML = '';
            
            data.data.top_selling_items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'flex justify-between items-center py-3 border-b border-gray-200';
                itemDiv.innerHTML = `
                    <div>
                        <p class="font-medium text-gray-900">${item.item_name}</p>
                        <p class="text-sm text-gray-500">${item.sales_count} sales</p>
                    </div>
                    <p class="font-semibold text-gray-900">$${item.revenue.toLocaleString()}</p>
                `;
                topItemsContainer.appendChild(itemDiv);
            });
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    loadItems();
}); 