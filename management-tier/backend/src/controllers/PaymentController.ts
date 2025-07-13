import { Request, Response } from 'express';
import axios from 'axios';
import { DatabaseService } from '../services/DatabaseService';

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
  private db = new DatabaseService();

  async getAllPayments(req: Request, res: Response) {
    try {
      // 실제 DB에서 트랜잭션 조회
      const result = await this.db.query('SELECT * FROM transactions ORDER BY updated_at DESC LIMIT 100');
      const rows = result.rows || [];
      // DB row를 PaymentTransaction 형태로 매핑
      const payments: PaymentTransaction[] = rows.map((row: any) => ({
        id: row.transaction_id,
        client_id: row.user_id,
        seller_id: row.seller_id || '',
        amount: row.amount,
        currency: row.currency || 'USD',
        target_currency: row.target_currency || row.currency || 'USD',
        payment_method: row.payment_method || 'fiat',
        settlement_method: row.settlement_method || 'bank',
        status: row.status,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : '',
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : '',
        fees: row.fees ? (typeof row.fees === 'object' ? row.fees : JSON.parse(row.fees)) : undefined,
      }));
      res.json({
        success: true,
        data: payments,
        count: payments.length
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