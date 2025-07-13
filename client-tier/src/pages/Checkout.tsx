import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UEXPaymentForm from '../components/UEXPaymentForm';
import { resourceApi } from '../services/api';
import { Resource } from '../types';

const Checkout: React.FC = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resourceId) return;
    setLoading(true);
    resourceApi.getById(resourceId)
      .then((res) => {
        setResource(res);
        setLoading(false);
      })
      .catch(() => {
        setError('Resource not found');
        setLoading(false);
      });
  }, [resourceId]);

  if (loading) {
    return <div className="flex justify-center items-center py-12">Loading...</div>;
  }
  if (error || !resource) {
    return <div className="text-center text-red-600 py-12">{error || 'Resource not found'}</div>;
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Checkout: {resource.name}</h1>
      <UEXPaymentForm
        onPaymentSuccess={() => navigate('/orders')}
        onPaymentError={() => {}}
        initialValues={{
          client_id: 'user-1', // You may want to get this from auth context
          seller_id: resource.provider || '',
          amount: resource.price,
          currency: resource.currency || 'USD',
          target_currency: resource.currency || 'USD',
          payment_method: 'fiat',
          settlement_method: 'bank',
          resourceId: resource.id,
          resourceName: resource.name,
        }}
      />
    </div>
  );
};

export default Checkout; 