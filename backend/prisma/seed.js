const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('zorba2024', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@casazorba.com' },
    update: {},
    create: {
      email: 'admin@casazorba.com',
      passwordHash: hash,
      nombre: 'Administrador',
      rol: 'admin',
    },
  });

  console.log('✅ Usuario creado:', user.email);
  console.log('📧 Email: admin@casazorba.com');
  console.log('🔑 Password: zorba2024');
  console.log('⚠️  Cambia el password después del primer login!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
