exports.up = function(knex) {
  return knex.schema.createTable('workflow_steps', function(table) {
    table.string('id').primary();
    table.uuid('transaction_id').references('id').inTable('payment_transactions').onDelete('CASCADE');
    table.string('step_name').notNullable();
    table.enum('status', ['pending', 'in_progress', 'completed', 'failed']).defaultTo('pending');
    table.json('input_data');
    table.json('output_data');
    table.text('error_message');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamps(true, true);
    
    table.index(['transaction_id']);
    table.index(['step_name']);
    table.index(['status']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('workflow_steps');
}; 