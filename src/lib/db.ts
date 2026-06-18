import { neon } from "@neondatabase/serverless";

// ============================================================
// Client de base de dades centralitzat.
// Qualsevol pagina o funcio que necessiti consultar Neon
// importa `sql` des d'aqui, en lloc de repetir la connexio.
//
// Us: const files = await sql`select * from routes`;
// ============================================================

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Falta la variable d'entorn DATABASE_URL. Revisa la configuracio a Vercel (Settings -> Environment Variables)."
  );
}

export const sql = neon(process.env.DATABASE_URL);
