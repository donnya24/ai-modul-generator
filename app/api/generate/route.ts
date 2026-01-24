import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const prompt = `
Anda adalah pengembang perangkat ajar profesional.

Susun MODUL AJAR sesuai Kurikulum Merdeka dan Permendikbudristek No.16 Tahun 2022.

INFORMASI PENDIDIK:
Nama Guru: ${data.namaGuru}
Institusi: ${data.institusi}

INFORMASI AKADEMIK:
Kurikulum: ${data.kurikulum}
Jenjang: ${data.jenjang}
Fase: ${data.fase}
Kelas: ${data.kelas}
Mata Pelajaran: ${data.mapel}

DETAIL PEMBELAJARAN:
Materi Pokok: ${data.materi}
Durasi: ${data.durasi}
Model Pembelajaran: ${data.model}

SKL 2025:
${data.skl.join(", ")}

Gunakan struktur:
A. Informasi Umum
B. Komponen Inti
C. Lampiran
`;

    const result = await geminiModel.generateContent(prompt);

    return NextResponse.json({
      success: true,
      data: result.response.text(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
