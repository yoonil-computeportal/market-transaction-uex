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

  private mapUexStatusToPaymentStatus(uexStatus: string): 'initiated' | 'processing' | 'settled' | 'failed' {
    switch (uexStatus) {
      case 'pending':
        return 'initiated';
      case 'processing':
        return 'processing';
      case 'completed':
        return 'settled';
      case 'failed':
      case 'cancelled':
        return 'failed';
      default:
        return 'initiated';
    }
  }

  async getAllPayments(req: Request, res: Response) {
    try {
      // Fetch real transaction data from UEX backend
      const uexResponse = await axios.get(`${this.uexBaseUrl}/payments/transactions`);
      
      if (!uexResponse.data || !uexResponse.data.success || !Array.isArray(uexResponse.data.data)) {
        throw new Error('Invalid response from UEX backend');
      }

      // Map UEX transaction data to PaymentTransaction format
      const payments: PaymentTransaction[] = uexResponse.data.data.map((txn: any) => ({
        id: txn.id,
        client_id: txn.client_id,
        seller_id: txn.seller_id,
        amount: parseFloat(txn.amount), // Use base amount (without fees) for display
        currency: txn.currency,
        target_currency: txn.target_currency,
        payment_method: txn.payment_method,
        settlement_method: txn.settlement_method,
        status: this.mapUexStatusToPaymentStatus(txn.status),
        created_at: txn.created_at,
        updated_at: txn.updated_at,
        fees: {
          processing_fee: parseFloat(txn.management_fee || 0),
          currency_conversion_fee: parseFloat(txn.conversion_fee || 0),
          settlement_fee: 0, // UEX doesn't have separate settlement fee
          total_fees: parseFloat(txn.management_fee || 0) + parseFloat(txn.conversion_fee || 0)
        }
      }));

      return res.json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error) {
      console.error('Error fetching payments from UEX:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch payments from UEX backend',
          code: 'FETCH_ERROR'
        }
      });
    }
  }

  async getPaymentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Fetch all transactions from UEX backend and find the specific one
      const uexResponse = await axios.get(`${this.uexBaseUrl}/payments/transactions`);
      
      if (!uexResponse.data || !uexResponse.data.success || !Array.isArray(uexResponse.data.data)) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Invalid response from UEX backend',
            code: 'FETCH_ERROR'
          }
        });
      }

      const txn = uexResponse.data.data.find((t: any) => t.id === id);
      
      if (!txn) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Payment not found',
            code: 'NOT_FOUND'
          }
        });
      }

      const payment: PaymentTransaction = {
        id: txn.id,
        client_id: txn.client_id,
        seller_id: txn.seller_id,
        amount: parseFloat(txn.amount), // Use base amount (without fees) for display
        currency: txn.currency,
        target_currency: txn.target_currency,
        payment_method: txn.payment_method,
        settlement_method: txn.settlement_method,
        status: this.mapUexStatusToPaymentStatus(txn.status),
        created_at: txn.created_at,
        updated_at: txn.updated_at,
        fees: {
          processing_fee: parseFloat(txn.management_fee || 0),
          currency_conversion_fee: parseFloat(txn.conversion_fee || 0),
          settlement_fee: 0,
          total_fees: parseFloat(txn.management_fee || 0) + parseFloat(txn.conversion_fee || 0)
        }
      };

      return res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Error fetching payment from UEX:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch payment from UEX backend',
          code: 'FETCH_ERROR'
        }
      });
    }
  }

  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Fetch payment status from UEX backend
      const uexResponse = await axios.get(`${this.uexBaseUrl}/payments/transaction/${id}/status`);
      
      if (!uexResponse.data || !uexResponse.data.success || !uexResponse.data.data) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Payment not found',
            code: 'NOT_FOUND'
          }
        });
      }

      const txn = uexResponse.data.data;
      const mappedStatus = this.mapUexStatusToPaymentStatus(txn.status);

      return res.json({
        success: true,
        data: {
          id,
          status: mappedStatus,
          updated_at: txn.updated_at
        }
      });
    } catch (error) {
      console.error('Error fetching payment status from UEX:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch payment status from UEX backend',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
} 