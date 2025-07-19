/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('resource_changes', function(table) {
    table.increments('id').primary();
    table.string('resource_id').notNullable();
    table.string('change_type').notNullable();
    table.boolean('synced').defaultTo(false);
    table.datetime('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('resource_changes');
}; 