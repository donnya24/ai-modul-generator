// lib/groq.ts
import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("❌ GROQ_API_KEY tidak ditemukan");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateTeachingModule(
  prompt: string,
  kurikulum: string = "Kurikulum Merdeka",
): Promise<string> {
  try {
    // Gunakan model yang masih didukung
    console.log("🤖 Menggunakan model: llama-3.3-70b-versatile");
    console.log("📚 Kurikulum:", kurikulum);

    // Extract data from prompt for replacement
    const extractData = (text: string) => {
      // Extract judul
      const judulMatch = text.match(/Materi Pokok:\s*([^\n]+)/i);
      const judul = judulMatch ? judulMatch[1].trim() : "Judul Modul";

      // Extract fase
      const faseMatch = text.match(/Fase:\s*([^\n]+)/i);
      let fase = faseMatch ? faseMatch[1].trim() : "Fase D";

      // Extract kelas
      const kelasMatch = text.match(/Kelas:\s*([^\n]+)/i);
      const kelas = kelasMatch ? kelasMatch[1].trim() : "Kelas";

      // Extract materi
      const materiMatch = text.match(/Materi Pokok:\s*([^\n]+)/i);
      const materi = materiMatch ? materiMatch[1].trim() : "Materi Pokok";

      // Extract mapel
      const mapelMatch = text.match(/Mata Pelajaran:\s*([^\n]+)/i);
      const mapel = mapelMatch ? mapelMatch[1].trim() : "Mata Pelajaran";

      // Extract jenjang
      const jenjangMatch = text.match(/Jenjang:\s*([^\n]+)/i);
      const jenjang = jenjangMatch ? jenjangMatch[1].trim() : "SMP";

      // Extract jumlah pertemuan
      const pertemuanMatch = text.match(/Jumlah Pertemuan:\s*([^\n]+)/i);
      const jumlahPertemuan = pertemuanMatch ? pertemuanMatch[1].trim() : "2";

      // Extract alokasi waktu
      const alokasiWaktuMatch = text.match(/Alokasi Waktu:\s*([^\n]+)/i);
      const alokasiWaktu = alokasiWaktuMatch
        ? alokasiWaktuMatch[1].trim()
        : "2 pertemuan (total 180 menit)";

      // Extract model pembelajaran
      const modelMatch = text.match(/Model Pembelajaran:\s*([^\n]+)/i);
      const model = modelMatch
        ? modelMatch[1].trim()
        : "Problem Based Learning";

      // Extract nama guru
      const namaGuruMatch = text.match(/Nama Penyusun:\s*([^\n]+)/i);
      const namaGuru = namaGuruMatch ? namaGuruMatch[1].trim() : "Guru";

      // Extract institusi
      const institusiMatch = text.match(/Institusi:\s*([^\n]+)/i);
      const institusi = institusiMatch
        ? institusiMatch[1].trim()
        : "Satuan Pendidikan";

      // Extract tahun ajaran
      const tahunAjaranMatch = text.match(/Tahun Ajaran:\s*([^\n]+)/i);
      const tahunAjaran = tahunAjaranMatch
        ? tahunAjaranMatch[1].trim()
        : "2025/2026";

      // Extract semester
      const semesterMatch = text.match(/Semester:\s*([^\n]+)/i);
      const semester = semesterMatch ? semesterMatch[1].trim() : "Ganjil";

      // Extract Profil Pelajar Pancasila
      const sklMatch = text.match(
        /DIMENSI PROFIL LULUSAN:\s*\n([\s\S]*?)(?=\n\n|\n#|$)/i,
      );
      let skl: string[] = [];
      if (sklMatch) {
        const sklText = sklMatch[1];
        // Extract only the actual SKL items, not the instructions
        const sklItems = sklText.match(/^\d+\.\s*[^\n]+$/gm);
        if (sklItems) {
          skl = sklItems.map((item) => item.replace(/^\d+\.\s*/, "").trim());
        }
      }

      return {
        judul,
        fase,
        kelas,
        materi,
        mapel,
        jenjang,
        jumlahPertemuan,
        alokasiWaktu,
        model,
        namaGuru,
        institusi,
        tahunAjaran,
        semester,
        skl,
      };
    };

    const data = extractData(prompt);
    console.log("📊 Extracted data:", data);

    // Calculate total duration
    const pertemuanNum = parseInt(data.jumlahPertemuan) || 2;
    const waktuPerPertemuan =
      parseInt(data.alokasiWaktu.match(/(\d+)/)?.[1] || "90") || 90;
    const totalWaktu = pertemuanNum * waktuPerPertemuan;

    // Create a more explicit prompt with direct replacements
    const directPrompt = prompt
      .replace(/\[JUDUL MODUL\]/g, data.materi)
      .replace(/\[fase\]/g, data.fase)
      .replace(/\[kelas\]/g, data.kelas)
      .replace(/\[materi\]/g, data.materi)
      .replace(/\[mapel\]/g, data.mapel)
      .replace(/\[jenjang\]/g, data.jenjang)
      .replace(/\[jumlahPertemuan\]/g, data.jumlahPertemuan)
      .replace(/\[alokasiWaktu\]/g, data.alokasiWaktu)
      .replace(/\[model\]/g, data.model)
      .replace(/\[namaGuru\]/g, data.namaGuru)
      .replace(/\[institusi\]/g, data.institusi)
      .replace(/\[tahunAjaran\]/g, data.tahunAjaran)
      .replace(/\[semester\]/g, data.semester);

    const systemPrompt =
      kurikulum === "Kurikulum Merdeka"
        ? `Anda adalah ahli kurikulum pendidikan Indonesia. 
    Buatkan MODUL AJAR KURIKULUM MERDEKA dengan struktur lengkap sesuai peraturan di Indonesia.
    
    DATA PENTING YANG HARUS DIGUNAKAN:
    - JUDUL MODUL: "${data.materi}" (GUNAKAN INI SEBAGAI JUDUL UTAMA)
    - FASE: "${data.fase}" (GUNAKAN INI DI SEMUA TEMPAT YANG MEMERLUKAN FASE)
    - KELAS: "${data.kelas}" (GUNAKAN INI DI SEMUA TEMPAT YANG MEMERLUKAN KELAS)
    - MATERI: "${data.materi}" (GUNAKAN INI DI SEMUA BAGIAN YANG RELEVAN)
    - MATA PELAJARAN: "${data.mapel}" (GUNAKAN INI DI SEMUA BAGIAN YANG RELEVAN)
    - JENJANG: "${data.jenjang}" (GUNAKAN INI DI SEMUA BAGIAN YANG RELEVAN)
    - JUMLAH PERTEMUAN: ${data.jumlahPertemuan} (HARUS SESUAI DENGAN INI)
    - ALOKASI WAKTU: ${data.alokasiWaktu} (GUNAKAN INI, BUKAN DURASI AWAL)
    
    FORMAT OUTPUT HARUS SEPERTI INI (SEMUA BAGIAN DALAM TABEL KECUALI LKPD):
    
    MODUL AJAR ${data.mapel}
    "${data.materi}"
    
    A. Informasi Umum
    
    | Komponen | Keterangan |
    |----------|------------|
    | Satuan Pendidikan | ${data.institusi} |
    | Mata Pelajaran | ${data.mapel} |
    | Jenjang / Kelas / Fase | ${data.jenjang} / ${data.kelas} / ${data.fase} |
    | Semester / Tahun Pelajaran | ${data.semester} / ${data.tahunAjaran} |
    | Kurikulum | Kurikulum Merdeka |
    | Alokasi Waktu | ${data.jumlahPertemuan} pertemuan × ${waktuPerPertemuan} menit (total ${totalWaktu} menit) |
    | Model / Metode Pembelajaran | ${data.model} |
    | Karakteristik Peserta Didik | [Deskripsi karakteristik peserta didik sesuai jenjang dan fase] |
    | Dasar Hukum | Sesuai kebijakan Kurikulum Merdeka yang berlaku |
    
    B. Capaian Pembelajaran
    
    Capaian Pembelajaran (CP)
    [CP sesuai dengan fase dan mata pelajaran]
    
    Tujuan Pembelajaran (TP)
    | No | Tujuan Pembelajaran |
    |----|---------------------|
    | 1 | [TP 1] |
    | 2 | [TP 2] |
    | 3 | [TP 3] |
    | 4 | [TP 4] |
    | 5 | [TP 5] |
    
    Pemetaan TP ke Pertemuan
    | TP | Pertemuan 1 | Pertemuan 2 | ${pertemuanNum > 2 ? "Pertemuan 3" : ""} ${pertemuanNum > 3 ? "Pertemuan 4" : ""} ${pertemuanNum > 4 ? "Pertemuan 5" : ""} ${pertemuanNum > 5 ? "Pertemuan 6" : ""} ${pertemuanNum > 6 ? "Pertemuan 7" : ""} ${pertemuanNum > 7 ? "Pertemuan 8" : ""} |
    |----|-------------|-------------|-------------|-------------|-------------|-------------|-------------|-------------|
    | TP 1 | ✓ | | | | | | | |
    | TP 2 | ✓ | | | | | | | |
    | TP 3 | | ✓ | | | | | | |
    | TP 4 | | ✓ | | | | | | |
    | TP 5 | | | ✓ | | | | | |
    
    C. Profil Pelajar Pancasila
    
    Dimensi yang dikembangkan
    | No | Dimensi Profil Pelajar Pancasila |
    |----|--------------------------------|
    ${data.skl.map((skl, i) => `| ${i + 1} | ${skl} |`).join("\n    ")}
    
    Elemen & Sub-elemen
    | Elemen | Sub-elemen | Keterangan |
    |--------|-------------|------------|
    | [Elemen 1] | [Sub-elemen 1.1] | [Keterangan] |
    | [Elemen 1] | [Sub-elemen 1.2] | [Keterangan] |
    | [Elemen 2] | [Sub-elemen 2.1] | [Keterangan] |
    
    Keterkaitan dengan pembelajaran
    | Aspek | Keterkaitan |
    |-------|-------------|
    | Dimensi | [Deskripsi keterkaitan Profil Pelajar Pancasila dengan pembelajaran ${data.materi}] |
    | Implementasi | [Cara mengimplementasikan dimensi dalam pembelajaran] |
    
    D. Materi Pembelajaran
    
    Materi Pokok
    | Komponen | Keterangan |
    |----------|------------|
    | Materi | ${data.materi} |
    | Deskripsi | [Deskripsi materi pokok] |
    
    Materi Fakta
    | No | Fakta | Deskripsi |
    |----|-------|----------|
    | 1 | [Fakta 1] | [Deskripsi fakta 1] |
    | 2 | [Fakta 2] | [Deskripsi fakta 2] |
    | 3 | [Fakta 3] | [Deskripsi fakta 3] |
    
    Materi Konsep
    | No | Konsep | Deskripsi |
    |----|--------|----------|
    | 1 | [Konsep 1] | [Deskripsi konsep 1] |
    | 2 | [Konsep 2] | [Deskripsi konsep 2] |
    | 3 | [Konsep 3] | [Deskripsi konsep 3] |
    
    Materi Prosedural
    | No | Prosedur | Deskripsi |
    |----|----------|----------|
    | 1 | [Prosedur 1] | [Deskripsi prosedur 1] |
    | 2 | [Prosedur 2] | [Deskripsi prosedur 2] |
    | 3 | [Prosedur 3] | [Deskripsi prosedur 3] |
    
    E. Rencana Pembelajaran per Pertemuan
    
    ${Array.from({ length: pertemuanNum }, (_, i) => {
      // Distribute TP across meetings
      let tpFocus: any[] = [];
      if (i === 0)
        tpFocus = [1, 2]; // First meeting
      else if (i === 1)
        tpFocus = [2, 3]; // Second meeting
      else if (i === 2)
        tpFocus = [3, 4]; // Third meeting
      else if (i === 3)
        tpFocus = [4, 5]; // Fourth meeting
      else if (i === 4)
        tpFocus = [5]; // Fifth meeting if exists
      else if (i === 5)
        tpFocus = [5]; // Sixth meeting if exists
      else if (i === 6)
        tpFocus = [5]; // Seventh meeting if exists
      else if (i === 7) tpFocus = [5]; // Eighth meeting if exists

      // Add model-specific components
      let modelSpecificContent = "";
      if (data.model === "Project Based Learning") {
        modelSpecificContent = `
        
        Deskripsi Proyek
        | Komponen | Keterangan |
        |----------|------------|
        | Judul Proyek | [Judul proyek ${data.materi}] |
        | Deskripsi | [Deskripsi proyek ${data.materi}] |
        | Tujuan | [Tujuan proyek] |
        
        Tahapan Proyek
        | Tahap | Kegiatan | Waktu | Output |
        |-------|----------|-------|--------|
        | 1 | [Tahap 1] | [Waktu] | [Output 1] |
        | 2 | [Tahap 2] | [Waktu] | [Output 2] |
        | 3 | [Tahap 3] | [Waktu] | [Output 3] |
        `;
        if (i === pertemuanNum - 1) {
          modelSpecificContent += `
        
        Presentasi
        | Komponen | Keterangan |
        |----------|------------|
        | Format | [Format presentasi] |
        | Durasi | [Durasi presentasi] |
        | Penilaian | [Kriteria penilaian] |
        
        Rubrik Proyek
        | Aspek | Kriteria | Bobot |
        |-------|----------|-------|
        | Perencanaan | [Kriteria perencanaan] | 20% |
        | Proses | [Kriteria proses] | 40% |
        | Produk | [Kriteria produk] | 30% |
        | Presentasi | [Kriteria presentasi] | 10% |
        `;
        }
      } else if (data.model === "Problem Based Learning") {
        modelSpecificContent = `
        
        Skenario Masalah
        | Komponen | Keterangan |
        |----------|------------|
        | Masalah | [Skenario masalah nyata terkait ${data.materi}] |
        | Konteks | [Konteks masalah] |
        | Tantangan | [Tantangan yang dihadapi] |
        
        Hipotesis Solusi
        | No | Hipotesis | Alasan |
        |----|-----------|--------|
        | 1 | [Hipotesis 1] | [Alasan 1] |
        | 2 | [Hipotesis 2] | [Alasan 2] |
        `;
        if (i === Math.floor(pertemuanNum / 2)) {
          modelSpecificContent += `
        
        Evaluasi Solusi
        | Kriteria | Penilaian | Skor |
        |----------|-----------|-------|
        | [Kriteria 1] | [Penilaian 1] | [Skor] |
        | [Kriteria 2] | [Penilaian 2] | [Skor] |
        `;
        }
      } else if (data.model === "Cooperative Learning") {
        modelSpecificContent = `
        
        Struktur Kelompok
        | Komponen | Keterangan |
        |----------|------------|
        | Jumlah Anggota | [Jumlah anggota per kelompok] |
        | Metode Pengelompokan | [Metode pembentukan kelompok] |
        | Peran | [Distribusi peran dalam kelompok] |
        
        Peran Peserta Didik
        | Peran | Tanggung Jawab | Kriteria |
        |------|----------------|----------|
        | [Peran 1] | [Tanggung jawab 1] | [Kriteria 1] |
        | [Peran 2] | [Tanggung jawab 2] | [Kriteria 2] |
        `;
      } else if (data.model === "Blended Learning") {
        modelSpecificContent = `
        
        ${
          i % 2 === 0
            ? `
        Aktivitas Daring
        | Kegiatan | Platform | Waktu | Tujuan |
        |----------|----------|-------|--------|
        | [Kegiatan 1] | [Platform 1] | [Waktu] | [Tujuan 1] |
        | [Kegiatan 2] | [Platform 2] | [Waktu] | [Tujuan 2] |
        `
            : `
        Aktivitas Luring
        | Kegiatan | Metode | Waktu | Tujuan |
        |----------|---------|-------|--------|
        | [Kegiatan 1] | [Metode 1] | [Waktu] | [Tujuan 1] |
        | [Kegiatan 2] | [Metode 2] | [Waktu] | [Tujuan 2] |
        `
        }
        `;
      } else if (data.model === "Discovery Learning") {
        modelSpecificContent = `
        
        Tahapan Discovery
        | Tahap | Kegiatan | Waktu | Tujuan |
        |-------|----------|-------|--------|
        | Stimulasi | [Deskripsi stimulasi] | [Waktu] | [Tujuan] |
        | Identifikasi masalah | [Deskripsi identifikasi masalah] | [Waktu] | [Tujuan] |
        | Pengumpulan data | [Deskripsi pengumpulan data] | [Waktu] | [Tujuan] |
        | Verifikasi | [Deskripsi verifikasi] | [Waktu] | [Tujuan] |
        | Generalisasi | [Deskripsi generalisasi] | [Waktu] | [Tujuan] |
        `;
      } else if (data.model === "Inquiry Learning") {
        modelSpecificContent = `
        
        Pertanyaan Inkuiri
        | No | Pertanyaan | Jenis | Tujuan |
        |----|------------|-------|--------|
        | 1 | [Pertanyaan 1] | [Jenis 1] | [Tujuan 1] |
        | 2 | [Pertanyaan 2] | [Jenis 2] | [Tujuan 2] |
        
        Proses Penyelidikan
        | Tahap | Kegiatan | Metode | Output |
        |-------|----------|--------|--------|
        | 1 | [Kegiatan 1] | [Metode 1] | [Output 1] |
        | 2 | [Kegiatan 2] | [Metode 2] | [Output 2] |
        `;
      } else if (data.model === "Contextual Teaching and Learning (CTL)") {
        modelSpecificContent = `
        
        Konteks Nyata
        | Konteks | Relevansi | Implementasi |
        |---------|-----------|--------------|
        | [Konteks 1] | [Relevansi 1] | [Implementasi 1] |
        | [Konteks 2] | [Relevansi 2] | [Implementasi 2] |
        
        Refleksi Kontekstual
        | Aspek | Pertanyaan | Tujuan |
        |-------|------------|--------|
        | Pengalaman | [Pertanyaan 1] | [Tujuan 1] |
        | Aplikasi | [Pertanyaan 2] | [Tujuan 2] |
        `;
      } else if (data.model === "Differentiated Learning") {
        modelSpecificContent = `
        
        Strategi Diferensiasi
        | Aspek | Strategi | Implementasi |
        |-------|----------|--------------|
        | Konten | [Strategi konten] | [Implementasi konten] |
        | Proses | [Strategi proses] | [Implementasi proses] |
        | Produk | [Strategi produk] | [Implementasi produk] |
        
        Penyesuaian Asesmen
        | Jenis | Penyesuaian | Alat |
        |-------|-------------|------|
        | [Jenis 1] | [Penyesuaian 1] | [Alat 1] |
        | [Jenis 2] | [Penyesuaian 2] | [Alat 2] |
        `;
      }

      return `
    Pertemuan ke-${i + 1} (${waktuPerPertemuan} menit)
    
    Tujuan Pembelajaran
    | No | Tujuan Pembelajaran |
    |----|---------------------|
    ${tpFocus.map((tp) => `| ${tp} | [TP ${tp} untuk pertemuan ${i + 1}] |`).join("\n    ")}
    
    Pemantik / Apersepsi
    | Kegiatan | Waktu | Metode |
    |----------|-------|--------|
    | [Pemantik/aperspsi untuk pertemuan ${i + 1}] | [Waktu] | [Metode] |
    
    Kegiatan Inti
    | No | Kegiatan | Waktu | Metode |
    |----|----------|-------|--------|
    | 1 | [Kegiatan inti 1 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] |
    | 2 | [Kegiatan inti 2 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] |
    | 3 | [Kegiatan inti 3 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] |
    ${modelSpecificContent}
    
    Kegiatan Penutup
    | Kegiatan | Waktu | Metode |
    |----------|-------|--------|
    | [Kegiatan penutup untuk pertemuan ${i + 1}] | [Waktu] | [Metode] |
    
    Asesmen Pertemuan
    | Jenis | Instrumen | Waktu | Kriteria |
    |-------|-----------|-------|----------|
    | [Jenis asesmen] | [Instrumen] | [Waktu] | [Kriteria] |
    `;
    }).join("")}
    
    F. Lembar Kerja Peserta Didik (LKPD)
    
    Judul LKPD
    ${data.materi}
    
    Petunjuk Belajar
    1. Bacalah dengan teliti petunjuk setiap kegiatan
    2. Kerjakan secara mandiri atau dalam kelompok sesuai instruksi
    3. Gunakan alat dan bahan yang tersedia dengan baik
    4. Tanyakan kepada guru jika ada yang tidak kamu pahami
    
    Tujuan Pembelajaran
    1. [Tujuan pembelajaran 1]
    2. [Tujuan pembelajaran 2]
    3. [Tujuan pembelajaran 3]
    
    Materi Singkat
    ${data.materi} adalah [deskripsi singkat ${data.materi}]. Konsep ini penting karena [alasan pentingnya ${data.materi}].
    
    Aktivitas / Langkah Kerja
    1. [Langkah kerja 1]
    2. [Langkah kerja 2]
    3. [Langkah kerja 3]
    4. [Langkah kerja 4]
    5. [Langkah kerja 5]
    
    ${
      data.jenjang === "SMK"
        ? `
    Job Sheet
    
    Alat dan Bahan
    1. [Alat/Bahan 1]: [Jumlah]
    2. [Alat/Bahan 2]: [Jumlah]
    3. [Alat/Bahan 3]: [Jumlah]
    
    Langkah Kerja Sistematis
    1. [Langkah kerja 1]
    2. [Langkah kerja 2]
    3. [Langkah kerja 3]
    4. [Langkah kerja 4]
    5. [Langkah kerja 5]
    
    Keselamatan Kerja (K3)
    1. [Aspek keselamatan 1]: [Keterangan]
    2. [Aspek keselamatan 2]: [Keterangan]
    3. [Aspek keselamatan 3]: [Keterangan]
    `
        : ""
    }
    
    Tugas / Soal / Studi Kasus
    1. [Tugas/Soal/Studi Kasus 1]
    2. [Tugas/Soal/Studi Kasus 2]
    3. [Tugas/Soal/Studi Kasus 3]
    
    Komponen Penilaian
    1. Sikap: [Kriteria penilaian sikap]
    2. Pengetahuan: [Kriteria penilaian pengetahuan]
    3. Keterampilan: [Kriteria penilaian keterampilan]
    
    G. Asesmen Pembelajaran
    
    Asesmen Diagnostik
    | Komponen | Instrumen | Tujuan |
    |----------|-----------|--------|
    | [Komponen 1] | [Instrumen 1] | [Tujuan 1] |
    | [Komponen 2] | [Instrumen 2] | [Tujuan 2] |
    
    Asesmen Formatif
    | Jenis | Teknik | Instrumen | Waktu |
    |-------|--------|-----------|-------|
    | [Jenis 1] | [Teknik 1] | [Instrumen 1] | [Waktu] |
    | [Jenis 2] | [Teknik 2] | [Instrumen 2] | [Waktu] |
    
    Asesmen Sumatif
    | Jenis | Bentuk | Waktu | Bobot |
    |-------|--------|-------|-------|
    | [Jenis 1] | [Bentuk 1] | [Waktu] | [Bobot] |
    | [Jenis 2] | [Bentuk 2] | [Waktu] | [Bobot] |
    
    ${
      data.model.includes("Project")
        ? `
    Asesmen Proyek / Kinerja
    | Aspek | Kriteria | Indikator | Skor Maks |
    |-------|----------|-----------|------------|
    | Perencanaan | [Kriteria perencanaan] | [Indikator] | [Skor] |
    | Proses | [Kriteria proses] | [Indikator] | [Skor] |
    | Produk | [Kriteria produk] | [Indikator] | [Skor] |
    | Presentasi | [Kriteria presentasi] | [Indikator] | [Skor] |
    
    Rubrik Penilaian
    | Aspek | Kriteria | Bobot |
    |-------|----------|-------|
    | Perencanaan | [Kriteria perencanaan] | 20% |
    | Proses | [Kriteria proses] | 40% |
    | Produk | [Kriteria produk] | 30% |
    | Presentasi | [Kriteria presentasi] | 10% |
    `
        : ""
    }
    
    H. Media dan Sumber Belajar
    
    Media Pembelajaran
    | No | Media | Jenis | Fungsi | Penggunaan |
    |----|-------|-------|--------|------------|
    | 1 | [Media 1] | [Jenis 1] | [Fungsi 1] | [Penggunaan 1] |
    | 2 | [Media 2] | [Jenis 2] | [Fungsi 2] | [Penggunaan 2] |
    | 3 | [Media 3] | [Jenis 3] | [Fungsi 3] | [Penggunaan 3] |
    
    Sumber Belajar
    | No | Sumber | Jenis | Relevansi | Akses |
    |----|--------|-------|----------|-------|
    | 1 | [Sumber 1] | [Jenis 1] | [Relevansi 1] | [Akses 1] |
    | 2 | [Sumber 2] | [Jenis 2] | [Relevansi 2] | [Akses 2] |
    | 3 | [Sumber 3] | [Jenis 3] | [Relevansi 3] | [Akses 3] |
    
    I. Diferensiasi Pembelajaran
    
    Diferensiasi Konten
    | Aspek | Strategi | Implementasi | Penilaian |
    |-------|----------|--------------|-----------|
    | [Aspek 1] | [Strategi 1] | [Implementasi 1] | [Penilaian 1] |
    | [Aspek 2] | [Strategi 2] | [Implementasi 2] | [Penilaian 2] |
    
    Diferensiasi Proses
    | Kegiatan | Strategi | Kelompok | Waktu |
    |----------|----------|----------|-------|
    | [Kegiatan 1] | [Strategi 1] | [Kelompok 1] | [Waktu] |
    | [Kegiatan 2] | [Strategi 2] | [Kelompok 2] | [Waktu] |
    
    Diferensiasi Produk
    | Jenis | Pilihan | Kriteria | Waktu |
    |-------|---------|----------|-------|
    | [Jenis 1] | [Pilihan 1] | [Kriteria 1] | [Waktu] |
    | [Jenis 2] | [Pilihan 2] | [Kriteria 2] | [Waktu] |
    
    J. Refleksi Pembelajaran
    
    Refleksi Peserta Didik
    | No | Pertanyaan | Tujuan |
    |----|------------|--------|
    | 1 | [Pertanyaan refleksi 1] | [Tujuan 1] |
    | 2 | [Pertanyaan refleksi 2] | [Tujuan 2] |
    | 3 | [Pertanyaan refleksi 3] | [Tujuan 3] |
    
    Refleksi Guru
    | No | Pertanyaan | Fokus |
    |----|------------|-------|
    | 1 | [Pertanyaan refleksi guru 1] | [Fokus 1] |
    | 2 | [Pertanyaan refleksi guru 2] | [Fokus 2] |
    | 3 | [Pertanyaan refleksi guru 3] | [Fokus 3] |
    
    Daftar Pustaka
    
    | No | Sumber Pustaka | Pengarang | Tahun | Penerbit | ISBN |
    |----|---------------|-----------|-------|---------|------|
    | 1 | [Judul Buku 1] | [Pengarang 1] | [Tahun 1] | [Penerbit 1] | [ISBN 1] |
    | 2 | [Judul Buku 2] | [Pengarang 2] | [Tahun 2] | [Penerbit 2] | [ISBN 2] |
    | 3 | [Judul Buku 3] | [Pengarang 3] | [Tahun 3] | [Penerbit 3] | [ISBN 3] |
    
    Glosarium
    
    | No | Istilah | Definisi | Contoh |
    |----|---------|----------|--------|
    | 1 | [Istilah 1] | [Definisi istilah 1] | [Contoh 1] |
    | 2 | [Istilah 2] | [Definisi istilah 2] | [Contoh 2] |
    | 3 | [Istilah 3] | [Definisi istilah 3] | [Contoh 3] |
    
    **INSTRUKSI KRUSIAL:**
    1. JUDUL MODUL HARUS: "${data.materi}" - TULIS DI BAGIAN PALING ATAS
    2. PADA BAGIAN "Jenjang / Kelas / Fase", gunakan format: ${data.jenjang} / ${data.kelas} / ${data.fase}
    3. PADA BAGIAN "Semester / Tahun Pelajaran", gunakan format: ${data.semester} / ${data.tahunAjaran}
    4. GUNAKAN MATERI: "${data.materi}" DI SEMUA BAGIAN YANG RELEVAN
    5. GUNAKAN MATA PELAJARAN: "${data.mapel}" DI SEMUA BAGIAN YANG RELEVAN
    6. JUMLAH PERTEMUAN HARUS SESUAI: ${data.jumlahPertemuan} PERTEMUAN
    7. ALOKASI WAKTU HARUS: ${data.jumlahPertemuan} pertemuan × ${waktuPerPertemuan} menit (total ${totalWaktu} menit)
    8. Pastikan struktur lengkap sesuai dengan Kurikulum Merdeka (A-J)
    9. SEMUA BAGIAN HARUS DALAM FORMAT TABEL KECUALI LKPD
    10. LKPD TIDAK BOLEH MENGGUNAKAN TABEL, HARUS TERSUSUN RAPI`
        : `Anda adalah ahli kurikulum pendidikan Indonesia. 
    Buatkan MODUL AJAR KURIKULUM BERBASIS KOMPETENSI/K13 dengan struktur lengkap sesuai peraturan di Indonesia.
    
    DATA PENTING YANG HARUS DIGUNAKAN:
    - JUDUL MODUL: "${data.materi}" (GUNAKAN INI SEBAGAI JUDUL UTAMA)
    - KELAS: "${data.kelas}" (GUNAKAN INI DI SEMUA TEMPAT YANG MEMERLUKAN KELAS)
    - MATERI: "${data.materi}" (GUNAKAN INI DI SEMUA BAGIAN YANG RELEVAN)
    - MATA PELAJARAN: "${data.mapel}" (GUNAKAN INI DI SEMUA BAGIAN YANG RELEVAN)
    - JENJANG: "${data.jenjang}" (GUNAKAN INI DI SEMUA BAGIAN YANG RELEVAN)
    - JUMLAH PERTEMUAN: ${data.jumlahPertemuan} (HARUS SESUAI DENGAN INI)
    - ALOKASI WAKTU: ${data.alokasiWaktu} (GUNAKAN INI, BUKAN DURASI AWAL)
    
    FORMAT OUTPUT HARUS SEPERTI INI (SEMUA BAGIAN DALAM TABEL KECUALI LKPD):
    
    MODUL AJAR ${data.mapel}
    "${data.materi}"
    
    A. Identitas Modul
    
    | Komponen | Keterangan |
    |----------|------------|
    | Satuan Pendidikan | ${data.institusi} |
    | Mata Pelajaran | ${data.mapel} |
    | Kelas / Semester | ${data.kelas} / ${data.semester} |
    | Tahun Pelajaran | ${data.tahunAjaran} |
    | Alokasi Waktu | ${data.jumlahPertemuan} pertemuan × ${waktuPerPertemuan} menit (total ${totalWaktu} menit) |
    | Model / Metode Pembelajaran | ${data.model} |
    
    B. Kompetensi
    
    Kompetensi Inti (KI)
    | KI | Kompetensi Inti |
    |----|----------------|
    | KI-1 | [KI-1 sesuai jenjang] |
    | KI-2 | [KI-2 sesuai jenjang] |
    | KI-3 | [KI-3 sesuai jenjang] |
    | KI-4 | [KI-4 sesuai jenjang] |
    
    Kompetensi Dasar (KD)
    | No | Kompetensi Dasar |
    |----|------------------|
    | 1 | [KD 1] |
    | 2 | [KD 2] |
    | 3 | [KD 3] |
    | 4 | [KD 4] |
    
    Indikator Pencapaian Kompetensi
    | No | Indikator | KD Terkait |
    |----|-----------|------------|
    | 1 | [Indikator 1] | [KD] |
    | 2 | [Indikator 2] | [KD] |
    | 3 | [Indikator 3] | [KD] |
    | 4 | [Indikator 4] | [KD] |
    
    C. Tujuan Pembelajaran
    
    Tujuan Pembelajaran Pengetahuan
    | No | Tujuan Pembelajaran | Indikator |
    |----|---------------------|-----------|
    | 1 | [Tujuan pengetahuan 1] | [Indikator] |
    | 2 | [Tujuan pengetahuan 2] | [Indikator] |
    | 3 | [Tujuan pengetahuan 3] | [Indikator] |
    
    Tujuan Pembelajaran Keterampilan
    | No | Tujuan Pembelajaran | Indikator |
    |----|---------------------|-----------|
    | 1 | [Tujuan keterampilan 1] | [Indikator] |
    | 2 | [Tujuan keterampilan 2] | [Indikator] |
    | 3 | [Tujuan keterampilan 3] | [Indikator] |
    
    D. Materi Pembelajaran
    
    Materi Pokok
    | Komponen | Keterangan |
    |----------|------------|
    | Materi | ${data.materi} |
    | Deskripsi | [Deskripsi materi pokok] |
    
    Materi Fakta
    | No | Fakta | Deskripsi | Sumber |
    |----|-------|----------|--------|
    | 1 | [Fakta 1] | [Deskripsi fakta 1] | [Sumber 1] |
    | 2 | [Fakta 2] | [Deskripsi fakta 2] | [Sumber 2] |
    | 3 | [Fakta 3] | [Deskripsi fakta 3] | [Sumber 3] |
    
    Materi Konsep
    | No | Konsep | Definisi | Contoh |
    |----|--------|----------|--------|
    | 1 | [Konsep 1] | [Definisi konsep 1] | [Contoh 1] |
    | 2 | [Konsep 2] | [Definisi konsep 2] | [Contoh 2] |
    | 3 | [Konsep 3] | [Definisi konsep 3] | [Contoh 3] |
    
    Materi Prosedural
    | No | Prosedur | Langkah-langkah | Aplikasi |
    |----|----------|---------------|-----------|
    | 1 | [Prosedur 1] | [Langkah-langkah 1] | [Aplikasi 1] |
    | 2 | [Prosedur 2] | [Langkah-langkah 2] | [Aplikasi 2] |
    | 3 | [Prosedur 3] | [Langkah-langkah 3] | [Aplikasi 3] |
    
    E. Kegiatan Pembelajaran
    
    ${Array.from({ length: pertemuanNum }, (_, i) => {
      // Add model-specific components
      let modelSpecificContent = "";
      if (data.model === "Project Based Learning") {
        modelSpecificContent = `
        
        Deskripsi Proyek
        | Komponen | Keterangan |
        |----------|------------|
        | Judul Proyek | [Judul proyek ${data.materi}] |
        | Deskripsi | [Deskripsi proyek ${data.materi}] |
        | Tujuan | [Tujuan proyek] |
        
        Tahapan Proyek
        | Tahap | Kegiatan | Waktu | Output |
        |-------|----------|-------|--------|
        | 1 | [Tahap 1] | [Waktu] | [Output 1] |
        | 2 | [Tahap 2] | [Waktu] | [Output 2] |
        | 3 | [Tahap 3] | [Waktu] | [Output 3] |
        `;
        if (i === pertemuanNum - 1) {
          modelSpecificContent += `
        
        Presentasi
        | Komponen | Keterangan |
        |----------|------------|
        | Format | [Format presentasi] |
        | Durasi | [Durasi presentasi] |
        | Penilaian | [Kriteria penilaian] |
        
        Rubrik Proyek
        | Aspek | Kriteria | Bobot |
        |-------|----------|-------|
        | Perencanaan | [Kriteria perencanaan] | 20% |
        | Proses | [Kriteria proses] | 40% |
        | Produk | [Kriteria produk] | 30% |
        | Presentasi | [Kriteria presentasi] | 10% |
        `;
        }
      } else if (data.model === "Problem Based Learning") {
        modelSpecificContent = `
        
        Skenario Masalah
        | Komponen | Keterangan |
        |----------|------------|
        | Masalah | [Skenario masalah nyata terkait ${data.materi}] |
        | Konteks | [Konteks masalah] |
        | Tantangan | [Tantangan yang dihadapi] |
        
        Hipotesis Solusi
        | No | Hipotesis | Alasan |
        |----|-----------|--------|
        | 1 | [Hipotesis 1] | [Alasan 1] |
        | 2 | [Hipotesis 2] | [Alasan 2] |
        `;
        if (i === Math.floor(pertemuanNum / 2)) {
          modelSpecificContent += `
        
        Evaluasi Solusi
        | Kriteria | Penilaian | Skor |
        |----------|-----------|-------|
        | [Kriteria 1] | [Penilaian 1] | [Skor] |
        | [Kriteria 2] | [Penilaian 2] | [Skor] |
        `;
        }
      } else if (data.model === "Cooperative Learning") {
        modelSpecificContent = `
        
        Struktur Kelompok
        | Komponen | Keterangan |
        |----------|------------|
        | Jumlah Anggota | [Jumlah anggota per kelompok] |
        | Metode Pengelompokan | [Metode pembentukan kelompok] |
        | Peran | [Distribusi peran dalam kelompok] |
        
        Peran Peserta Didik
        | Peran | Tanggung Jawab | Kriteria |
        |------|----------------|----------|
        | [Peran 1] | [Tanggung jawab 1] | [Kriteria 1] |
        | [Peran 2] | [Tanggung jawab 2] | [Kriteria 2] |
        `;
      } else if (data.model === "Blended Learning") {
        modelSpecificContent = `
        
        ${
          i % 2 === 0
            ? `
        Aktivitas Daring
        | Kegiatan | Platform | Waktu | Tujuan |
        |----------|----------|-------|--------|
        | [Kegiatan 1] | [Platform 1] | [Waktu] | [Tujuan 1] |
        | [Kegiatan 2] | [Platform 2] | [Waktu] | [Tujuan 2] |
        `
            : `
        Aktivitas Luring
        | Kegiatan | Metode | Waktu | Tujuan |
        |----------|---------|-------|--------|
        | [Kegiatan 1] | [Metode 1] | [Waktu] | [Tujuan 1] |
        | [Kegiatan 2] | [Metode 2] | [Waktu] | [Tujuan 2] |
        `
        }
        `;
      } else if (data.model === "Discovery Learning") {
        modelSpecificContent = `
        
        Tahapan Discovery
        | Tahap | Kegiatan | Waktu | Tujuan |
        |-------|----------|-------|--------|
        | Stimulasi | [Deskripsi stimulasi] | [Waktu] | [Tujuan] |
        | Identifikasi masalah | [Deskripsi identifikasi masalah] | [Waktu] | [Tujuan] |
        | Pengumpulan data | [Deskripsi pengumpulan data] | [Waktu] | [Tujuan] |
        | Verifikasi | [Deskripsi verifikasi] | [Waktu] | [Tujuan] |
        | Generalisasi | [Deskripsi generalisasi] | [Waktu] | [Tujuan] |
        `;
      } else if (data.model === "Inquiry Learning") {
        modelSpecificContent = `
        
        Pertanyaan Inkuiri
        | No | Pertanyaan | Jenis | Tujuan |
        |----|------------|-------|--------|
        | 1 | [Pertanyaan 1] | [Jenis 1] | [Tujuan 1] |
        | 2 | [Pertanyaan 2] | [Jenis 2] | [Tujuan 2] |
        
        Proses Penyelidikan
        | Tahap | Kegiatan | Metode | Output |
        |-------|----------|--------|--------|
        | 1 | [Kegiatan 1] | [Metode 1] | [Output 1] |
        | 2 | [Kegiatan 2] | [Metode 2] | [Output 2] |
        `;
      } else if (data.model === "Contextual Teaching and Learning (CTL)") {
        modelSpecificContent = `
        
        Konteks Nyata
        | Konteks | Relevansi | Implementasi |
        |---------|-----------|--------------|
        | [Konteks 1] | [Relevansi 1] | [Implementasi 1] |
        | [Konteks 2] | [Relevansi 2] | [Implementasi 2] |
        
        Refleksi Kontekstual
        | Aspek | Pertanyaan | Tujuan |
        |-------|------------|--------|
        | Pengalaman | [Pertanyaan 1] | [Tujuan 1] |
        | Aplikasi | [Pertanyaan 2] | [Tujuan 2] |
        `;
      } else if (data.model === "Differentiated Learning") {
        modelSpecificContent = `
        
        Strategi Diferensiasi
        | Aspek | Strategi | Implementasi | Penilaian |
        |-------|----------|--------------|-----------|
        | Konten | [Strategi konten] | [Implementasi konten] | [Penilaian konten] |
        | Proses | [Strategi proses] | [Implementasi proses] | [Penilaian proses] |
        | Produk | [Strategi produk] | [Implementasi produk] | [Penilaian produk] |
        
        Penyesuaian Asesmen
        | Jenis | Penyesuaian | Alat |
        |-------|-------------|------|
        | [Jenis 1] | [Penyesuaian 1] | [Alat 1] |
        | [Jenis 2] | [Penyesuaian 2] | [Alat 2] |
        `;
      }

      return `
    Pertemuan ke-${i + 1} (${waktuPerPertemuan} menit)
    
    Pendahuluan
    | Kegiatan | Waktu | Metode | Tujuan |
    |----------|-------|--------|--------|
    | [Kegiatan pendahuluan untuk pertemuan ${i + 1}] | [Waktu] | [Metode] | [Tujuan] |
    
    Kegiatan Inti
    | No | Kegiatan | Waktu | Metode | Tujuan |
    |----|----------|-------|--------|--------|
    | 1 | [Kegiatan inti 1 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] | [Tujuan] |
    | 2 | [Kegiatan inti 2 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] | [Tujuan] |
    | 3 | [Kegiatan inti 3 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] | [Tujuan] |
    ${modelSpecificContent}
    
    Penutup
    | Kegiatan | Waktu | Metode | Tujuan |
    |----------|-------|--------|--------|
    | [Kegiatan penutup untuk pertemuan ${i + 1}] | [Waktu] | [Metode] | [Tujuan] |
    `;
    }).join("")}
    
    F. Lembar Kerja Peserta Didik (LKPD)
    
    Judul LKPD
    ${data.materi}
    
    Petunjuk Belajar
    1. Bacalah dengan teliti petunjuk setiap kegiatan
    2. Kerjakan secara mandiri atau dalam kelompok sesuai instruksi
    3. Gunakan alat dan bahan yang tersedia dengan baik
    4. Tanyakan kepada guru jika ada yang tidak kamu pahami
    
    Tujuan Pembelajaran
    1. [Tujuan pembelajaran 1]
    2. [Tujuan pembelajaran 2]
    3. [Tujuan pembelajaran 3]
    
    Materi Singkat
    ${data.materi} adalah [deskripsi singkat ${data.materi}]. Konsep ini penting karena [alasan pentingnya ${data.materi}].
    
    Aktivitas / Langkah Kerja
    1. [Langkah kerja 1]
    2. [Langkah kerja 2]
    3. [Langkah kerja 3]
    4. [Langkah kerja 4]
    5. [Langkah kerja 5]
    
    ${
      data.jenjang === "SMK"
        ? `
    Job Sheet
    
    Alat dan Bahan
    1. [Alat/Bahan 1]: [Jumlah]
    2. [Alat/Bahan 2]: [Jumlah]
    3. [Alat/Bahan 3]: [Jumlah]
    
    Langkah Kerja Sistematis
    1. [Langkah kerja 1]
    2. [Langkah kerja 2]
    3. [Langkah kerja 3]
    4. [Langkah kerja 4]
    5. [Langkah kerja 5]
    
    Keselamatan Kerja (K3)
    1. [Aspek keselamatan 1]: [Keterangan]
    2. [Aspek keselamatan 2]: [Keterangan]
    3. [Aspek keselamatan 3]: [Keterangan]
    `
        : ""
    }
    
    Tugas / Soal / Studi Kasus
    1. [Tugas/Soal/Studi Kasus 1]
    2. [Tugas/Soal/Studi Kasus 2]
    3. [Tugas/Soal/Studi Kasus 3]
    
    Komponen Penilaian
    1. Sikap: [Kriteria penilaian sikap]
    2. Pengetahuan: [Kriteria penilaian pengetahuan]
    3. Keterampilan: [Kriteria penilaian keterampilan]
    
    G. Penilaian
    
    Penilaian Sikap
    | Aspek | Indikator | Teknik | Instrumen |
    |-------|----------|--------|-----------|
    | [Aspek 1] | [Indikator 1] | [Teknik 1] | [Instrumen 1] |
    | [Aspek 2] | [Indikator 2] | [Teknik 2] | [Instrumen 2] |
    
    Penilaian Pengetahuan
    | Jenis | Teknik | Waktu | Bentuk | Kriteria |
    |-------|--------|-------|--------|----------|
    | [Jenis 1] | [Teknik 1] | [Waktu] | [Bentuk 1] | [Kriteria 1] |
    | [Jenis 2] | [Teknik 2] | [Waktu] | [Bentuk 2] | [Kriteria 2] |
    
    Penilaian Keterampilan
    | Jenis | Teknik | Waktu | Bentuk | Kriteria |
    |-------|--------|-------|--------|----------|
    | [Jenis 1] | [Teknik 1] | [Waktu] | [Bentuk 1] | [Kriteria 1] |
    | [Jenis 2] | [Teknik 2] | [Waktu] | [Bentuk 2] | [Kriteria 2] |
    
    Instrumen & Rubrik
    | Jenis | Nama Instrumen | Fungsi | Waktu |
    |-------|----------------|--------|-------|
    | [Jenis 1] | [Nama 1] | [Fungsi 1] | [Waktu] |
    | [Jenis 2] | [Nama 2] | [Fungsi 2] | [Waktu] |
    
    H. Media dan Sumber Belajar
    
    Media Pembelajaran
    | No | Media | Jenis | Fungsi | Penggunaan |
    |----|-------|-------|--------|------------|
    | 1 | [Media 1] | [Jenis 1] | [Fungsi 1] | [Penggunaan 1] |
    | 2 | [Media 2] | [Jenis 2] | [Fungsi 2] | [Penggunaan 2] |
    | 3 | [Media 3] | [Jenis 3] | [Fungsi 3] | [Penggunaan 3] |
    
    Sumber Belajar
    | No | Sumber | Jenis | Relevansi | Akses |
    |----|--------|-------|----------|-------|
    | 1 | [Sumber 1] | [Jenis 1] | [Relevansi 1] | [Akses 1] |
    | 2 | [Sumber 2] | [Jenis 2] | [Relevansi 2] | [Akses 2] |
    | 3 | [Sumber 3] | [Jenis 3] | [Relevansi 3] | [Akses 3] |
    
    I. Refleksi & Tindak Lanjut
    
    Refleksi Peserta Didik
    | No | Pertanyaan | Tujuan |
    |----|------------|--------|
    | 1 | [Pertanyaan refleksi 1] | [Tujuan 1] |
    | 2 | [Pertanyaan refleksi 2] | [Tujuan 2] |
    | 3 | [Pertanyaan refleksi 3] | [Tujuan 3] |
    
    Refleksi Guru
    | No | Pertanyaan | Fokus |
    |----|------------|-------|
    | 1 | [Pertanyaan refleksi guru 1] | [Fokus 1] |
    | 2 | [Pertanyaan refleksi guru 2] | [Fokus 2] |
    | 3 | [Pertanyaan refleksi guru 3] | [Fokus 3] |
    
    Tindak Lanjut
    | Aspek | Kegiatan | Waktu | Penanggung Jawab |
    |-------|----------|-------|----------------|
    | [Aspek 1] | [Kegiatan 1] | [Waktu] | [Penanggung jawab 1] |
    | [Aspek 2] | [Kegiatan 2] | [Waktu] | [Penanggung jawab 2] |
    
    Daftar Pustaka
    
    | No | Sumber Pustaka | Pengarang | Tahun | Penerbit | ISBN |
    |----|---------------|-----------|-------|---------|------|
    | 1 | [Judul Buku 1] | [Pengarang 1] | [Tahun 1] | [Penerbit 1] | [ISBN 1] |
    | 2 | [Judul Buku 2] | [Pengarang 2] | [Tahun 2] | [Penerbit 2] | [ISBN 2] |
    | 3 | [Judul Buku 3] | [Pengarang 3] | [Tahun 3] | [Penerbit 3] | [ISBN 3] |
    
    Glosarium
    
    | No | Istilah | Definisi | Contoh |
    |----|---------|----------|--------|
    | 1 | [Istilah 1] | [Definisi istilah 1] | [Contoh 1] |
    | 2 | [Istilah 2] | [Definisi istilah 2] | [Contoh 2] |
    | 3 | [Istilah 3] | [Definisi istilah 3] | [Contoh 3] |
    
    **INSTRUKSI KRUSIAL:**
    1. JUDUL MODUL HARUS: "${data.materi}" - TULIS DI BAGIAN PALING ATAS
    2. PADA BAGIAN "Kelas / Semester", gunakan format: ${data.kelas} / ${data.semester}
    3. GUNAKAN MATERI: "${data.materi}" DI SEMUA BAGIAN YANG RELEVAN
    4. GUNAKAN MATA PELAJARAN: "${data.mapel}" DI SEMUA BAGIAN YANG RELEVAN
    5. JUMLAH PERTEMUAN HARUS SESUAI: ${data.jumlahPertemuan} PERTEMUAN
    6. ALOKASI WAKTU HARUS: ${data.jumlahPertemuan} pertemuan × ${waktuPerPertemuan} menit (total ${totalWaktu} menit)
    7. Pastikan struktur lengkap sesuai dengan Kurikulum Berbasis Kompetensi/K13 (A-H)
    8. SEMUA BAGIAN HARUS DALAM FORMAT TABEL KECUALI LKPD
    9. LKPD TIDAK BOLEH MENGGUNAKAN TABEL, HARUS TERSUSUN RAPI`;

    // Check if API key is valid
    if (
      !process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY === "your_api_key_here"
    ) {
      console.error("❌ GROQ_API_KEY tidak valid atau tidak dikonfigurasi");
      return generateFallbackModule(directPrompt, kurikulum, data);
    }

    // Gunakan model yang masih didukung
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Model yang masih didukung
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: directPrompt,
        },
      ],
      temperature: 0.5, // Lower temperature for more consistent output
      max_tokens: 8000,
      top_p: 0.9,
      stream: false,
    });

    let result = completion.choices[0]?.message?.content ?? "";

    console.log("📄 Panjang hasil:", result.length, "karakter");
    console.log("🔍 Format output:", result.substring(0, 100));

    // Lakukan post-processing yang lebih agresif untuk memastikan semua placeholder terganti
    result = result
      .replace(/\[JUDUL MODUL\]/g, data.materi) // Menggunakan data.materi sebagai judul
      .replace(/\[fase\]/g, data.fase)
      .replace(/\[kelas\]/g, data.kelas)
      .replace(/\[materi\]/g, data.materi)
      .replace(/\[mapel\]/g, data.mapel)
      .replace(/\[jenjang\]/g, data.jenjang)
      .replace(/\[jumlahPertemuan\]/g, data.jumlahPertemuan)
      .replace(/\[alokasiWaktu\]/g, data.alokasiWaktu)
      .replace(/\[model\]/g, data.model)
      .replace(/\[namaGuru\]/g, data.namaGuru)
      .replace(/\[institusi\]/g, data.institusi)
      .replace(/\[tahunAjaran\]/g, data.tahunAjaran)
      .replace(/\[semester\]/g, data.semester);

    // Tambahkan pemeriksaan khusus untuk judul
    if (result.includes("[JUDUL MODUL]")) {
      console.warn(
        "⚠️ [JUDUL MODUL] masih ditemukan setelah post-processing, lakukan penggantian final",
      );
      result = result.replace(/\[JUDUL MODUL\]/g, data.materi);
    }

    console.log("📄 Setelah post-processing:", result.substring(0, 200));

    if (!result || result.trim().length < 1000) {
      console.warn("⚠️ Hasil terlalu pendek, gunakan fallback");
      return generateFallbackModule(directPrompt, kurikulum, data);
    }

    // Pastikan output sudah dalam format yang benar
    if (!result.includes("MODUL AJAR")) {
      console.warn("⚠️ Format tidak sesuai, coba lagi");
      return await tryAlternativeModel(directPrompt, kurikulum, data);
    }

    return result;
  } catch (error: any) {
    console.error("❌ Error Groq API:", error.message);

    // Extract data for fallback
    const extractData = (text: string) => {
      // Extract judul
      const judulMatch = text.match(/Materi Pokok:\s*([^\n]+)/i);
      const judul = judulMatch ? judulMatch[1].trim() : "Judul Modul";

      // Extract fase
      const faseMatch = text.match(/Fase:\s*([^\n]+)/i);
      let fase = faseMatch ? faseMatch[1].trim() : "Fase D";

      // Extract kelas
      const kelasMatch = text.match(/Kelas:\s*([^\n]+)/i);
      const kelas = kelasMatch ? kelasMatch[1].trim() : "Kelas";

      // Extract materi
      const materiMatch = text.match(/Materi Pokok:\s*([^\n]+)/i);
      const materi = materiMatch ? materiMatch[1].trim() : "Materi Pokok";

      // Extract mapel
      const mapelMatch = text.match(/Mata Pelajaran:\s*([^\n]+)/i);
      const mapel = mapelMatch ? mapelMatch[1].trim() : "Mata Pelajaran";

      // Extract jenjang
      const jenjangMatch = text.match(/Jenjang:\s*([^\n]+)/i);
      const jenjang = jenjangMatch ? jenjangMatch[1].trim() : "SMP";

      // Extract jumlah pertemuan
      const pertemuanMatch = text.match(/Jumlah Pertemuan:\s*([^\n]+)/i);
      const jumlahPertemuan = pertemuanMatch ? pertemuanMatch[1].trim() : "2";

      // Extract alokasi waktu
      const alokasiWaktuMatch = text.match(/Alokasi Waktu:\s*([^\n]+)/i);
      const alokasiWaktu = alokasiWaktuMatch
        ? alokasiWaktuMatch[1].trim()
        : "2 pertemuan (total 180 menit)";

      // Extract model pembelajaran
      const modelMatch = text.match(/Model Pembelajaran:\s*([^\n]+)/i);
      const model = modelMatch
        ? modelMatch[1].trim()
        : "Problem Based Learning";

      // Extract nama guru
      const namaGuruMatch = text.match(/Nama Penyusun:\s*([^\n]+)/i);
      const namaGuru = namaGuruMatch ? namaGuruMatch[1].trim() : "Guru";

      // Extract institusi
      const institusiMatch = text.match(/Institusi:\s*([^\n]+)/i);
      const institusi = institusiMatch
        ? institusiMatch[1].trim()
        : "Satuan Pendidikan";

      // Extract tahun ajaran
      const tahunAjaranMatch = text.match(/Tahun Ajaran:\s*([^\n]+)/i);
      const tahunAjaran = tahunAjaranMatch
        ? tahunAjaranMatch[1].trim()
        : "2025/2026";

      // Extract semester
      const semesterMatch = text.match(/Semester:\s*([^\n]+)/i);
      const semester = semesterMatch ? semesterMatch[1].trim() : "Ganjil";

      return {
        judul,
        fase,
        kelas,
        materi,
        mapel,
        jenjang,
        jumlahPertemuan,
        alokasiWaktu,
        model,
        namaGuru,
        institusi,
        tahunAjaran,
        semester,
      };
    };

    const data = extractData(prompt);
    return generateFallbackModule(prompt, kurikulum, data);
  }
}

async function tryAlternativeModel(
  prompt: string,
  kurikulum: string,
  data: any,
): Promise<string> {
  console.log("🔄 Mencoba model alternatif: mixtral-8x7b-32768");

  try {
    // Calculate total duration
    const pertemuanNum = parseInt(data.jumlahPertemuan) || 2;
    const waktuPerPertemuan =
      parseInt(data.alokasiWaktu.match(/(\d+)/)?.[1] || "90") || 90;
    const totalWaktu = pertemuanNum * waktuPerPertemuan;

    const systemPrompt =
      kurikulum === "Kurikulum Merdeka"
        ? `Buatkan MODUL AJAR KURIKULUM MERDEKA dengan struktur lengkap sesuai peraturan di Indonesia.
      Gunakan semua data dari pengguna. Format harus termasuk:
      1. MODUL AJAR ${data.mapel}
      2. "${data.materi}"
      3. A. Informasi Umum (semua komponen dalam tabel)
      4. B. Capaian Pembelajaran (semua komponen dalam tabel)
      5. C. Profil Pelajar Pancasila (semua komponen dalam tabel)
      6. D. Materi Pembelajaran (semua komponen dalam tabel)
      7. E. Rencana Pembelajaran per Pertemuan (semua komponen dalam tabel)
      8. F. Lembar Kerja Peserta Didik (LKPD) (tanpa tabel, teks biasa)
      9. G. Asesmen Pembelajaran (semua komponen dalam tabel)
      10. H. Media dan Sumber Belajar (semua komponen dalam tabel)
      11. I. Diferensiasi Pembelajaran (semua komponen dalam tabel)
      12. J. Refleksi Pembelajaran (semua komponen dalam tabel)
      13. Daftar Pustaka (dalam bentuk tabel)
      14. Glosarium (dalam bentuk tabel)
      
      PENTING: 
      - JUDUL MODUL HARUS: "${data.materi}"
      - Pada bagian "Jenjang / Kelas / Fase", gunakan format: ${data.jenjang} / ${data.kelas} / ${data.fase}
      - Pada bagian "Semester / Tahun Pelajaran", gunakan format: ${data.semester} / ${data.tahunAjaran}
      - GUNAKAN MATERI: "${data.materi}" DI SEMUA BAGIAN YANG RELEVAN
      - JUMLAH PERTEMUAN HARUS SESUAI: ${data.jumlahPertemuan} PERTEMUAN
      - ALOKASI WAKTU HARUS: ${data.jumlahPertemuan} pertemuan × ${waktuPerPertemuan} menit (total ${totalWaktu} menit)
      - Pastikan struktur lengkap sesuai dengan Kurikulum Merdeka (A-J)
      - SEMUA BAGIAN HARUS DALAM FORMAT TABEL KECUALI LKPD
      - LKPD tidak menggunakan tabel tetap tersusun rapi`
        : `Buatkan MODUL AJAR KURIKULUM BERBASIS KOMPETENSI/K13 dengan struktur lengkap sesuai peraturan di Indonesia.
      Gunakan semua data dari pengguna. Format harus termasuk:
      1. MODUL AJAR ${data.mapel}
      2. "${data.materi}"
      3. A. Identitas Modul (semua komponen dalam tabel)
      4. B. Kompetensi (semua komponen dalam tabel)
      5. C. Tujuan Pembelajaran (semua komponen dalam tabel)
      6. D. Materi Pembelajaran (semua komponen dalam tabel)
      7. E. Kegiatan Pembelajaran (semua komponen dalam tabel)
      8. F. Penilaian (semua komponen dalam tabel)
      9. G. Media dan Sumber Belajar (semua komponen dalam tabel)
      10. H. Refleksi & Tindak Lanjut (semua komponen dalam tabel)
      11. Daftar Pustaka (dalam bentuk tabel)
      12. Glosarium (dalam bentuk tabel)
      
      PENTING: 
      - JUDUL MODUL HARUS: "${data.materi}"
      - Pada bagian "Kelas / Semester", gunakan format: ${data.kelas} / ${data.semester}
      - GUNAKAN MATERI: "${data.materi}" DI SEMUA BAGIAN YANG RELEVAN
      - JUMLAH PERTEMUAN HARUS SESUAI: ${data.jumlahPertemuan} PERTEMUAN
      - ALOKASI WAKTU HARUS: ${data.jumlahPertemuan} pertemuan × ${waktuPerPertemuan} menit (total ${totalWaktu} menit)
      - Pastikan struktur lengkap sesuai dengan Kurikulum Berbasis Kompetensi/K13 (A-H)
      - SEMUA BAGIAN HARUS DALAM FORMAT TABEL KECUALI LKPD
      - LKPD tidak menggunakan tabel tetap tersusun rapi`;

    const completion = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5, // Lower temperature for more consistent output
      max_tokens: 7000,
      top_p: 0.9,
    });

    let result = completion.choices[0]?.message?.content ?? "";

    // Lakukan post-processing yang lebih agresif
    result = result
      .replace(/\[JUDUL MODUL\]/g, data.materi) // Menggunakan data.materi sebagai judul
      .replace(/\[fase\]/g, data.fase)
      .replace(/\[kelas\]/g, data.kelas)
      .replace(/\[materi\]/g, data.materi)
      .replace(/\[mapel\]/g, data.mapel)
      .replace(/\[jenjang\]/g, data.jenjang)
      .replace(/\[jumlahPertemuan\]/g, data.jumlahPertemuan)
      .replace(/\[alokasiWaktu\]/g, data.alokasiWaktu)
      .replace(/\[model\]/g, data.model)
      .replace(/\[namaGuru\]/g, data.namaGuru)
      .replace(/\[institusi\]/g, data.institusi)
      .replace(/\[tahunAjaran\]/g, data.tahunAjaran)
      .replace(/\[semester\]/g, data.semester);

    // Tambahkan pemeriksaan khusus untuk judul
    if (result.includes("[JUDUL MODUL]")) {
      console.warn(
        "⚠️ [JUDUL MODUL] masih ditemukan di model alternatif, lakukan penggantian final",
      );
      result = result.replace(/\[JUDUL MODUL\]/g, data.materi);
    }

    if (result && result.length > 1000 && result.includes("MODUL AJAR")) {
      return result;
    }

    return generateFallbackModule(prompt, kurikulum, data);
  } catch (error: any) {
    console.error("❌ Model alternatif juga gagal:", error.message);
    return generateFallbackModule(prompt, kurikulum, data);
  }
}

function generateFallbackModule(
  prompt: string,
  kurikulum: string,
  data: any,
): string {
  console.log("📝 Membuat modul fallback untuk kurikulum:", kurikulum);

  // Calculate total duration
  const pertemuanNum = parseInt(data.jumlahPertemuan) || 2;
  const waktuPerPertemuan =
    parseInt(data.alokasiWaktu.match(/(\d+)/)?.[1] || "90") || 90;
  const totalWaktu = pertemuanNum * waktuPerPertemuan;

  if (kurikulum === "Kurikulum Merdeka") {
    return `
MODUL AJAR ${data.mapel}
"${data.materi}"

A. Informasi Umum

| Komponen | Keterangan |
|----------|------------|
| Satuan Pendidikan | ${data.institusi} |
| Mata Pelajaran | ${data.mapel} |
| Jenjang / Kelas / Fase | ${data.jenjang} / ${data.kelas} / ${data.fase} |
| Semester / Tahun Pelajaran | ${data.semester} / ${data.tahunAjaran} |
| Kurikulum | Kurikulum Merdeka |
| Alokasi Waktu | ${data.jumlahPertemuan} pertemuan × ${waktuPerPertemuan} menit (total ${totalWaktu} menit) |
| Model / Metode Pembelajaran | ${data.model} |
| Karakteristik Peserta Didik | Peserta didik pada fase ${data.fase} umumnya memiliki karakteristik [deskripsi karakteristik peserta didik sesuai fase]. |
| Dasar Hukum | Sesuai kebijakan Kurikulum Merdeka yang berlaku |

B. Capaian Pembelajaran

Capaian Pembelajaran (CP)
[CP sesuai dengan fase dan mata pelajaran]

Tujuan Pembelajaran (TP)
| No | Tujuan Pembelajaran |
|----|---------------------|
| 1 | Peserta didik mampu menjelaskan konsep dasar ${data.materi} dengan tepat. |
| 2 | Peserta didik mampu menerapkan konsep ${data.materi} dalam konteks nyata. |
| 3 | Peserta didik mampu menganalisis penerapan ${data.materi} dalam berbagai situasi. |
| 4 | Peserta didik mampu mengevaluasi efektivitas penerapan ${data.materi}. |
| 5 | Peserta didik mampu membuat kreasi berdasarkan pemahaman ${data.materi}. |

Pemetaan TP ke Pertemuan
| TP | Pertemuan 1 | Pertemuan 2 | ${pertemuanNum > 2 ? "Pertemuan 3" : ""} ${pertemuanNum > 3 ? "Pertemuan 4" : ""} ${pertemuanNum > 4 ? "Pertemuan 5" : ""} ${pertemuanNum > 5 ? "Pertemuan 6" : ""} ${pertemuanNum > 6 ? "Pertemuan 7" : ""} ${pertemuanNum > 7 ? "Pertemuan 8" : ""} |
|----|-------------|-------------|-------------|-------------|-------------|-------------|-------------|-------------|
| TP 1 | ✓ | | | | | | | |
| TP 2 | ✓ | | | | | | | |
| TP 3 | | ✓ | | | | | | |
| TP 4 | | ✓ | | | | | | |
| TP 5 | | | ✓ | | | | | |

C. Profil Pelajar Pancasila

Dimensi yang dikembangkan
| No | Dimensi Profil Pelajar Pancasila |
|----|--------------------------------|
 ${data.skl.map((skl: string, i: number) => `| ${i + 1} | ${skl} |`).join("\n ")}

Elemen & Sub-elemen
| Elemen | Sub-elemen | Keterangan |
|--------|-------------|------------|
| [Elemen 1] | [Sub-elemen 1.1] | [Keterangan] |
| [Elemen 1] | [Sub-elemen 1.2] | [Keterangan] |
| [Elemen 2] | [Sub-elemen 2.1] | [Keterangan] |

Keterkaitan dengan pembelajaran
| Aspek | Keterkaitan |
|-------|-------------|
| Dimensi | [Deskripsi keterkaitan Profil Pelajar Pancasila dengan pembelajaran ${data.materi}] |
| Implementasi | [Cara mengimplementasikan dimensi dalam pembelajaran] |

D. Materi Pembelajaran

Materi Pokok
| Komponen | Keterangan |
|----------|------------|
| Materi | ${data.materi} |
| Deskripsi | [Deskripsi materi pokok] |

Materi Fakta
| No | Fakta | Deskripsi |
|----|-------|----------|
| 1 | [Fakta 1] | [Deskripsi fakta 1] |
| 2 | [Fakta 2] | [Deskripsi fakta 2] |
| 3 | [Fakta 3] | [Deskripsi fakta 3] |

Materi Konsep
| No | Konsep | Deskripsi |
|----|--------|----------|
| 1 | [Konsep 1] | [Deskripsi konsep 1] |
| 2 | [Konsep 2] | [Deskripsi konsep 2] |
| 3 | [Konsep 3] | [Deskripsi konsep 3] |

Materi Prosedural
| No | Prosedur | Deskripsi |
|----|----------|----------|
| 1 | [Prosedur 1] | [Deskripsi prosedur 1] |
| 2 | [Prosedur 2] | [Deskripsi prosedur 2] |
| 3 | [Prosedur 3] | [Deskripsi prosedur 3] |

E. Rencana Pembelajaran per Pertemuan

 ${Array.from({ length: pertemuanNum }, (_, i) => {
   // Distribute TP across meetings
   let tpFocus: any[] = [];
   if (i === 0)
     tpFocus = [1, 2]; // First meeting
   else if (i === 1)
     tpFocus = [2, 3]; // Second meeting
   else if (i === 2)
     tpFocus = [3, 4]; // Third meeting
   else if (i === 3)
     tpFocus = [4, 5]; // Fourth meeting
   else if (i === 4)
     tpFocus = [5]; // Fifth meeting if exists
   else if (i === 5)
     tpFocus = [5]; // Sixth meeting if exists
   else if (i === 6)
     tpFocus = [5]; // Seventh meeting if exists
   else if (i === 7) tpFocus = [5]; // Eighth meeting if exists

   // Add model-specific components
   let modelSpecificContent = "";
   if (data.model === "Project Based Learning") {
     modelSpecificContent = `
        
        Deskripsi Proyek
        | Komponen | Keterangan |
        |----------|------------|
        | Judul Proyek | [Judul proyek ${data.materi}] |
        | Deskripsi | [Deskripsi proyek ${data.materi}] |
        | Tujuan | [Tujuan proyek] |
        
        Tahapan Proyek
        | Tahap | Kegiatan | Waktu | Output |
        |-------|----------|-------|--------|
        | 1 | [Tahap 1] | [Waktu] | [Output 1] |
        | 2 | [Tahap 2] | [Waktu] | [Output 2] |
        | 3 | [Tahap 3] | [Waktu] | [Output 3] |
        `;
     if (i === pertemuanNum - 1) {
       modelSpecificContent += `
        
        Presentasi
        | Komponen | Keterangan |
        |----------|------------|
        | Format | [Format presentasi] |
        | Durasi | [Durasi presentasi] |
        | Penilaian | [Kriteria penilaian] |
        
        Rubrik Proyek
        | Aspek | Kriteria | Bobot |
        |-------|----------|-------|
        | Perencanaan | [Kriteria perencanaan] | 20% |
        | Proses | [Kriteria proses] | 40% |
        | Produk | [Kriteria produk] | 30% |
        | Presentasi | [Kriteria presentasi] | 10% |
        `;
     }
   } else if (data.model === "Problem Based Learning") {
     modelSpecificContent = `
        
        Skenario Masalah
        | Komponen | Keterangan |
        |----------|------------|
        | Masalah | [Skenario masalah nyata terkait ${data.materi}] |
        | Konteks | [Konteks masalah] |
        | Tantangan | [Tantangan yang dihadapi] |
        
        Hipotesis Solusi
        | No | Hipotesis | Alasan |
        |----|-----------|--------|
        | 1 | [Hipotesis 1] | [Alasan 1] |
        | 2 | [Hipotesis 2] | [Alasan 2] |
        `;
     if (i === Math.floor(pertemuanNum / 2)) {
       modelSpecificContent += `
        
        Evaluasi Solusi
        | Kriteria | Penilaian | Skor |
        |----------|-----------|-------|
        | [Kriteria 1] | [Penilaian 1] | [Skor] |
        | [Kriteria 2] | [Penilaian 2] | [Skor] |
        `;
     }
   }

   return `
Pertemuan ke-${i + 1} (${waktuPerPertemuan} menit)

Tujuan Pembelajaran
| No | Tujuan Pembelajaran |
|----|---------------------|
 ${tpFocus.map((tp) => `| ${tp} | [TP ${tp} untuk pertemuan ${i + 1}] |`).join("\n ")}

Pemantik / Apersepsi
| Kegiatan | Waktu | Metode |
|----------|-------|--------|
| [Pemantik/aperspsi untuk pertemuan ${i + 1}] | [Waktu] | [Metode] |

Kegiatan Inti
| No | Kegiatan | Waktu | Metode |
|----|----------|-------|--------|
| 1 | [Kegiatan inti 1 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] |
| 2 | [Kegiatan inti 2 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] |
| 3 | [Kegiatan inti 3 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] |
 ${modelSpecificContent}

Kegiatan Penutup
| Kegiatan | Waktu | Metode |
|----------|-------|--------|
| [Kegiatan penutup untuk pertemuan ${i + 1}] | [Waktu] | [Metode] |

Asesmen Pertemuan
| Jenis | Instrumen | Waktu | Kriteria |
|-------|-----------|-------|----------|
| [Jenis asesmen] | [Instrumen] | [Waktu] | [Kriteria] |
`;
 }).join("")}

F. Lembar Kerja Peserta Didik (LKPD)

Judul LKPD
 ${data.materi}

Petunjuk Belajar
1. Bacalah dengan teliti petunjuk setiap kegiatan
2. Kerjakan secara mandiri atau dalam kelompok sesuai instruksi
3. Gunakan alat dan bahan yang tersedia dengan baik
4. Tanyakan kepada guru jika ada yang tidak kamu pahami

Tujuan Pembelajaran
1. [Tujuan pembelajaran 1]
2. [Tujuan pembelajaran 2]
3. [Tujuan pembelajaran 3]

Materi Singkat
 ${data.materi} adalah [deskripsi singkat ${data.materi}]. Konsep ini penting karena [alasan pentingnya ${data.materi}].

Aktivitas / Langkah Kerja
1. [Langkah kerja 1]
2. [Langkah kerja 2]
3. [Langkah kerja 3]
4. [Langkah kerja 4]
5. [Langkah kerja 5]

 ${
   data.jenjang === "SMK"
     ? `
Job Sheet

Alat dan Bahan
1. [Alat/Bahan 1]: [Jumlah]
2. [Alat/Bahan 2]: [Jumlah]
3. [Alat/Bahan 3]: [Jumlah]

Langkah Kerja Sistematis
1. [Langkah kerja 1]
2. [Langkah kerja 2]
3. [Langkah kerja 3]
4. [Langkah kerja 4]
5. [Langkah kerja 5]

Keselamatan Kerja (K3)
1. [Aspek keselamatan 1]: [Keterangan]
2. [Aspek keselamatan 2]: [Keterangan]
3. [Aspek keselamatan 3]: [Keterangan]
`
     : ""
 }

Tugas / Soal / Studi Kasus
1. [Tugas/Soal/Studi Kasus 1]
2. [Tugas/Soal/Studi Kasus 2]
3. [Tugas/Soal/Studi Kasus 3]

Komponen Penilaian
1. Sikap: [Kriteria penilaian sikap]
2. Pengetahuan: [Kriteria penilaian pengetahuan]
3. Keterampilan: [Kriteria penilaian keterampilan]

G. Asesmen Pembelajaran

Asesmen Diagnostik
| Komponen | Instrumen | Tujuan |
|----------|-----------|--------|
| [Komponen 1] | [Instrumen 1] | [Tujuan 1] |
| [Komponen 2] | [Instrumen 2] | [Tujuan 2] |

Asesmen Formatif
| Jenis | Teknik | Instrumen | Waktu |
|-------|--------|-----------|-------|
| [Jenis 1] | [Teknik 1] | [Instrumen 1] | [Waktu] |
| [Jenis 2] | [Teknik 2] | [Instrumen 2] | [Waktu] |

Asesmen Sumatif
| Jenis | Bentuk | Waktu | Bobot |
|-------|--------|-------|-------|
| [Jenis 1] | [Bentuk 1] | [Waktu] | [Bobot] |
| [Jenis 2] | [Bentuk 2] | [Waktu] | [Bobot] |

 ${
   data.model.includes("Project")
     ? `
Asesmen Proyek / Kinerja
| Aspek | Kriteria | Indikator | Skor Maks |
|-------|----------|-----------|------------|
| Perencanaan | [Kriteria perencanaan] | [Indikator] | [Skor] |
| Proses | [Kriteria proses] | [Indikator] | [Skor] |
| Produk | [Kriteria produk] | [Indikator] | [Skor] |
| Presentasi | [Kriteria presentasi] | [Indikator] | [Skor] |

Rubrik Penilaian
| Aspek | Kriteria | Bobot |
|-------|----------|-------|
| Perencanaan | [Kriteria perencanaan] | 20% |
| Proses | [Kriteria proses] | 40% |
| Produk | [Kriteria produk] | 30% |
| Presentasi | [Kriteria presentasi] | 10% |
`
     : ""
 }

H. Media dan Sumber Belajar

Media Pembelajaran
| No | Media | Jenis | Fungsi | Penggunaan |
|----|-------|-------|--------|------------|
| 1 | [Media 1] | [Jenis 1] | [Fungsi 1] | [Penggunaan 1] |
| 2 | [Media 2] | [Jenis 2] | [Fungsi 2] | [Penggunaan 2] |
| 3 | [Media 3] | [Jenis 3] | [Fungsi 3] | [Penggunaan 3] |

Sumber Belajar
| No | Sumber | Jenis | Relevansi | Akses |
|----|--------|-------|----------|-------|
| 1 | [Sumber 1] | [Jenis 1] | [Relevansi 1] | [Akses 1] |
| 2 | [Sumber 2] | [Jenis 2] | [Relevansi 2] | [Akses 2] |
| 3 | [Sumber 3] | [Jenis 3] | [Relevansi 3] | [Akses 3] |

I. Diferensiasi Pembelajaran

Diferensiasi Konten
| Aspek | Strategi | Implementasi | Penilaian |
|-------|----------|--------------|-----------|
| [Aspek 1] | [Strategi 1] | [Implementasi 1] | [Penilaian 1] |
| [Aspek 2] | [Strategi 2] | [Implementasi 2] | [Penilaian 2] |

Diferensiasi Proses
| Kegiatan | Strategi | Kelompok | Waktu |
|----------|----------|----------|-------|
| [Kegiatan 1] | [Strategi 1] | [Kelompok 1] | [Waktu] |
| [Kegiatan 2] | [Strategi 2] | [Kelompok 2] | [Waktu] |

Diferensiasi Produk
| Jenis | Pilihan | Kriteria | Waktu |
|-------|---------|----------|-------|
| [Jenis 1] | [Pilihan 1] | [Kriteria 1] | [Waktu] |
| [Jenis 2] | [Pilihan 2] | [Kriteria 2] | [Waktu] |

J. Refleksi Pembelajaran

Refleksi Peserta Didik
| No | Pertanyaan | Tujuan |
|----|------------|--------|
| 1 | [Pertanyaan refleksi 1] | [Tujuan 1] |
| 2 | [Pertanyaan refleksi 2] | [Tujuan 2] |
| 3 | [Pertanyaan refleksi 3] | [Tujuan 3] |

Refleksi Guru
| No | Pertanyaan | Fokus |
|----|------------|-------|
| 1 | [Pertanyaan refleksi guru 1] | [Fokus 1] |
| 2 | [Pertanyaan refleksi guru 2] | [Fokus 2] |
| 3 | [Pertanyaan refleksi guru 3] | [Fokus 3] |

Daftar Pustaka

| No | Sumber Pustaka | Pengarang | Tahun | Penerbit | ISBN |
|----|---------------|-----------|-------|---------|------|
| 1 | [Judul Buku 1] | [Pengarang 1] | [Tahun 1] | [Penerbit 1] | [ISBN 1] |
| 2 | [Judul Buku 2] | [Pengarang 2] | [Tahun 2] | [Penerbit 2] | [ISBN 2] |
| 3 | [Judul Buku 3] | [Pengarang 3] | [Tahun 3] | [Penerbit 3] | [ISBN 3] |

Glosarium

| No | Istilah | Definisi | Contoh |
|----|---------|----------|--------|
| 1 | [Istilah 1] | [Definisi istilah 1] | [Contoh 1] |
| 2 | [Istilah 2] | [Definisi istilah 2] | [Contoh 2] |
| 3 | [Istilah 3] | [Definisi istilah 3] | [Contoh 3] |
`;
  } else {
    // Kurikulum Berbasis Kompetensi/K13 Format
    return `
MODUL AJAR ${data.mapel}
"${data.materi}"

A. Identitas Modul

| Komponen | Keterangan |
|----------|------------|
| Satuan Pendidikan | ${data.institusi} |
| Mata Pelajaran | ${data.mapel} |
| Kelas / Semester | ${data.kelas} / ${data.semester} |
| Tahun Pelajaran | ${data.tahunAjaran} |
| Alokasi Waktu | ${data.jumlahPertemuan} pertemuan × ${waktuPerPertemuan} menit (total ${totalWaktu} menit) |
| Model / Metode Pembelajaran | ${data.model} |

B. Kompetensi

Kompetensi Inti (KI)
| KI | Kompetensi Inti |
|----|----------------|
| KI-1 | [KI-1 sesuai jenjang] |
| KI-2 | [KI-2 sesuai jenjang] |
| KI-3 | [KI-3 sesuai jenjang] |
| KI-4 | [KI-4 sesuai jenjang] |

Kompetensi Dasar (KD)
| No | Kompetensi Dasar |
|----|------------------|
| 1 | [KD 1] |
| 2 | [KD 2] |
| 3 | [KD 3] |
| 4 | [KD 4] |

Indikator Pencapaian Kompetensi
| No | Indikator | KD Terkait |
|----|-----------|------------|
| 1 | [Indikator 1] | [KD] |
| 2 | [Indikator 2] | [KD] |
| 3 | [Indikator 3] | [KD] |
| 4 | [Indikator 4] | [KD] |

C. Tujuan Pembelajaran

Tujuan Pembelajaran Pengetahuan
| No | Tujuan Pembelajaran | Indikator |
|----|---------------------|-----------|
| 1 | [Tujuan pengetahuan 1] | [Indikator] |
| 2 | [Tujuan pengetahuan 2] | [Indikator] |
| 3 | [Tujuan pengetahuan 3] | [Indikator] |

Tujuan Pembelajaran Keterampilan
| No | Tujuan Pembelajaran | Indikator |
|----|---------------------|-----------|
| 1 | [Tujuan keterampilan 1] | [Indikator] |
| 2 | [Tujuan keterampilan 2] | [Indikator] |
| 3 | [Tujuan keterampilan 3] | [Indikator] |

D. Materi Pembelajaran

Materi Pokok
| Komponen | Keterangan |
|----------|------------|
| Materi | ${data.materi} |
| Deskripsi | [Deskripsi materi pokok] |

Materi Fakta
| No | Fakta | Deskripsi | Sumber |
|----|-------|----------|--------|
| 1 | [Fakta 1] | [Deskripsi fakta 1] | [Sumber 1] |
| 2 | [Fakta 2] | [Deskripsi fakta 2] | [Sumber 2] |
| 3 | [Fakta 3] | [Deskripsi fakta 3] | [Sumber 3] |

Materi Konsep
| No | Konsep | Definisi | Contoh |
|----|--------|----------|--------|
| 1 | [Konsep 1] | [Definisi konsep 1] | [Contoh 1] |
| 2 | [Konsep 2] | [Definisi konsep 2] | [Contoh 2] |
| 3 | [Konsep 3] | [Definisi konsep 3] | [Contoh 3] |

Materi Prosedural
| No | Prosedur | Langkah-langkah | Aplikasi |
|----|----------|---------------|-----------|
| 1 | [Prosedur 1] | [Langkah-langkah 1] | [Aplikasi 1] |
| 2 | [Prosedur 2] | [Langkah-langkah 2] | [Aplikasi 2] |
| 3 | [Prosedur 3] | [Langkah-langkah 3] | [Aplikasi 3] |

E. Kegiatan Pembelajaran

 ${Array.from({ length: pertemuanNum }, (_, i) => {
   // Add model-specific components
   let modelSpecificContent = "";
   if (data.model === "Project Based Learning") {
     modelSpecificContent = `
        
        Deskripsi Proyek
        | Komponen | Keterangan |
        |----------|------------|
        | Judul Proyek | [Judul proyek ${data.materi}] |
        | Deskripsi | [Deskripsi proyek ${data.materi}] |
        | Tujuan | [Tujuan proyek] |
        
        Tahapan Proyek
        | Tahap | Kegiatan | Waktu | Output |
        |-------|----------|-------|--------|
        | 1 | [Tahap 1] | [Waktu] | [Output 1] |
        | 2 | [Tahap 2] | [Waktu] | [Output 2] |
        | 3 | [Tahap 3] | [Waktu] | [Output 3] |
        `;
     if (i === pertemuanNum - 1) {
       modelSpecificContent += `
        
        Presentasi
        | Komponen | Keterangan |
        |----------|------------|
        | Format | [Format presentasi] |
        | Durasi | [Durasi presentasi] |
        | Penilaian | [Kriteria penilaian] |
        
        Rubrik Proyek
        | Aspek | Kriteria | Bobot |
        |-------|----------|-------|
        | Perencanaan | [Kriteria perencanaan] | 20% |
        | Proses | [Kriteria proses] | 40% |
        | Produk | [Kriteria produk] | 30% |
        | Presentasi | [Kriteria presentasi] | 10% |
        `;
     }
   } else if (data.model === "Problem Based Learning") {
     modelSpecificContent = `
        
        Skenario Masalah
        | Komponen | Keterangan |
        |----------|------------|
        | Masalah | [Skenario masalah nyata terkait ${data.materi}] |
        | Konteks | [Konteks masalah] |
        | Tantangan | [Tantangan yang dihadapi] |
        
        Hipotesis Solusi
        | No | Hipotesis | Alasan |
        |----|-----------|--------|
        | 1 | [Hipotesis 1] | [Alasan 1] |
        | 2 | [Hipotesis 2] | [Alasan 2] |
        `;
     if (i === Math.floor(pertemuanNum / 2)) {
       modelSpecificContent += `
        
        Evaluasi Solusi
        | Kriteria | Penilaian | Skor |
        |----------|-----------|-------|
        | [Kriteria 1] | [Penilaian 1] | [Skor] |
        | [Kriteria 2] | [Penilaian 2] | [Skor] |
        `;
     }
   }

   return `
Pertemuan ke-${i + 1} (${waktuPerPertemuan} menit)

Pendahuluan
| Kegiatan | Waktu | Metode | Tujuan |
|----------|-------|--------|--------|
| [Kegiatan pendahuluan untuk pertemuan ${i + 1}] | [Waktu] | [Metode] | [Tujuan] |

Kegiatan Inti
| No | Kegiatan | Waktu | Metode | Tujuan |
|----|----------|-------|--------|--------|
| 1 | [Kegiatan inti 1 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] | [Tujuan] |
| 2 | [Kegiatan inti 2 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] | [Tujuan] |
| 3 | [Kegiatan inti 3 untuk pertemuan ${i + 1}] | [Waktu] | [Metode] | [Tujuan] |
 ${modelSpecificContent}

Penutup
| Kegiatan | Waktu | Metode | Tujuan |
|----------|-------|--------|--------|
| [Kegiatan penutup untuk pertemuan ${i + 1}] | [Waktu] | [Metode] | [Tujuan] |
`;
 }).join("")}

F. Lembar Kerja Peserta Didik (LKPD)

Judul LKPD
 ${data.materi}

Petunjuk Belajar
1. Bacalah dengan teliti petunjuk setiap kegiatan
2. Kerjakan secara mandiri atau dalam kelompok sesuai instruksi
3. Gunakan alat dan bahan yang tersedia dengan baik
4. Tanyakan kepada guru jika ada yang tidak kamu pahami

Tujuan Pembelajaran
1. [Tujuan pembelajaran 1]
2. [Tujuan pembelajaran 2]
3. [Tujuan pembelajaran 3]

Materi Singkat
 ${data.materi} adalah [deskripsi singkat ${data.materi}]. Konsep ini penting karena [alasan pentingnya ${data.materi}].

Aktivitas / Langkah Kerja
1. [Langkah kerja 1]
2. [Langkah kerja 2]
3. [Langkah kerja 3]
4. [Langkah kerja 4]
5. [Langkah kerja 5]

 ${
   data.jenjang === "SMK"
     ? `
Job Sheet

Alat dan Bahan
1. [Alat/Bahan 1]: [Jumlah]
2. [Alat/Bahan 2]: [Jumlah]
3. [Alat/Bahan 3]: [Jumlah]

Langkah Kerja Sistematis
1. [Langkah kerja 1]
2. [Langkah kerja 2]
3. [Langkah kerja 3]
4. [Langkah kerja 4]
5. [Langkah kerja 5]

Keselamatan Kerja (K3)
1. [Aspek keselamatan 1]: [Keterangan]
2. [Aspek keselamatan 2]: [Keterangan]
3. [Aspek keselamatan 3]: [Keterangan]
`
     : ""
 }

Tugas / Soal / Studi Kasus
1. [Tugas/Soal/Studi Kasus 1]
2. [Tugas/Soal/Studi Kasus 2]
3. [Tugas/Soal/Studi Kasus 3]

Komponen Penilaian
1. Sikap: [Kriteria penilaian sikap]
2. Pengetahuan: [Kriteria penilaian pengetahuan]
3. Keterampilan: [Kriteria penilaian keterampilan]

G. Penilaian

Penilaian Sikap
| Aspek | Indikator | Teknik | Instrumen |
|-------|----------|--------|-----------|
| [Aspek 1] | [Indikator 1] | [Teknik 1] | [Instrumen 1] |
| [Aspek 2] | [Indikator 2] | [Teknik 2] | [Instrumen 2] |

Penilaian Pengetahuan
| Jenis | Teknik | Waktu | Bentuk | Kriteria |
|-------|--------|-------|--------|----------|
| [Jenis 1] | [Teknik 1] | [Waktu] | [Bentuk 1] | [Kriteria 1] |
| [Jenis 2] | [Teknik 2] | [Waktu] | [Bentuk 2] | [Kriteria 2] |

Penilaian Keterampilan
| Jenis | Teknik | Waktu | Bentuk | Kriteria |
|-------|--------|-------|--------|----------|
| [Jenis 1] | [Teknik 1] | [Waktu] | [Bentuk 1] | [Kriteria 1] |
| [Jenis 2] | [Teknik 2] | [Waktu] | [Bentuk 2] | [Kriteria 2] |

Instrumen & Rubrik
| Jenis | Nama Instrumen | Fungsi | Waktu |
|-------|----------------|--------|-------|
| [Jenis 1] | [Nama 1] | [Fungsi 1] | [Waktu] |
| [Jenis 2] | [Nama 2] | [Fungsi 2] | [Waktu] |

H. Media dan Sumber Belajar

Media Pembelajaran
| No | Media | Jenis | Fungsi | Penggunaan |
|----|-------|-------|--------|------------|
| 1 | [Media 1] | [Jenis 1] | [Fungsi 1] | [Penggunaan 1] |
| 2 | [Media 2] | [Jenis 2] | [Fungsi 2] | [Penggunaan 2] |
| 3 | [Media 3] | [Jenis 3] | [Fungsi 3] | [Penggunaan 3] |

Sumber Belajar
| No | Sumber | Jenis | Relevansi | Akses |
|----|--------|-------|----------|-------|
| 1 | [Sumber 1] | [Jenis 1] | [Relevansi 1] | [Akses 1] |
| 2 | [Sumber 2] | [Jenis 2] | [Relevansi 2] | [Akses 2] |
| 3 | [Sumber 3] | [Jenis 3] | [Relevansi 3] | [Akses 3] |

I. Refleksi & Tindak Lanjut

Refleksi Peserta Didik
| No | Pertanyaan | Tujuan |
|----|------------|--------|
| 1 | [Pertanyaan refleksi 1] | [Tujuan 1] |
| 2 | [Pertanyaan refleksi 2] | [Tujuan 2] |
| 3 | [Pertanyaan refleksi 3] | [Tujuan 3] |

Refleksi Guru
| No | Pertanyaan | Fokus |
|----|------------|-------|
| 1 | [Pertanyaan refleksi guru 1] | [Fokus 1] |
| 2 | [Pertanyaan refleksi guru 2] | [Fokus 2] |
| 3 | [Pertanyaan refleksi guru 3] | [Fokus 3] |

Tindak Lanjut
| Aspek | Kegiatan | Waktu | Penanggung Jawab |
|-------|----------|-------|----------------|
| [Aspek 1] | [Kegiatan 1] | [Waktu] | [Penanggung jawab 1] |
| [Aspek 2] | [Kegiatan 2] | [Waktu] | [Penanggung jawab 2] |

Daftar Pustaka

| No | Sumber Pustaka | Pengarang | Tahun | Penerbit | ISBN |
|----|---------------|-----------|-------|---------|------|
| 1 | [Judul Buku 1] | [Pengarang 1] | [Tahun 1] | [Penerbit 1] | [ISBN 1] |
| 2 | [Judul Buku 2] | [Pengarang 2] | [Tahun 2] | [Penerbit 2] | [ISBN 2] |
| 3 | [Judul Buku 3] | [Pengarang 3] | [Tahun 3] | [Penerbit 3] | [ISBN 3] |

Glosarium

| No | Istilah | Definisi | Contoh |
|----|---------|----------|--------|
| 1 | [Istilah 1] | [Definisi istilah 1] | [Contoh 1] |
| 2 | [Istilah 2] | [Definisi istilah 2] | [Contoh 2] |
| 3 | [Istilah 3] | [Definisi istilah 3] | [Contoh 3] |
`;
  }
}
