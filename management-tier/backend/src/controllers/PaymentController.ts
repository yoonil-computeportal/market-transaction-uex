import { Request, Response } from 'express';
import axios from 'axios';

interface PaymentTransaction {
  id: string;
  client_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  target_currency: string;
  payment_method: string;
  settlement_method: string;
  status: 'initiated' | 'processing' | 'settled' | 'failed';
  created_at: string;
  updated_at: string;
  fees?: {
    processing_fee: number;
    currency_conversion_fee: number;
    settlement_fee: number;
    total_fees: number;
  };
}

export class PaymentController {
  private uexBaseUrl = process.env['UEX_BASE_URL'] || 'http://localhost:3001/api';

  async getAllPayments(req: Request, res: Response) {
    try {
      // For now, we'll simulate payment transactions
      // In a real implementation, this would fetch from UEX backend or database
      const mockPayments: PaymentTransaction[] = [
        {
          id: 'txn-001',
          client_id: 'user-1',
          seller_id: 'provider-1',
          amount: 100,
          currency: 'USD',
          target_currency: 'USD',
          payment_method: 'fiat',
          settlement_method: 'bank',
          status: 'initiated',
          created_at: new Date(Date.now() - 60000).toISOString(),
          updated_at: new Date(Date.now() - 60000).toISOString(),
          fees: {
            processing_fee: 2.50,
            currency_conversion_fee: 0,
            settlement_fee: 1.00,
            total_fees: 3.50
          }
        },
        {
          id: 'txn-002',
          client_id: 'user-2',
          seller_id: 'provider-2',
          amount: 250,
          currency: 'EUR',
          target_currency: 'USD',
          payment_method: 'fiat',
          settlement_method: 'bank',
          status: 'processing',
          created_at: new Date(Date.now() - 30000).toISOString(),
          updated_at: new Date(Date.now() - 15000).toISOString(),
          fees: {
            processing_fee: 5.00,
            currency_conversion_fee: 2.50,
            settlement_fee: 1.00,
            total_fees: 8.50
          }
        },
        {
          id: 'txn-003',
          client_id: 'user-3',
          seller_id: 'provider-3',
          amount: 0.5,
          currency: 'BTC',
          target_currency: 'USD',
          payment_method: 'crypto',
          settlement_method: 'blockchain',
          status: 'settled',
          created_at: new Date(Date.now() - 120000).toISOString(),
          updated_at: new Date(Date.now() - 90000).toISOString(),
          fees: {
            processing_fee: 1.00,
            currency_conversion_fee: 0.50,
            settlement_fee: 0.25,
            total_fees: 1.75
          }
        }
      ];

      res.json({
        success: true,
        data: mockPayments,
        count: mockPayments.length
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch payments',
          code: 'FETCH_ERROR'
        }
      });
    }
  }

  async getPaymentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Simulate fetching specific payment
      const mockPayment: PaymentTransaction = {
        id: id || 'unknown',
        client_id: 'user-1',
        seller_id: 'provider-1',
        amount: 100,
        currency: 'USD',
        target_currency: 'USD',
        payment_method: 'fiat',
        settlement_method: 'bank',
        status: 'initiated',
        created_at: new Date(Date.now() - 60000).toISOString(),
        updated_at: new Date(Date.now() - 60000).toISOString(),
        fees: {
          processing_fee: 2.50,
          currency_conversion_fee: 0,
          settlement_fee: 1.00,
          total_fees: 3.50
        }
      };

      res.json({
        success: true,
        data: mockPayment
      });
    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch payment',
          code: 'FETCH_ERROR'
        }
      });
    }
  }

  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Simulate payment status progression
      const statuses: Array<'initiated' | 'processing' | 'settled' | 'failed'> = ['initiated', 'processing', 'settled', 'failed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      res.json({
        success: true,
        data: {
          id,
          status: randomStatus,
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching payment status:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch payment status',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
} 