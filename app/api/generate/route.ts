import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mapel, kelas, materi, model, profil } = body;

    const prompt = `
Anda adalah pengembang perangkat ajar profesional.

Susun MODUL AJAR KURIKULUM MERDEKA
sesuai Permendikbudristek No. 16 Tahun 2022.

Gunakan struktur:
A. INFORMASI UMUM
B. KOMPONEN INTI
C. LAMPIRAN

=== DATA MODUL ===
Mata Pelajaran: ${mapel}
Fase/Kelas: ${kelas}
Materi Pokok: ${materi}
Model Pembelajaran: ${model}
Profil Pelajar Pancasila: ${profil}

Gunakan bahasa Indonesia formal dan siap digunakan guru.
`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ success: true, data: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Gagal generate modul" },
      { status: 500 },
    );
  }
}
