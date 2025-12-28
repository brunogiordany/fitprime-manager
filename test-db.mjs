import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, isNull, asc } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
console.log("DATABASE_URL:", DATABASE_URL ? "SET" : "NOT SET");

try {
  const db = drizzle(DATABASE_URL);
  console.log("Database connection created");
  
  // Test simple query
  const result = await db.execute("SELECT 1 as test");
  console.log("Simple query result:", result);
  
  process.exit(0);
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
