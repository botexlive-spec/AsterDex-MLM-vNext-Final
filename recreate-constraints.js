import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function recreateConstraints() {
  const client = new Client({ connectionString });

  try {
    console.log('🔧 Recreating foreign key constraints...\n');
    await client.connect();

    console.log('Fixing orphaned references...');
    await client.query(`UPDATE public.users SET sponsor_id = NULL WHERE sponsor_id IS NOT NULL AND sponsor_id NOT IN (SELECT id FROM public.users)`);
    await client.query(`UPDATE public.users SET placement_id = NULL WHERE placement_id IS NOT NULL AND placement_id NOT IN (SELECT id FROM public.users)`);
    console.log('✅ Orphaned references fixed');

    console.log('\nRecreating self-referential foreign key constraints...');

    // Drop if exists
    await client.query(`ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_sponsor_id_fkey`);
    await client.query(`ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_placement_id_fkey`);

    // Recreate
    await client.query(`
      ALTER TABLE public.users
      ADD CONSTRAINT users_sponsor_id_fkey
      FOREIGN KEY (sponsor_id) REFERENCES public.users(id)
      ON DELETE NO ACTION
    `);

    await client.query(`
      ALTER TABLE public.users
      ADD CONSTRAINT users_placement_id_fkey
      FOREIGN KEY (placement_id) REFERENCES public.users(id)
      ON DELETE NO ACTION
    `);

    console.log('✅ Constraints recreated\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

recreateConstraints();
