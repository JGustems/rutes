import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    const { email, password, nom, acceptaTermes } = await req.json();

    // Validacions basiques
    if (!email || !password || !nom) {
      return NextResponse.json(
        { error: "Cal omplir tots els camps" },
        { status: 400 }
      );
    }

    if (!acceptaTermes) {
      return NextResponse.json(
        { error: "Cal acceptar les condicions d'ús per crear un compte" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contrasenya ha de tenir almenys 8 caracters" },
        { status: 400 }
      );
    }

    const existing = await sql`
      select id from users where email = ${email} limit 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Ja existeix un compte amb aquest email" },
        { status: 409 }
      );
    }

    const password_hash = await bcrypt.hash(password, 12);

    await sql`
      insert into users (email, nom, password_hash, genere, rol)
      values (${email}, ${nom}, ${password_hash}, 'no_especificat', 'usuari')
    `;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error en el registre:", error);
    return NextResponse.json(
      { error: "Error intern del servidor" },
      { status: 500 }
    );
  }
}
