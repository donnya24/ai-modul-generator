// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { generateTeachingModule } from "@/lib/groq";

interface GenerateRequest {
  // Step 1: Informasi Dasar
  namaGuru: string;
  institusi: string;

  // Step 1: Informasi Akademik
  kurikulum: string; // Kurikulum Merdeka atau Kurikulum Berbasis Cinta
  jenjang: string;
  mapel: string;
  tahunAjaran: string;
  fase: string;
  kelas: string;
  semester: string;

  // Step 2: Detail Inti Pembelajaran
  materi: string;
  jumlahPertemuan: string;
  alokasiWaktu: string;
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
        !parsed.namaGuru ||
        !parsed.institusi ||
        !parsed.mapel ||
        !parsed.kelas ||
        !parsed.materi ||
        !parsed.jumlahPertemuan ||
        !parsed.alokasiWaktu
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

    // Calculate total duration
    const pertemuanNum = parseInt(data.jumlahPertemuan) || 2;
    const waktuPerPertemuan = parseInt(data.alokasiWaktu) || 90;
    const totalWaktu = pertemuanNum * waktuPerPertemuan;

    // Create detailed prompt for AI based on curriculum
    const prompt = `
    Buatkan MODUL AJAR ${data.kurikulum} dengan data berikut:
    
    DATA IDENTITAS:
    - Nama Penyusun: ${data.namaGuru}
    - Institusi: ${data.institusi}
    - Tahun Ajaran: ${data.tahunAjaran}
    - Semester: ${data.semester}
    - Dasar Hukum: Sesuai kebijakan ${data.kurikulum} yang berlaku
    
    DATA PEMBELAJARAN:
    - Jenjang: ${data.jenjang}
    ${data.kurikulum === "Kurikulum Merdeka" ? `- Fase: ${data.fase}` : ""}
    - Kelas: ${data.kelas}
    - Mata Pelajaran: ${data.mapel}
    - Materi Pokok: ${data.materi}
    - Alokasi Waktu: ${pertemuanNum} pertemuan (total ${totalWaktu} menit)
    - Model Pembelajaran: ${data.model}
    - Jumlah Pertemuan: ${pertemuanNum} (HARUS SESUAI DENGAN INI)
    
    DIMENSI PROFIL LULUSAN:
    ${data.skl.map((item, i) => `${i + 1}. ${item}`).join("\n")}
    
    INSTRUKSI KHUSUS:
    1. Buat modul dalam format teks lengkap dengan struktur yang sesuai dengan kurikulum ${data.kurikulum}
    2. Gunakan semua data di atas dalam modul
    3. Buat konten yang spesifik untuk materi "${data.materi}"
    4. Output harus langsung siap pakai sebagai modul ajar
    5. ${
      data.kurikulum === "Kurikulum Merdeka"
        ? `Gunakan format Kurikulum Merdeka dengan struktur lengkap (A-J)`
        : `Gunakan format Kurikulum Berbasis Kompetensi/K13 dengan struktur lengkap (A-H)`
    }
    6. PADA BAGIAN "Kelas", gunakan format: ${data.kelas}
    7. ${
      data.kurikulum === "Kurikulum Merdeka"
        ? `PADA BAGIAN "Fase", gunakan "${data.fase}" TANPA MENGUBAHNYA`
        : `Kurikulum Berbasis Kompetensi tidak menggunakan fase`
    }
    8. JUMLAH PERTEMUAN HARUS SESUAI: ${pertemuanNum} PERTEMUAN
    9. ALOKASI WAKTU HARUS: ${pertemuanNum} pertemuan (total ${totalWaktu} menit)
    10. GUNAKAN MATERI: "${data.materi}" DI SEMUA BAGIAN YANG RELEVAN
    11. GUNAKAN MATA PELAJARAN: "${data.mapel}" DI SEMUA BAGIAN YANG RELEVAN
    12. ${
      data.jenjang === "SMK"
        ? "UNTUK SMK: Sertakan bagian Keselamatan Kerja (K3) dalam LKPD dan praktikum yang detail"
        : ""
    }
    13. Format output harus persis seperti contoh yang diberikan, dengan:
       - Judul di tengah atas: "MODUL AJAR ${data.mapel}"
       - Subjudul dengan tanda kutip: "${data.materi}"
       - Struktur lengkap sesuai kurikulum
       - SEMUA BAGIAN DALAM FORMAT TABEL KECUALI LKPD
       - LKPD tanpa tabel tetap tersusun rapi
       - Daftar pustaka dan glosarium dalam bentuk tabel
    14. Untuk model pembelajaran "${data.model}", tambahkan komponen khusus sesuai dengan metode tersebut:
       ${
         data.model === "Project Based Learning"
           ? `- Produk akhir
- Timeline proyek
- Penilaian proses & produk
- Presentasi
- Deskripsi Proyek
- Tahapan Proyek
- Rubrik Proyek`
           : data.model === "Problem Based Learning"
             ? `- Skenario masalah nyata
- Pertanyaan pemantik
- Analisis masalah
- Solusi & refleksi
- Skenario Masalah
- Hipotesis Solusi
- Evaluasi Solusi`
             : data.model === "Cooperative Learning"
               ? `- Pembagian kelompok
- Peran anggota
- Penilaian individu & kelompok
- Struktur Kelompok
- Peran Peserta Didik`
               : data.model === "Blended Learning"
                 ? `- Aktivitas luring & daring
- Platform digital
- Sinkron & asinkron
- Aktivitas Daring
- Aktivitas Luring`
                 : data.model === "Discovery Learning"
                   ? `- Stimulasi
- Identifikasi masalah
- Pengumpulan data
- Verifikasi
- Generalisasi
- Tahapan Discovery`
                   : data.model === "Inquiry Learning"
                     ? `- Perumusan masalah
- Hipotesis
- Eksperimen
- Kesimpulan
- Pertanyaan Inkuiri
- Proses Penyelidikan`
                     : data.model === "Contextual Teaching and Learning (CTL)"
                       ? `- Keterkaitan dunia nyata
- Refleksi pengalaman
- Learning community
- Konteks Nyata
- Refleksi Kontekstual`
                       : data.model === "Differentiated Learning"
                         ? `- Pemetaan kebutuhan murid
- Diferensiasi konten, proses, produk
- Strategi Diferensiasi
- Penyesuaian Asesmen`
                         : ""
       }
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
        model_used: "llama-3.3-70b-versatile",
        created_at: new Date().toISOString(),
        format: "structured_text",
        curriculum: data.kurikulum,
        meetings: pertemuanNum,
        total_duration: `${pertemuanNum} pertemuan (total ${totalWaktu} menit)`,
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

      if (error.message.includes("Invalid API Key")) {
        errorMessage = "Kunci API tidak valid. Silakan hubungi administrator.";
        suggestion = "Periksa konfigurasi kunci API Groq.";
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
    format: "structured_text",
  });
}