// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { generateTeachingModule } from "@/lib/groq";

interface GenerateRequest {
  judul: string; // New field
  kurikulum: string; // Changed to include K13
  namaGuru: string;
  institusi: string;
  jenjang: string;
  fase: string; // Corrected from faze
  kelas: string;
  mapel: string;
  materi: string;
  tahunPelajaran: string; // New field
  semester: string; // New field
  durasi: string;
  model: string;
  skl: string[];
}

export async function POST(req: Request) {
  console.log("=================================");
  console.log("🚀 API /api/generate DIPANGGIL");

  const startTime = Date.now();

  try {
    // Parse request body
    let data: GenerateRequest;
    try {
      const bodyText = await req.text();
      console.log("📝 Request body:", bodyText.substring(0, 200) + "...");

      const parsed = JSON.parse(bodyText) as Partial<GenerateRequest>;

      // Validate required fields
      if (
        !parsed.judul ||
        !parsed.namaGuru ||
        !parsed.institusi ||
        !parsed.kelas ||
        !parsed.mapel ||
        !parsed.materi
      ) {
        throw new Error("Data tidak lengkap");
      }

      data = parsed as GenerateRequest;
    } catch (parseError: unknown) {
      const errorMessage =
        parseError instanceof Error
          ? parseError.message
          : "Format JSON tidak valid";

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
        },
        { status: 400 },
      );
    }

    // Format duration
    const formatDuration = (durasi: string): string => {
      const durasiNum = parseInt(durasi);
      if (isNaN(durasiNum)) {
        return durasi;
      }
      return `${durasiNum} JP (${durasiNum * 45} menit)`;
    };

    // Create detailed prompt for AI based on curriculum
    const prompt = `
    JUDUL MODUL: ${data.judul}
    
    Buatkan MODUL AJAR ${data.kurikulum} dengan data berikut:
    
    DATA IDENTITAS:
    - Nama Penyusun: ${data.namaGuru}
    - Satuan Pendidikan: ${data.institusi}
    - Tahun Pelajaran: ${data.tahunPelajaran}
    - Semester: ${data.semester}
    - Dasar Hukum: ${data.kurikulum === "Kurikulum Merdeka" ? "Permendikdasmen No. 13 Tahun 2025" : "Permendikbud No. 22 Tahun 2016"}
    
    DATA PEMBELAJARAN:
    - Jenjang: ${data.jenjang}
    ${data.kurikulum === "Kurikulum Merdeka" ? `- Fase: ${data.fase} (GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS)` : ""}
    - Kelas: ${data.kelas}
    - Mata Pelajaran: ${data.mapel}
    - Materi Pokok: ${data.materi}
    - Alokasi Waktu: ${formatDuration(data.durasi)}
    - Model Pembelajaran: ${data.model}
    
    PROFIL PELAJAR PANCASILA:
    ${data.skl.map((item, i) => `${i + 1}. ${item}`).join("\n")}
    
    INSTRUKSI KHUSUS:
    1. Buat modul dalam format teks lengkap dengan SEMUA KOMPONEN DALAM BENTUK TABEL
    2. Gunakan semua data di atas dalam modul
    3. Buat konten yang spesifik untuk materi "${data.materi}"
    4. Output harus langsung siap pakai sebagai modul ajar
    5. ${
      data.kurikulum === "Kurikulum Merdeka"
        ? `Gunakan format: # MODUL AJAR KURIKULUM MERDEKA, lalu ## A. INFORMASI UMUM, ## B. KOMPONEN INTI, ## C. LAMPIRAN
        6. Pastikan semua komponen dalam bentuk tabel markdown
        7. Sertakan semua 18 komponen modul ajar sesuai struktur Kurikulum Merdeka
        8. PADA BAGIAN "Kelas / Fase", gunakan format: ${data.kelas} / ${data.fase} (CONTOH: X / Fase E)
        9. PADA BAGIAN "Fase" di Capaian Pembelajaran, gunakan "${data.fase}" TANPA MENGUBAHNYA
        10. PENTING: FASE YANG DIGUNAKAN ADALAH "${data.fase}" - JANGAN DIUBAH KE FASE LAIN!`
        : `Gunakan format: # MODUL AJAR KURIKULUM 2013, lalu ## A. IDENTITAS, ## B. KOMPETENSI INTI DAN KOMPETENSI DASAR, ## C. KEGIATAN PEMBELAJARAN, ## D. PENILAIAN, ## E. MEDIA DAN SUMBER BELAJAR
        6. Pastikan semua komponen dalam bentuk tabel markdown
        7. Sertakan KI (Kompetensi Inti) dan KD (Kompetensi Dasar) sesuai K13
        8. Format KI: KI-1 (Sikap Spiritual), KI-2 (Sikap Sosial), KI-3 (Pengetahuan), KI-4 (Keterampilan)
        9. Format KD sesuai dengan mata pelajaran dan materi`
    }
    10. GUNAKAN MATERI: "${data.materi}" DI SEMUA BAGIAN YANG RELEVAN
    11. GUNAKAN MATA PELAJARAN: "${data.mapel}" DI SEMUA BAGIAN YANG RELEVAN
    12. JANGAN GUNAKAN TEKS "(GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS)" - GANTI DENGAN "${data.fase}"
    13. JUDUL MODUL HARUS: "${data.judul}" - GANTI [JUDUL MODUL] DENGAN INI
    `;

    console.log(
      "📝 Prompt siap dikirim ke AI dengan kurikulum:",
      data.kurikulum,
    );

    // Generate module with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Timeout: Proses terlalu lama")),
        60000, // Diperpanjang menjadi 60 detik
      );
    });

    const generatePromise = generateTeachingModule(prompt, data.kurikulum);
    const moduleText = await Promise.race([generatePromise, timeoutPromise]);

    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    console.log(`✅ GENERATE BERHASIL (${processingTime.toFixed(2)} detik)`);
    console.log(`📄 Panjang output: ${moduleText.length} karakter`);

    return NextResponse.json({
      success: true,
      data: moduleText,
      metadata: {
        processing_time: `${processingTime.toFixed(2)} detik`,
        model_used: "llama-3.3-70b-versatile", // Update model yang digunakan
        created_at: new Date().toISOString(),
        format: "markdown_with_tables",
        curriculum: data.kurikulum,
      },
    });
  } catch (error: unknown) {
    console.error("❌ ERROR API /generate:", error);

    let errorMessage = "Terjadi kesalahan dalam pembuatan modul";
    let suggestion = "Silakan coba lagi";

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes("Timeout")) {
        errorMessage = "Proses pembuatan modul terlalu lama";
        suggestion = "Silakan coba lagi dengan materi yang lebih spesifik";
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        suggestion: suggestion,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Modul Generator API is running",
    timestamp: new Date().toISOString(),
    format: "markdown_with_tables",
  });
}
