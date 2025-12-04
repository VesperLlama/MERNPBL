/**
 * RUN: node scripts/test-utils.js
 * This script exercises jsonDb getNextId and atomicUpdate functions.
 */

const path = require('path');
const { readJson, writeJson, atomicUpdate, getNextId, dataDir } = require('../src/utils/jsonDb');

async function run() {
  console.log('Data dir:', dataDir);

  // Ensure meta.json exists
  const meta = readJson('meta.json');
  console.log('Meta before:', meta);

  const newCustomerId = await getNextId('customerId');
  console.log('Generated customerId:', newCustomerId);

  // atomicUpdate customers.json: add a dummy
  await atomicUpdate('customers.json', async (customers) => {
    if (!Array.isArray(customers)) customers = [];
    customers.push({
      CustomerId: newCustomerId,
      FullName: 'Test User',
      EmailId: `test${newCustomerId}@example.com`
    });
    return customers;
  });

  const customers = readJson('customers.json');
  console.log('Last customer entry:', customers[customers.length - 1]);
}

run().catch(err => {
  console.error('Test utils failed:', err);
  process.exit(1);
});
