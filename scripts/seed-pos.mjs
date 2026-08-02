import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const employees = [
  { name: 'Owner', role: 'OWNER', pin: process.env.SEED_OWNER_PIN || '1111' },
  { name: 'Manager', role: 'MANAGER', pin: process.env.SEED_MANAGER_PIN || '2222' },
  { name: 'Employee', role: 'EMPLOYEE', pin: process.env.SEED_EMPLOYEE_PIN || '3333' },
];

const quickButtons = [
  ['One used tire', 'tire', 6500, 1],
  ['Two used tires', 'tire', 6000, 2],
  ['Set of four used tires', 'tire', 24000, 1],
  ['One new tire', 'tire', 13500, 1],
  ['Set of four new tires', 'tire', 52000, 1],
  ['Mount and balance', 'service', 8000, 1],
  ['Tire repair', 'service', 2500, 1],
  ['Tire rotation', 'service', 3500, 1],
  ['Disposal fee', 'fee', 1600, 1],
  ['Valve stem', 'fee', 800, 1],
  ['Wheel installation', 'service', 2000, 1],
];

const inventory = [
  { tireSize: '215/65R17', brand: 'Mixed', model: 'All-season', condition: 'USED', quantityInStock: 3, sellingPriceCents: 24000, storageLocation: 'Rack A' },
  { tireSize: '225/60R17', brand: 'Goodyear', model: 'Assurance', condition: 'NEW', quantityInStock: 6, sellingPriceCents: 13500, storageLocation: 'Rack B' },
  { tireSize: '235/65R18', brand: 'Michelin', model: 'Defender', condition: 'USED', quantityInStock: 2, sellingPriceCents: 16000, storageLocation: 'Rack C' },
];

async function main() {
  for (const employee of employees) {
    const existing = await prisma.employee.findFirst({ where: { name: employee.name } });
    const pinHash = await bcrypt.hash(employee.pin, 12);
    if (existing) {
      await prisma.employee.update({ where: { id: existing.id }, data: { role: employee.role, pinHash, active: true } });
    } else {
      await prisma.employee.create({ data: { name: employee.name, role: employee.role, pinHash } });
    }
  }

  await prisma.quickSaleButton.deleteMany({});
  for (const [index, button] of quickButtons.entries()) {
    const [label, lineType, unitCents, quantity] = button;
    await prisma.quickSaleButton.create({
      data: { label, lineType, unitCents, quantity, sortOrder: index, enabled: true },
    });
  }

  for (const item of inventory) {
    const existing = await prisma.tireInventory.findFirst({
      where: { tireSize: item.tireSize, brand: item.brand, condition: item.condition },
    });
    if (existing) {
      await prisma.tireInventory.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.tireInventory.create({ data: item });
    }
  }

  await prisma.shopSetting.upsert({
    where: { key: 'taxRateBasisPoints' },
    create: { key: 'taxRateBasisPoints', value: 725 },
    update: { value: 725 },
  });
  await prisma.shopSetting.upsert({
    where: { key: 'receiptPrefix' },
    create: { key: 'receiptPrefix', value: 'ATS' },
    update: { value: 'ATS' },
  });
  await prisma.shopSetting.upsert({
    where: { key: 'warrantyLanguage' },
    create: { key: 'warrantyLanguage', value: 'Used tires sold as-is unless otherwise written on receipt.' },
    update: { value: 'Used tires sold as-is unless otherwise written on receipt.' },
  });

  console.log('Akron Tire Shop POS seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
