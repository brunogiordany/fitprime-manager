import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', '0046_soft_madripoor.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by statement breakpoint
    const statements = migrationContent.split('--> statement-breakpoint');
    
    console.log(`Found ${statements.length} statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await connection.query(stmt);
        console.log(`  ✓ Success`);
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`  ⚠ Table already exists, skipping`);
        } else if (err.code === 'ER_DUP_KEYNAME') {
          console.log(`  ⚠ Constraint already exists, skipping`);
        } else {
          console.error(`  ✗ Error: ${err.message}`);
        }
      }
    }
    
    // Insert migration record
    const hash = '0046_soft_madripoor';
    const now = Date.now();
    try {
      await connection.query(
        'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
        [hash, now]
      );
      console.log('Migration record inserted');
    } catch (err) {
      console.log('Migration record may already exist');
    }
    
    console.log('\nMigration completed!');
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
