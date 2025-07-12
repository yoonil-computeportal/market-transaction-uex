import { ManagementIntegrationService } from './services/ManagementIntegrationService'
import { logger } from './utils/logger'

async function testIntegration() {
  logger.info('Starting integration test between processing and management tiers...')

  try {
    // 1. Test Resource Sync
    logger.info('Testing resource sync...')
    await ManagementIntegrationService.syncResources({
      clusterId: 1,
      cpu: 1500,
      gpu: 75,
      memory: 12000
    })
    logger.info('✅ Resource sync successful')

    // 2. Test Order Update
    logger.info('Testing order update...')
    await ManagementIntegrationService.updateOrder({
      orderId: 'order-test-456',
      userId: 'user-2',
      status: 'processing',
      amount: 45.75
    })
    logger.info('✅ Order update successful')

    // 3. Test Transaction Update
    logger.info('Testing transaction update...')
    await ManagementIntegrationService.updateTransaction({
      transactionId: 'txn-test-456',
      orderId: 'order-test-456',
      userId: 'user-2',
      status: 'completed',
      amount: 45.75,
      fees: 0.46
    })
    logger.info('✅ Transaction update successful')

    // 4. Test Fee Config Fetch
    logger.info('Testing fee config fetch...')
    const feeConfig = await ManagementIntegrationService.fetchFeeConfig()
    logger.info('✅ Fee config fetched:', feeConfig.data)

    // 5. Test Analytics Ingest
    logger.info('Testing analytics ingest...')
    await ManagementIntegrationService.ingestAnalytics({
      eventType: 'resource_allocated',
      eventData: {
        resourceId: 'resource-123',
        userId: 'user-2',
        allocationTime: new Date().toISOString(),
        duration: 3600
      }
    })
    logger.info('✅ Analytics ingest successful')

    // 6. Test Cluster Registration
    logger.info('Testing cluster registration...')
    await ManagementIntegrationService.registerOrUpdateCluster({
      id: 'cluster-processing-1',
      name: 'Processing Cluster 1',
      endpoint: 'http://localhost:8000',
      region: 'us-east-1'
    })
    logger.info('✅ Cluster registration successful')

    // 7. Test Get Clusters
    logger.info('Testing get clusters...')
    const clusters = await ManagementIntegrationService.getClusters()
    logger.info('✅ Clusters fetched:', clusters.data)

    logger.info('🎉 All integration tests completed successfully!')
  } catch (error) {
    logger.error('❌ Integration test failed:', error)
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testIntegration()
}

export { testIntegration } 