/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('resources', function(table) {
    table.integer('utilization').defaultTo(0);
    table.integer('total_capacity').defaultTo(0);
    table.integer('allocated_capacity').defaultTo(0);
    table.text('data'); // For storing JSON data
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('resources', function(table) {
    table.dropColumn('utilization');
    table.dropColumn('total_capacity');
    table.dropColumn('allocated_capacity');
    table.dropColumn('data');
  });
}; 