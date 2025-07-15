const axios = require('axios');

const UEX_BASE_URL = 'http://localhost:3001/api/payments';

async function simulateTransactionProcessing() {
  try {
    console.log('🔄 Starting transaction processing simulation...');
    
    // Step 1: Get all pending transactions
    const response = await axios.get(`${UEX_BASE_URL}/transactions`);
    const transactions = response.data.data.filter(tx => tx.status === 'pending');
    
    console.log(`📊 Found ${transactions.length} pending transactions`);
    
    if (transactions.length === 0) {
      console.log('✅ No pending transactions to process');
      return;
    }
    
    // Step 2: Process each transaction
    for (let i = 0; i < Math.min(3, transactions.length); i++) {
      const transaction = transactions[i];
      console.log(`\n🔄 Processing transaction ${transaction.id}...`);
      
      // Step 2a: Update to processing
      console.log('  📝 Updating status to "processing"...');
      await axios.put(`${UEX_BASE_URL}/transaction/${transaction.id}/status`, {
        status: 'processing',
        metadata: {
          processed_at: new Date().toISOString(),
          processor: 'simulation-script'
        }
      });
      
      // Step 2b: Simulate processing time
      console.log('  ⏳ Simulating processing time...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2c: Update to completed
      console.log('  ✅ Updating status to "completed"...');
      await axios.put(`${UEX_BASE_URL}/transaction/${transaction.id}/status`, {
        status: 'completed',
        metadata: {
          completed_at: new Date().toISOString(),
          processor: 'simulation-script',
          settlement_reference: `SETTLE-${Date.now()}`,
          transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`
        }
      });
      
      console.log(`  🎉 Transaction ${transaction.id} completed successfully!`);
    }
    
    console.log('\n✅ Transaction processing simulation completed!');
    console.log('📊 Check the UEX Dashboard to see the updated transaction statuses');
    
  } catch (error) {
    console.error('❌ Error during transaction processing simulation:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the simulation
simulateTransactionProcessing(); 