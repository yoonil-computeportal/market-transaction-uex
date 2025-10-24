  Base URL: /api/payments

  | #   | Endpoint                                | Method | Purpose                                               |
  |-----|-----------------------------------------|--------|-------------------------------------------------------|
  | 1   | /                                       | GET    | API documentation and service information             |
  | 2   | /process                                | POST   | Process a new payment transaction                     |
  | 3   | /transactions                           | GET    | Get all transactions                                  |
  | 4   | /transaction/:transactionId/status      | GET    | Get transaction status by ID                          |
  | 5   | /transaction/:transactionId/status      | PUT    | Update transaction status                             |
  | 6   | /transaction/:transactionId/fees        | GET    | Get transaction fees breakdown                        |
  | 7   | /transaction/:transactionId/conversions | GET    | Get currency conversion details                       |
  | 8   | /notify-completed                       | POST   | Trigger batch notification for completed transactions |
  | 9   | /health                                 | GET    | Service health check                                  |