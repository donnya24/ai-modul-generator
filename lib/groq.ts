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
      const getValue = (key: string): string => {
        // Try to find value in different formats
        const patterns = [
          new RegExp(`- ${key}: ([^\\n]+)`, "i"),
          new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, "i"),
          new RegExp(`${key}: ([^\\n]+)`, "i"),
        ];

        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) return match[1].trim();
        }
        return "";
      };

      // Khusus untuk fase, kita perlu membersihkan dari teks tambahan
      let faseValue = getValue("Fase") || "";
      faseValue = faseValue
        .replace(/\s*\(GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS\)\s*/g, "")
        .trim();

      return {
        judul: getValue("JUDUL MODUL") || getValue("judul") || "",
        fase: faseValue,
        kelas: getValue("Kelas") || "",
        materi: getValue("Materi Pokok") || getValue("materi") || "",
        mapel: getValue("Mata Pelajaran") || getValue("mapel") || "",
      };
    };

    const data = extractData(prompt);
    console.log("📊 Extracted data:", data);

    // Fungsi untuk mengganti semua placeholder secara konsisten
    const replacePlaceholders = (text: string): string => {
      // Ganti judul modul dengan berbagai pola - urutan dari yang paling spesifik ke umum
      let result = text
        // Pola 1: [JUDUL MODUL] standalone
        .replace(/\[JUDUL MODUL\]/g, data.judul)

        // Pola 2: JUDUL MODUL: [JUDUL MODUL]
        .replace(
          /JUDUL MODUL:\s*\[JUDUL MODUL\]/g,
          `JUDUL MODUL: ${data.judul}`,
        )

        // Pola 3: # [JUDUL MODUL]
        .replace(/^#\s*\[JUDUL MODUL\]/gm, `# ${data.judul}`)

        // Pola 4: ## [JUDUL MODUL]
        .replace(/^##\s*\[JUDUL MODUL\]/gm, `## ${data.judul}`)

        // Pola 5: # MODUL AJAR... diikuti # [JUDUL MODUL]
        .replace(
          /#\s*MODUL AJAR[^\n]*\n#\s*\[JUDUL MODUL\]/gs,
          `# ${data.judul}`,
        )

        // Pola 6: Judul: [JUDUL MODUL]
        .replace(/Judul:\s*\[JUDUL MODUL\]/g, `Judul: ${data.judul}`)

        // Pola 7: Judul Modul: [JUDUL MODUL]
        .replace(
          /Judul Modul:\s*\[JUDUL MODUL\]/g,
          `Judul Modul: ${data.judul}`,
        )

        // Pola 8: Dalam konteks tabel - | [JUDUL MODUL] |
        .replace(/\|\s*\[JUDUL MODUL\]\s*\|/g, `| ${data.judul} |`)

        // Pola 9: [JUDUL MODUL] di tengah kalimat
        .replace(/(\s)\[JUDUL MODUL\](\s)/g, `$1${data.judul}$2`)

        // Ganti fase dengan berbagai pola
        .replace(/\(GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS\)/g, data.fase)
        .replace(/GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS/g, data.fase)
        .replace(
          /Fase.*\(GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS\)/g,
          `Fase ${data.fase}`,
        )
        .replace(/\[fase\]/g, data.fase)
        .replace(/Fase \[fase\]/g, `Fase ${data.fase}`)

        // Ganti placeholder lainnya
        .replace(/\[materi\]/g, data.materi)
        .replace(/\[mapel\]/g, data.mapel)
        .replace(/\[kelas\]/g, data.kelas)
        .replace(/\[semester\]/g, getValue(prompt, "Semester") || "Ganjil")
        .replace(
          /\[tahunPelajaran\]/g,
          getValue(prompt, "Tahun Pelajaran") || "2025/2026",
        )
        .replace(/\[namaGuru\]/g, getValue(prompt, "Nama Penyusun") || "Guru")
        .replace(
          /\[institusi\]/g,
          getValue(prompt, "Satuan Pendidikan") || "Satuan Pendidikan",
        )
        .replace(
          /\[durasi\]/g,
          getValue(prompt, "Alokasi Waktu") || "2 JP (90 menit)",
        )
        .replace(
          /\[model\]/g,
          getValue(prompt, "Model Pembelajaran") || "Problem Based Learning",
        );

      // Lakukan pemeriksaan ulang untuk memastikan tidak ada [JUDUL MODUL] yang tersisa
      if (result.includes("[JUDUL MODUL]")) {
        console.warn(
          "⚠️ Masih ada [JUDUL MODUL] yang tersisa, lakukan penggantian paksa",
        );
        result = result.replace(/\[JUDUL MODUL\]/g, data.judul);
      }

      return result;
    };

    // Helper function to get value
    const getValue = (text: string, key: string): string => {
      const regex = new RegExp(`- ${key}: ([^\\n]+)`, "i");
      const match = text.match(regex);
      if (match) return match[1].trim();

      const regex2 = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, "i");
      const match2 = text.match(regex2);
      return match2 ? match2[1] : "";
    };

    // Create a more explicit prompt with direct replacements
    const directPrompt = replacePlaceholders(prompt);

    const systemPrompt =
      kurikulum === "Kurikulum Merdeka"
        ? `Anda adalah ahli kurikulum pendidikan Indonesia. 
    Buatkan MODUL AJAR KURIKULUM MERDEKA dalam format teks lengkap dengan SEMUA KOMPONEN DALAM BENTUK TABEL.
    
    DATA PENTING YANG HARUS DIGUNAKAN:
    - JUDUL MODUL: "${data.judul}" (GUNAKAN INI SEBAGAI JUDUL UTAMA)
    - FASE: "${data.fase}" (GUNAKAN INI DI SEMUA TEMPAT YANG MEMERLUKAN FASE)
    - KELAS: "${data.kelas}" (GUNAKAN INI DI SEMUA TEMPAT YANG MEMERLUKAN KELAS)
    - MATERI: "${data.materi}" (GUNAKAN INI DI SEMUA BAGIAN YANG RELEVAN)
    - MATA PELAJARAN: "${data.mapel}" (GUNAKAN INI DI SEMUA BAGIAN YANG RELEVAN)
    
    FORMAT OUTPUT HARUS SEPERTI INI:
    
    # ${data.judul}
    
    ## A. INFORMASI UMUM
    
    ### 1. Identitas Modul
    | Komponen | Isi |
    |----------|-----|
    | Satuan Pendidikan | ${getValue(prompt, "Satuan Pendidikan")}
    | Mata Pelajaran | ${data.mapel}
    | Kelas / Fase | ${data.kelas} / ${data.fase}
    | Semester | ${getValue(prompt, "Semester")}
    | Tahun Pelajaran | ${getValue(prompt, "Tahun Pelajaran")}
    | Alokasi Waktu | ${getValue(prompt, "Alokasi Waktu")}
    | Penyusun | ${getValue(prompt, "Nama Penyusun")}
    
    ### 2. Kompetensi Awal
    | Kompetensi Awal | Deskripsi |
    |-----------------|-----------|
    | Pengetahuan Prasyarat | Peserta didik telah memahami konsep dasar terkait ${data.materi} |
    | Keterampilan Prasyarat | Peserta didik mampu melakukan operasi dasar yang relevan dengan ${data.materi} |
    | Sikap Prasyarat | Peserta didik menunjukkan sikap kritis dan rasa ingin tahu |
    
    ### 3. Profil Pelajar Pancasila
    | Dimensi | Deskripsi Pengembangan |
    |---------|------------------------|
    | [Dimensi 1] | [Deskripsi] |
    | [Dimensi 2] | [Deskripsi] |
    | [Dimensi 3] | [Deskripsi] |
    
    ### 4. Sarana dan Prasarana
    | Jenis Sarana | Keterangan |
    |--------------|------------|
    | Media Pembelajaran | LCD Proyektor, Presentasi Digital, Video Pembelajaran |
    | Alat Pembelajaran | Buku Teks ${data.mapel}, LKPD, Alat Peraga |
    | Sumber Belajar | Modul Ajar, Buku Referensi, Sumber Online Terpercaya |
    | Lingkungan Belajar | Ruang kelas yang kondusif, Laboratorium (jika diperlukan) |
    
    ### 5. Target Peserta Didik
    | Karakteristik | Deskripsi |
    |---------------|-----------|
    | Jenis Peserta Didik | Reguler |
    | Jumlah Peserta Didik | 30-35 siswa |
    | Kebutuhan Khusus | Tidak ada |
    
    ### 6. Model Pembelajaran
    | Komponen | Isi |
    |----------|-----|
    | Model Utama | ${getValue(prompt, "Model Pembelajaran")}
    | Pendekatan | Saintifik |
    | Strategi | Eksplorasi, Elaborasi, Konfirmasi |
    | Metode | Diskusi Kelompok, Demonstrasi, Praktikum |
    | Teknik | Tanya Jawab, Pemberian Tugas, Penugasan Kelompok |
    
    ## B. KOMPONEN INTI
    
    ### 7. Capaian Pembelajaran (CP)
    | Elemen | Capaian Pembelajaran |
    |--------|---------------------|
    | Fase | ${data.fase}
    | Elemen | [elemen capaian] |
    | CP Pengetahuan | Memahami konsep ${data.materi} dan penerapannya |
    | CP Keterampilan | Menerapkan konsep ${data.materi} dalam pemecahan masalah |
    
    ### 8. Tujuan Pembelajaran (TP)
    | No | Tujuan Pembelajaran |
    |----|---------------------|
    | 1 | Peserta didik mampu menjelaskan konsep dasar ${data.materi} dengan tepat |
    | 2 | Peserta didik mampu menerapkan rumus ${data.materi} dalam soal latihan |
    | 3 | Peserta didik mampu menganalisis penerapan ${data.materi} dalam kehidupan sehari-hari |
    | 4 | Peserta didik mampu menyelesaikan masalah terkait ${data.materi} dengan langkah yang sistematis |
    | 5 | Peserta didik mampu mengkomunikasikan hasil pemecahan masalah ${data.materi} dengan jelas |
    
    ### 9. Pemahaman Bermakna
    | Aspek | Pemahaman Bermakna |
    |--------|-------------------|
    | Konsep | ${data.materi} merupakan konsep fundamental dalam ${data.mapel} yang menjadi dasar untuk pembelajaran lebih lanjut |
    | Relevansi | Konsep ${data.materi} sangat relevan dengan kehidupan sehari-hari, terutama dalam konteks [konteks relevan] |
    | Aplikasi | Pemahaman ${data.materi} memungkinkan peserta didik untuk memecahkan masalah nyata dalam berbagai situasi |
    
    ### 10. Pertanyaan Pemantik
    | No | Pertanyaan Pemantik |
    |----|-------------------|
    | 1 | Mengapa kita perlu mempelajari konsep ${data.materi}? |
    | 2 | Di mana kita bisa menemukan penerapan ${data.materi} dalam kehidupan sehari-hari? |
    | 3 | Bagaimana cara menentukan [aspek penting dari materi] jika diketahui [data terkait]? |
    | 4 | Apa yang terjadi jika kita menerapkan [konsep] secara tidak tepat? |
    | 5 | Bagaimana cara menghubungkan konsep ${data.materi} dengan pembelajaran sebelumnya? |
    
    ### 11. Kegiatan Pembelajaran
    
    #### a. Pendahuluan
    | Waktu | Kegiatan | Tujuan |
    |-------|----------|--------|
    | 5 menit | Guru membuka pembelajaran dengan salam dan doa | Menciptakan suasana pembelajaran yang kondusif |
    | 5 menit | Apersepsi melalui tanya jawab tentang pengalaman siswa terkait ${data.materi} | Mengaktifkan pengetahuan awal siswa |
    | 5 menit | Penyampaian tujuan pembelajaran dan kegiatan yang akan dilakukan | Memberikan gambaran jelas tentang pembelajaran |
    
    #### b. Kegiatan Inti
    | Waktu | Kegiatan | Tujuan |
    |-------|----------|--------|
    | 15 menit | Eksplorasi konsep ${data.materi} melalui sumber belajar yang disediakan | Peserta didik memahami konsep dasar ${data.materi} |
    | 20 menit | Diskusi kelompok untuk menganalisis penerapan ${data.materi} dalam kasus nyata | Peserta didik mengembangkan pemahaman konsep melalui kolaborasi |
    | 15 menit | Presentasi hasil diskusi dan tanya jawab | Peserta didik mengkomunikasikan pemahaman dan memperdalam konsep |
    | 10 menit | Praktik penerapan konsep ${data.materi} melalui LKPD | Peserta didik melatih keterampilan penerapan konsep |
    
    #### c. Penutup
    | Waktu | Kegiatan | Tujuan |
    |-------|----------|--------|
    | 5 menit | Refleksi pembelajaran oleh siswa | Peserta didik menyadari proses dan hasil pembelajaran |
    | 5 menit | Penyimpulan materi oleh guru | Memastikan pemahaman konsep yang tepat |
    | 5 menit | Evaluasi formatif melalui kuis singkat | Mengukur pencapaian tujuan pembelajaran |
    
    ### 12. Asesmen
    
    #### a. Asesmen Formatif
    | Jenis Asesmen | Teknik | Instrumen | Waktu |
    |---------------|--------|-----------|-------|
    | Observasi | Pengamatan partisipasi | Lembar Observasi | Selama pembelajaran |
    | Tanya Jawab | Lisan | Daftar Pertanyaan | Selama pembelajaran |
    | Kuis Singkat | Tes Tertulis | Soal Pilihan Ganda | 10 menit |
    | LKPD | Penilaian Kerja | Lembar Kerja | 15 menit |
    
    #### b. Asesmen Sumatif
    | Jenis Asesmen | Teknik | Instrumen | Waktu |
    |---------------|--------|-----------|-------|
    | Tes Tertulis | Tes Uraian | Soal Uraian | 30 menit |
    | Proyek | Penilaian Proyek | Rubrik Proyek | 1 minggu |
    
    ### 13. Kriteria Ketercapaian Tujuan Pembelajaran
    | Aspek | Kriteria | Indikator Pencapaian |
    |-------|----------|---------------------|
    | Pengetahuan | Memahami konsep ${data.materi} | Peserta didik mampu menjelaskan konsep dengan benar |
    | Keterampilan | Menerapkan konsep ${data.materi} | Peserta didik mampu menyelesaikan soal dengan tepat |
    | Sikap | Menunjukkan sikap ilmiah | Peserta didik aktif berpartisipasi dan bertanya |
    
    ### 14. Refleksi Guru dan Peserta Didik
    | Komponen | Pertanyaan Refleksi |
    |----------|-------------------|
    | Refleksi Guru | Apa strategi yang paling efektif dalam pembelajaran hari ini? |
    | Refleksi Guru | Bagaimana cara meningkatkan pemahaman siswa tentang konsep yang sulit? |
    | Refleksi Peserta Didik | Konsep apa yang paling kamu pahami hari ini? |
    | Refleksi Peserta Didik | Bagian mana dari pembelajaran yang paling menantang bagimu? |
    
    ## C. LAMPIRAN
    
    ### 15. Lembar Kerja Peserta Didik (LKPD)
    | Komponen | Isi |
    |----------|-----|
    | Judul Aktivitas | Eksplorasi Konsep ${data.materi} |
    | Tujuan | Memahami penerapan ${data.materi} dalam konteks nyata |
    | Petunjuk Pengerjaan | 1. Baca kasus yang diberikan 2. Diskusikan dengan kelompok 3. Tulis hasil analisis |
    | Soal/Instruksi | Analisis kasus [kasus terkait materi] menggunakan konsep ${data.materi} |
    | Waktu Pengerjaan | 20 menit |
    
    ### 16. Bahan Bacaan
    | Jenis | Sumber | Keterangan |
    |-------|--------|------------|
    | Untuk Peserta Didik | Buku Teks ${data.mapel} Kelas ${data.kelas} | Bab tentang ${data.materi} |
    | Untuk Peserta Didik | Video Pembelajaran ${data.materi} | Durasi 10 menit |
    | Untuk Guru | Modul Ajar ${data.mapel} | Panduan pembelajaran ${data.materi} |
    | Untuk Guru | Jurnal Pendidikan ${data.mapel} | Artikel tentang strategi pembelajaran ${data.materi} |
    
    ### 17. Glosarium
    | Istilah | Definisi |
    |---------|----------|
    | ${data.materi.split(" ")[0] || "Konsep Utama"} | Penjelasan tentang konsep utama yang dipelajari |
    | Variabel | Simbol yang mewakili nilai yang dapat berubah |
    | Persamaan | Pernyataan matematika yang menunjukkan kesetaraan dua ekspresi |
    | Solusi | Nilai atau himpunan nilai yang memenuhi persamaan |
    | Aplikasi | Penerapan konsep matematika dalam situasi nyata |
    
    ### 18. Daftar Pustaka
    | No | Sumber | Jenis | Tahun |
    |----|--------|-------|-------|
    | 1 | Buku Teks ${data.mapel} Kelas ${data.kelas} | Buku Teks | 2022 |
    | 2 | Modul Ajar Kurikulum Merdeka ${data.mapel} | Modul Ajar | 2022 |
    | 3 | Panduan Pembelajaran ${data.mapel} | Panduan | 2023 |
    | 4 | Website resmi Kemendikbudristek | Sumber Online | 2025 |
    
    ---
    *Modul ini disusun sesuai Kurikulum Merdeka dan Permendikdasmen No. 13 Tahun 2025*
    
    **INSTRUKSI KRUSIAL:**
    1. JUDUL MODUL HARUS PERSIS: "${data.judul}" - TULIS DI BAGIAN PALING ATAS
    2. PADA BAGIAN "Kelas / Fase", gunakan format: ${data.kelas} / ${data.fase}
    3. PADA BAGIAN "Fase" di Capaian Pembelajaran, gunakan "${data.fase}" TANPA MENGUBAHNYA
    4. GUNAKAN MATERI: "${data.materi}" DI SEMUA BAGIAN YANG RELEVAN
    5. GUNAKAN MATA PELAJARAN: "${data.mapel}" DI SEMUA BAGIAN YANG RELEVAN
    6. JANGAN GUNAKAN TEKS "[JUDUL MODUL]" ATAU "(GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS)" - GANTI DENGAN NILAI YANG TELAH DIBERIKAN
    7. Pastikan semua tabel memiliki format markdown yang benar dengan header |---|---|`
        : `Anda adalah ahli kurikulum pendidikan Indonesia. 
    Buatkan MODUL AJAR KURIKULUM 2013 (K13) dalam format teks lengkap dengan SEMUA KOMPONEN DALAM BENTUK TABEL.
    
    DATA PENTING YANG HARUS DIGUNAKAN:
    - JUDUL MODUL: "${data.judul}" (GUNAKAN INI SEBAGAI JUDUL UTAMA)
    - KELAS: "${data.kelas}" (GUNAKAN INI DI SEMUA TEMPAT YANG MEMERLUKAN KELAS)
    - MATERI: "${data.materi}" (GUNAKAN INI DI SEMUA BAGIAN YANG RELEVAN)
    - MATA PELAJARAN: "${data.mapel}" (GUNAKAN INI DI SEMUA BAGIAN YANG RELEVAN)
    
    FORMAT OUTPUT HARUS SEPERTI INI:
    
    # ${data.judul}
    
    ## A. IDENTITAS
    
    ### 1. Identitas Modul
    | Komponen | Isi |
    |----------|-----|
    | Satuan Pendidikan | ${getValue(prompt, "Satuan Pendidikan")}
    | Mata Pelajaran | ${data.mapel}
    | Kelas | ${data.kelas}
    | Semester | ${getValue(prompt, "Semester")}
    | Tahun Pelajaran | ${getValue(prompt, "Tahun Pelajaran")}
    | Alokasi Waktu | ${getValue(prompt, "Alokasi Waktu")}
    | Penyusun | ${getValue(prompt, "Nama Penyusun")}
    
    ### 2. Kompetensi Inti (KI)
    | KI | Kompetensi Inti |
    |----|----------------|
    | KI-1 | Menghargai dan menghayati ajaran agama yang dianutnya |
    | KI-2 | Menghargai dan menghayati perilaku jujur, disiplin, tanggung jawab, peduli (gotong royong, kerjasama, toleran, damai), santun, responsif dan pro-aktif dan menunjukkan sikap sebagai bagian dari solusi atas berbagai permasalahan dalam berinteraksi secara efektif dengan lingkungan sosial dan alam serta dalam menempatkan diri sebagai cerminan bangsa dalam pergaulan dunia |
    | KI-3 | Memahami, menerapkan, menganalisis pengetahuan faktual, konseptual, prosedural berdasarkan rasa ingin tahunya tentang ilmu pengetahuan, teknologi, seni, budaya terkait fenomena dan kejadian tampak mata |
    | KI-4 | Mengolah, menalar, menyaji, dan mencipta dalam ranah konkret dan ranah abstrak terkait dengan pengembangan dari yang dipelajarinya di sekolah secara mandiri serta bertindak secara efektif dan kreatif, dan mampu menggunakan metoda sesuai kaidah keilmuan |
    
    ### 3. Kompetensi Dasar (KD)
    | No | Kompetensi Dasar |
    |----|-----------------|
    | 1 | 3.1 Menerapkan konsep ${data.materi} dalam pemecahan masalah |
    | 2 | 3.2 Menganalisis hubungan ${data.materi} dengan kehidupan sehari-hari |
    | 3 | 4.1 Menyelesaikan soal terkait ${data.materi} dengan metode yang tepat |
    | 4 | 4.2 Membuat laporan hasil praktikum ${data.materi} |
    
    ### 4. Indikator Pencapaian Kompetensi
    | No | Indikator |
    |----|-----------|
    | 1 | Menjelaskan konsep dasar ${data.materi} dengan benar |
    | 2 | Menerapkan rumus ${data.materi} dalam soal |
    | 3 | Menganalisis penerapan ${data.materi} dalam kasus nyata |
    | 4 | Menyajikan hasil analisis secara sistematis |
    
    ### 5. Tujuan Pembelajaran
    | No | Tujuan Pembelajaran |
    |----|---------------------|
    | 1 | Peserta didik mampu menjelaskan konsep ${data.materi} dengan tepat |
    | 2 | Peserta didik mampu menerapkan konsep ${data.materi} dalam soal latihan |
    | 3 | Peserta didik mampu menganalisis penerapan ${data.materi} |
    | 4 | Peserta didik mampu menyajikan hasil pembelajaran |
    
    ## B. KEGIATAN PEMBELAJARAN
    
    ### 1. Kegiatan Pendahuluan
    | Waktu | Kegiatan | Metode |
    |-------|----------|--------|
    | 10 menit | Guru menyapa, memeriksa kehadiran, dan mengondisikan kelas | Ceramah |
    | 10 menit | Apersepsi: mengingat kembali materi sebelumnya terkait ${data.materi} | Tanya jawab |
    | 5 menit | Menyampaikan tujuan pembelajaran | Ekspositori |
    
    ### 2. Kegiatan Inti
    | Waktu | Kegiatan | Metode |
    |-------|----------|--------|
    | 20 menit | Eksplorasi konsep ${data.materi} melalui penjelasan guru | Ceramah interaktif |
    | 25 menit | Diskusi kelompok tentang penerapan ${data.materi} | Kooperatif |
    | 20 menit | Praktik penerapan konsep ${data.materi} | Praktikum |
    | 10 menit | Presentasi hasil diskusi kelompok | Presentasi |
    
    ### 3. Kegiatan Penutup
    | Waktu | Kegiatan | Metode |
    |-------|----------|--------|
    | 10 menit | Guru bersama siswa membuat kesimpulan | Diskusi kelas |
    | 5 menit | Memberikan tes formatif untuk mengukur pemahaman | Tes tertulis |
    | 5 menit | Memberikan tugas rumah dan informasi pertemuan berikutnya | Penugasan |
    
    ## C. PENILAIAN
    
    ### 1. Teknik Penilaian
    | Jenis | Teknik | Instrumen |
    |-------|--------|-----------|
    | Sikap | Observasi | Lembar Observasi Sikap |
    | Pengetahuan | Tes Tertulis | Soal Uraian dan Pilihan Ganda |
    | Keterampilan | Praktik | Rubrik Penilaian Praktik |
    
    ### 2. Kriteria Ketuntasan Minimal (KKM)
    | Komponen | KKM |
    |----------|-----|
    | Pengetahuan | 75 |
    | Keterampilan | 75 |
    | Sikap | Baik |
    
    ### 3. Remidial dan Pengayaan
    | Kegiatan | Target |
    |----------|--------|
    | Remidial | Peserta didik yang belum mencapai KKM diberikan bimbingan tambahan |
    | Pengayaan | Peserta didik yang mencapai KKM diberikan tugas pengayaan |
    
    ## D. MEDIA DAN SUMBER BELAJAR
    
    ### 1. Media Pembelajaran
    | Jenis Media | Keterangan |
    |-------------|------------|
    | Media Visual | Papan tulis, spidol, LCD proyektor |
    | Media Audio | Speaker untuk penjelasan audio |
    | Media Interaktif | Presentasi PowerPoint, video pembelajaran |
    
    ### 2. Sumber Belajar
    | Jenis Sumber | Keterangan |
    |--------------|------------|
    | Buku Teks | Buku ${data.mapel} Kelas ${data.kelas} Kurikulum 2013 |
    | Buku Referensi | Buku panduan ${data.materi} tingkat lanjut |
    | Sumber Internet | Website pembelajaran ${data.mapel} terpercaya |
    | Lingkungan | Objek nyata terkait ${data.materi} di sekitar |
    
    ## E. LAMPIRAN
    
    ### 1. LKS (Lembar Kerja Siswa)
    | Komponen | Isi |
    |----------|-----|
    | Judul | Praktikum ${data.materi} |
    | Tujuan | Menerapkan konsep ${data.materi} dalam praktikum |
    | Petunjuk | Ikuti langkah-langkah praktikum dengan teliti |
    | Soal | Jawablah pertanyaan berdasarkan hasil praktikum |
    
    ### 2. Kunci Jawaban
    | No | Jawaban |
    |----|---------|
    | 1 | [Jawaban soal nomor 1] |
    | 2 | [Jawaban soal nomor 2] |
    | 3 | [Jawaban soal nomor 3] |
    | 4 | [Jawaban soal nomor 4] |
    
    ### 3. Daftar Pustaka
    | No | Sumber |
    |----|--------|
    | 1 | Buku ${data.mapel} Kelas ${data.kelas} Kurikulum 2013 |
    | 2 | Panduan Pembelajaran ${data.mapel} |
    | 3 | Jurnal Pendidikan ${data.mapel} Terkini |
    
    ---
    *Modul ini disusun sesuai Kurikulum 2013 dan Permendikbud No. 22 Tahun 2016*
    
    **INSTRUKSI KRUSIAL:**
    1. JUDUL MODUL HARUS PERSIS: "${data.judul}" - TULIS DI BAGIAN PALING ATAS
    2. GUNAKAN KELAS: "${data.kelas}" DI SEMUA TEMPAT YANG MEMERLUKAN KELAS
    3. GUNAKAN MATERI: "${data.materi}" DI SEMUA BAGIAN YANG RELEVAN
    4. GUNAKAN MATA PELAJARAN: "${data.mapel}" DI SEMUA BAGIAN YANG RELEVAN
    5. JANGAN GUNAKAN TEKS "[JUDUL MODUL]" - GANTI DENGAN NILAI YANG TELAH DIBERIKAN
    6. Pastikan semua tabel memiliki format markdown yang benar dengan header |---|---|`;

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
    result = replacePlaceholders(result);

    // Tambahkan pemeriksaan khusus untuk judul
    if (result.includes("[JUDUL MODUL]")) {
      console.warn(
        "⚠️ [JUDUL MODUL] masih ditemukan setelah post-processing, lakukan penggantian final",
      );
      result = result.replace(/\[JUDUL MODUL\]/g, data.judul);
    }

    console.log("📄 Setelah post-processing:", result.substring(0, 200));

    if (!result || result.trim().length < 1000) {
      console.warn("⚠️ Hasil terlalu pendek, gunakan fallback");
      return generateFallbackModule(directPrompt, kurikulum);
    }

    // Pastikan output sudah dalam format yang benar
    if (!result.includes("# ") || !result.includes("|")) {
      console.warn("⚠️ Format tidak sesuai, coba lagi");
      return await tryAlternativeModel(directPrompt, kurikulum);
    }

    return result;
  } catch (error: any) {
    console.error("❌ Error Groq API:", error.message);
    return generateFallbackModule(prompt, kurikulum);
  }
}

async function tryAlternativeModel(
  prompt: string,
  kurikulum: string,
): Promise<string> {
  console.log("🔄 Mencoba model alternatif: mixtral-8x7b-32768");

  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });

    // Extract data for replacement
    const extractData = (text: string) => {
      const getValue = (key: string): string => {
        const patterns = [
          new RegExp(`- ${key}: ([^\\n]+)`, "i"),
          new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, "i"),
          new RegExp(`${key}: ([^\\n]+)`, "i"),
        ];

        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) return match[1].trim();
        }
        return "";
      };

      // Khusus untuk fase, kita perlu membersihkan dari teks tambahan
      let faseValue = getValue("Fase") || "";
      faseValue = faseValue
        .replace(/\s*\(GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS\)\s*/g, "")
        .trim();

      return {
        judul: getValue("JUDUL MODUL") || getValue("judul") || "",
        fase: faseValue,
        kelas: getValue("Kelas") || "",
        materi: getValue("Materi Pokok") || getValue("materi") || "",
        mapel: getValue("Mata Pelajaran") || getValue("mapel") || "",
      };
    };

    const data = extractData(prompt);

    // Fungsi untuk mengganti semua placeholder secara konsisten
    const replacePlaceholders = (text: string): string => {
      // Ganti judul modul dengan berbagai pola - urutan dari yang paling spesifik ke umum
      let result = text
        // Pola 1: [JUDUL MODUL] standalone
        .replace(/\[JUDUL MODUL\]/g, data.judul)

        // Pola 2: JUDUL MODUL: [JUDUL MODUL]
        .replace(
          /JUDUL MODUL:\s*\[JUDUL MODUL\]/g,
          `JUDUL MODUL: ${data.judul}`,
        )

        // Pola 3: # [JUDUL MODUL]
        .replace(/^#\s*\[JUDUL MODUL\]/gm, `# ${data.judul}`)

        // Pola 4: ## [JUDUL MODUL]
        .replace(/^##\s*\[JUDUL MODUL\]/gm, `## ${data.judul}`)

        // Pola 5: # MODUL AJAR... diikuti # [JUDUL MODUL]
        .replace(
          /#\s*MODUL AJAR[^\n]*\n#\s*\[JUDUL MODUL\]/gs,
          `# ${data.judul}`,
        )

        // Pola 6: Judul: [JUDUL MODUL]
        .replace(/Judul:\s*\[JUDUL MODUL\]/g, `Judul: ${data.judul}`)

        // Pola 7: Judul Modul: [JUDUL MODUL]
        .replace(
          /Judul Modul:\s*\[JUDUL MODUL\]/g,
          `Judul Modul: ${data.judul}`,
        )

        // Pola 8: Dalam konteks tabel - | [JUDUL MODUL] |
        .replace(/\|\s*\[JUDUL MODUL\]\s*\|/g, `| ${data.judul} |`)

        // Pola 9: [JUDUL MODUL] di tengah kalimat
        .replace(/(\s)\[JUDUL MODUL\](\s)/g, `$1${data.judul}$2`)

        // Ganti fase dengan berbagai pola
        .replace(/\(GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS\)/g, data.fase)
        .replace(/GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS/g, data.fase)
        .replace(
          /Fase.*\(GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS\)/g,
          `Fase ${data.fase}`,
        )
        .replace(/\[fase\]/g, data.fase)
        .replace(/Fase \[fase\]/g, `Fase ${data.fase}`)

        // Ganti placeholder lainnya
        .replace(/\[materi\]/g, data.materi)
        .replace(/\[mapel\]/g, data.mapel)
        .replace(/\[kelas\]/g, data.kelas);

      // Lakukan pemeriksaan ulang untuk memastikan tidak ada [JUDUL MODUL] yang tersisa
      if (result.includes("[JUDUL MODUL]")) {
        console.warn(
          "⚠️ Masih ada [JUDUL MODUL] yang tersisa, lakukan penggantian paksa",
        );
        result = result.replace(/\[JUDUL MODUL\]/g, data.judul);
      }

      return result;
    };

    // Create a more explicit prompt with direct replacements
    const directPrompt = replacePlaceholders(prompt);

    const systemPrompt =
      kurikulum === "Kurikulum Merdeka"
        ? `Buatkan MODUL AJAR KURIKULUM MERDEKA dalam format teks lengkap dengan SEMUA KOMPONEN DALAM BENTUK TABEL.
      Gunakan semua data dari pengguna. Format harus termasuk:
      1. # ${data.judul}
      2. ## A. INFORMASI UMUM (semua komponen dalam tabel)
      3. ## B. KOMPONEN INTI (semua komponen dalam tabel)
      4. ## C. LAMPIRAN (semua komponen dalam tabel)
      
      PENTING: 
      - JUDUL MODUL HARUS: "${data.judul}"
      - Pada bagian "Kelas / Fase", gunakan format: ${data.kelas} / ${data.fase}
      - Pada bagian "Fase" di Capaian Pembelajaran, gunakan "${data.fase}"
      - GUNAKAN MATERI: "${data.materi}" DI SEMUA BAGIAN YANG RELEVAN
      - JANGAN GUNAKAN TEKS "(GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS)"`
        : `Buatkan MODUL AJAR KURIKULUM 2013 dalam format teks lengkap dengan SEMUA KOMPONEN DALAM BENTUK TABEL.
      Gunakan semua data dari pengguna. Format harus termasuk:
      1. # ${data.judul}
      2. ## A. IDENTITAS (semua komponen dalam tabel)
      3. ## B. KOMPETENSI INTI DAN KOMPETENSI DASAR (semua komponen dalam tabel)
      4. ## C. KEGIATAN PEMBELAJARAN (semua komponen dalam tabel)
      5. ## D. PENILAIAN (semua komponen dalam tabel)
      6. ## E. MEDIA DAN SUMBER BELAJAR (semua komponen dalam tabel)
      
      PENTING: 
      - JUDUL MODUL HARUS: "${data.judul}"
      - GUNAKAN MATERI: "${data.materi}" DI SEMUA BAGIAN YANG RELEVAN`;

    const completion = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
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
      max_tokens: 7000,
      top_p: 0.9,
    });

    let result = completion.choices[0]?.message?.content ?? "";

    // Lakukan post-processing yang lebih agresif
    result = replacePlaceholders(result);

    // Tambahkan pemeriksaan khusus untuk judul
    if (result.includes("[JUDUL MODUL]")) {
      console.warn(
        "⚠️ [JUDUL MODUL] masih ditemukan di model alternatif, lakukan penggantian final",
      );
      result = result.replace(/\[JUDUL MODUL\]/g, data.judul);
    }

    if (result && result.length > 1000 && result.includes("|")) {
      return result;
    }

    return generateFallbackModule(directPrompt, kurikulum);
  } catch (error: any) {
    console.error("❌ Model alternatif juga gagal:", error.message);
    return generateFallbackModule(prompt, kurikulum);
  }
}

function generateFallbackModule(prompt: string, kurikulum: string): string {
  console.log("📝 Membuat modul fallback untuk kurikulum:", kurikulum);

  // Extract info from prompt
  const getValue = (text: string, key: string): string => {
    const regex = new RegExp(`- ${key}: ([^\\n]+)`, "i");
    const match = text.match(regex);
    if (match) return match[1].trim();

    const regex2 = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, "i");
    const match2 = text.match(regex2);
    return match2 ? match2[1] : `[${key}]`;
  };

  // Khusus untuk fase, kita perlu membersihkan dari teks tambahan
  let faseValue = getValue(prompt, "Fase") || "Fase D";
  faseValue = faseValue
    .replace(/\s*\(GUNAKAN FASE INI TEPAT SEPERTI YANG TERTULIS\)\s*/g, "")
    .trim();

  const judul =
    getValue(prompt, "JUDUL MODUL") ||
    getValue(prompt, "judul") ||
    "Judul Modul";
  const namaGuru = getValue(prompt, "Nama Penyusun") || "Guru";
  const institusi =
    getValue(prompt, "Satuan Pendidikan") || "Satuan Pendidikan";
  const mapel = getValue(prompt, "Mata Pelajaran") || "Mata Pelajaran";
  const kelas = getValue(prompt, "Kelas") || "Kelas";
  const fase = faseValue;
  const materi = getValue(prompt, "Materi Pokok") || "Materi Pokok";
  const tahunPelajaran = getValue(prompt, "Tahun Pelajaran") || "2025/2026";
  const semester = getValue(prompt, "Semester") || "Ganjil";
  const durasi = getValue(prompt, "Alokasi Waktu") || "2 JP (90 menit)";
  const model =
    getValue(prompt, "Model Pembelajaran") || "Problem Based Learning";

  if (kurikulum === "Kurikulum Merdeka") {
    return `
# ${judul}

## A. INFORMASI UMUM

### 1. Identitas Modul
| Komponen | Isi |
|----------|-----|
| Satuan Pendidikan | ${institusi} |
| Mata Pelajaran | ${mapel} |
| Kelas / Fase | ${kelas} / ${fase} |
| Semester | ${semester} |
| Tahun Pelajaran | ${tahunPelajaran} |
| Alokasi Waktu | ${durasi} |
| Penyusun | ${namaGuru} |

### 2. Kompetensi Awal
| Kompetensi Awal | Deskripsi |
|-----------------|-----------|
| Pengetahuan Prasyarat | Peserta didik telah memahami konsep dasar terkait ${materi} |
| Keterampilan Prasyarat | Peserta didik mampu melakukan operasi dasar yang relevan dengan ${materi} |
| Sikap Prasyarat | Peserta didik menunjukkan sikap kritis dan rasa ingin tahu |

### 3. Profil Pelajar Pancasila
| Dimensi | Deskripsi Pengembangan |
|---------|------------------------|
| Bernalar Kritis | Mengembangkan kemampuan berpikir logis dan sistematis dalam memecahkan masalah ${materi} |
| Kreatif | Mendorong peserta didik untuk menemukan solusi baru dan inovatif terkait ${materi} |
| Bergotong Royong | Membangun kemampuan kolaborasi dalam diskusi dan proyek kelompok |

### 4. Sarana dan Prasarana
| Jenis Sarana | Keterangan |
|--------------|------------|
| Media Pembelajaran | LCD Proyektor, Presentasi Digital, Video Pembelajaran |
| Alat Pembelajaran | Buku Teks ${mapel}, LKPD, Alat Peraga |
| Sumber Belajar | Modul Ajar, Buku Referensi, Sumber Online Terpercaya |
| Lingkungan Belajar | Ruang kelas yang kondusif, Laboratorium (jika diperlukan) |

### 5. Target Peserta Didik
| Karakteristik | Deskripsi |
|---------------|-----------|
| Jenis Peserta Didik | Reguler |
| Jumlah Peserta Didik | 30-35 siswa |
| Kebutuhan Khusus | Tidak ada |

### 6. Model Pembelajaran
| Komponen | Isi |
|----------|-----|
| Model Utama | ${model} |
| Pendekatan | Saintifik |
| Strategi | Eksplorasi, Elaborasi, Konfirmasi |
| Metode | Diskusi Kelompok, Demonstrasi, Praktikum |
| Teknik | Tanya Jawab, Pemberian Tugas, Penugasan Kelompok |

## B. KOMPONEN INTI

### 7. Capaian Pembelajaran (CP)
| Elemen | Capaian Pembelajaran |
|--------|---------------------|
| Fase | ${fase} |
| Elemen | Bilangan dan Operasi Hitung |
| CP Pengetahuan | Memahami konsep ${materi} dan penerapannya |
| CP Keterampilan | Menerapkan konsep ${materi} dalam pemecahan masalah |

### 8. Tujuan Pembelajaran (TP)
| No | Tujuan Pembelajaran |
|----|---------------------|
| 1 | Peserta didik mampu menjelaskan konsep dasar ${materi} dengan tepat |
| 2 | Peserta didik mampu menerapkan rumus ${materi} dalam soal latihan |
| 3 | Peserta didik mampu menganalisis penerapan ${materi} dalam kehidupan sehari-hari |
| 4 | Peserta didik mampu menyelesaikan masalah terkait ${materi} dengan langkah yang sistematis |
| 5 | Peserta didik mampu mengkomunikasikan hasil pemecahan masalah ${materi} dengan jelas |

### 9. Pemahaman Bermakna
| Aspek | Pemahaman Bermakna |
|--------|-------------------|
| Konsep | ${materi} merupakan konsep fundamental dalam ${mapel} yang menjadi dasar untuk pembelajaran lebih lanjut |
| Relevansi | Konsep ${materi} sangat relevan dengan kehidupan sehari-hari, terutama dalam konteks [konteks relevan] |
| Aplikasi | Pemahaman ${materi} memungkinkan peserta didik untuk memecahkan masalah nyata dalam berbagai situasi |

### 10. Pertanyaan Pemantik
| No | Pertanyaan Pemantik |
|----|-------------------|
| 1 | Mengapa kita perlu mempelajari konsep ${materi}? |
| 2 | Di mana kita bisa menemukan penerapan ${materi} dalam kehidupan sehari-hari? |
| 3 | Bagaimana cara menentukan [aspek penting dari materi] jika diketahui [data terkait]? |
| 4 | Apa yang terjadi jika kita menerapkan [konsep] secara tidak tepat? |
| 5 | Bagaimana cara menghubungkan konsep ${materi} dengan pembelajaran sebelumnya? |

### 11. Kegiatan Pembelajaran

#### a. Pendahuluan
| Waktu | Kegiatan | Tujuan |
|-------|----------|--------|
| 5 menit | Guru membuka pembelajaran dengan salam dan doa | Menciptakan suasana pembelajaran yang kondusif |
| 5 menit | Apersepsi melalui tanya jawab tentang pengalaman siswa terkait ${materi} | Mengaktifkan pengetahuan awal siswa |
| 5 menit | Penyampaian tujuan pembelajaran dan kegiatan yang akan dilakukan | Memberikan gambaran jelas tentang pembelajaran |

#### b. Kegiatan Inti
| Waktu | Kegiatan | Tujuan |
|-------|----------|--------|
| 15 menit | Eksplorasi konsep ${materi} melalui sumber belajar yang disediakan | Peserta didik memahami konsep dasar ${materi} |
| 20 menit | Diskusi kelompok untuk menganalisis penerapan ${materi} dalam kasus nyata | Peserta didik mengembangkan pemahaman konsep melalui kolaborasi |
| 15 menit | Presentasi hasil diskusi dan tanya jawab | Peserta didik mengkomunikasikan pemahaman dan memperdalam konsep |
| 10 menit | Praktik penerapan konsep ${materi} melalui LKPD | Peserta didik melatih keterampilan penerapan konsep |

#### c. Penutup
| Waktu | Kegiatan | Tujuan |
|-------|----------|--------|
| 5 menit | Refleksi pembelajaran oleh siswa | Peserta didik menyadari proses dan hasil pembelajaran |
| 5 menit | Penyimpulan materi oleh guru | Memastikan pemahaman konsep yang tepat |
| 5 menit | Evaluasi formatif melalui kuis singkat | Mengukur pencapaian tujuan pembelajaran |

### 12. Asesmen

#### a. Asesmen Formatif
| Jenis Asesmen | Teknik | Instrumen | Waktu |
|---------------|--------|-----------|-------|
| Observasi | Pengamatan partisipasi | Lembar Observasi | Selama pembelajaran |
| Tanya Jawab | Lisan | Daftar Pertanyaan | Selama pembelajaran |
| Kuis Singkat | Tes Tertulis | Soal Pilihan Ganda | 10 menit |
| LKPD | Penilaian Kerja | Lembar Kerja | 15 menit |

#### b. Asesmen Sumatif
| Jenis Asesmen | Teknik | Instrumen | Waktu |
|---------------|--------|-----------|-------|
| Tes Tertulis | Tes Uraian | Soal Uraian | 30 menit |
| Proyek | Penilaian Proyek | Rubrik Proyek | 1 minggu |

### 13. Kriteria Ketercapaian Tujuan Pembelajaran
| Aspek | Kriteria | Indikator Pencapaian |
|-------|----------|---------------------|
| Pengetahuan | Memahami konsep ${materi} | Peserta didik mampu menjelaskan konsep dengan benar |
| Keterampilan | Menerapkan konsep ${materi} | Peserta didik mampu menyelesaikan soal dengan tepat |
| Sikap | Menunjukkan sikap ilmiah | Peserta didik aktif berpartisipasi dan bertanya |

### 14. Refleksi Guru dan Peserta Didik
| Komponen | Pertanyaan Refleksi |
|----------|-------------------|
| Refleksi Guru | Apa strategi yang paling efektif dalam pembelajaran hari ini? |
| Refleksi Guru | Bagaimana cara meningkatkan pemahaman siswa tentang konsep yang sulit? |
| Refleksi Peserta Didik | Konsep apa yang paling kamu pahami hari ini? |
| Refleksi Peserta Didik | Bagian mana dari pembelajaran yang paling menantang bagimu? |

## C. LAMPIRAN

### 15. Lembar Kerja Peserta Didik (LKPD)
| Komponen | Isi |
|----------|-----|
| Judul Aktivitas | Eksplorasi Konsep ${materi} |
| Tujuan | Memahami penerapan ${materi} dalam konteks nyata |
| Petunjuk Pengerjaan | 1. Baca kasus yang diberikan 2. Diskusikan dengan kelompok 3. Tulis hasil analisis |
| Soal/Instruksi | Analisis kasus [kasus terkait materi] menggunakan konsep ${materi} |
| Waktu Pengerjaan | 20 menit |

### 16. Bahan Bacaan
| Jenis | Sumber | Keterangan |
|-------|--------|------------|
| Untuk Peserta Didik | Buku Teks ${mapel} Kelas ${kelas} | Bab tentang ${materi} |
| Untuk Peserta Didik | Video Pembelajaran ${materi} | Durasi 10 menit |
| Untuk Guru | Modul Ajar ${mapel} | Panduan pembelajaran ${materi} |
| Untuk Guru | Jurnal Pendidikan ${mapel} | Artikel tentang strategi pembelajaran ${materi} |

### 17. Glosarium
| Istilah | Definisi |
|---------|----------|
| ${materi.split(" ")[0] || "Konsep Utama"} | Penjelasan tentang konsep utama yang dipelajari |
| Variabel | Simbol yang mewakili nilai yang dapat berubah |
| Persamaan | Pernyataan matematika yang menunjukkan kesetaraan dua ekspresi |
| Solusi | Nilai atau himpunan nilai yang memenuhi persamaan |
| Aplikasi | Penerapan konsep matematika dalam situasi nyata |

### 18. Daftar Pustaka
| No | Sumber | Jenis | Tahun |
|----|--------|-------|-------|
| 1 | Buku Teks ${mapel} Kelas ${kelas} | Buku Teks | 2022 |
| 2 | Modul Ajar Kurikulum Merdeka ${mapel} | Modul Ajar | 2022 |
| 3 | Panduan Pembelajaran ${mapel} | Panduan | 2023 |
| 4 | Website resmi Kemendikbudristek | Sumber Online | 2025 |

---
*Modul ini disusun sesuai Kurikulum Merdeka dan Permendikdasmen No. 13 Tahun 2025*
    `;
  } else {
    // K13 Format
    return `
# ${judul}

## A. IDENTITAS

### 1. Identitas Modul
| Komponen | Isi |
|----------|-----|
| Satuan Pendidikan | ${institusi} |
| Mata Pelajaran | ${mapel} |
| Kelas | ${kelas} |
| Semester | ${semester} |
| Tahun Pelajaran | ${tahunPelajaran} |
| Alokasi Waktu | ${durasi} |
| Penyusun | ${namaGuru} |

### 2. Kompetensi Inti (KI)
| KI | Kompetensi Inti |
|----|----------------|
| KI-1 | Menghargai dan menghayati ajaran agama yang dianutnya |
| KI-2 | Menghargai dan menghayati perilaku jujur, disiplin, tanggung jawab, peduli (gotong royong, kerjasama, toleran, damai), santun, responsif dan pro-aktif dan menunjukkan sikap sebagai bagian dari solusi atas berbagai permasalahan dalam berinteraksi secara efektif dengan lingkungan sosial dan alam serta dalam menempatkan diri sebagai cerminan bangsa dalam pergaulan dunia |
| KI-3 | Memahami, menerapkan, menganalisis pengetahuan faktual, konseptual, prosedural berdasarkan rasa ingin tahunya tentang ilmu pengetahuan, teknologi, seni, budaya terkait fenomena dan kejadian tampak mata |
| KI-4 | Mengolah, menalar, menyaji, dan mencipta dalam ranah konkret dan ranah abstrak terkait dengan pengembangan dari yang dipelajarinya di sekolah secara mandiri serta bertindak secara efektif dan kreatif, dan mampu menggunakan metoda sesuai kaidah keilmuan |

### 3. Kompetensi Dasar (KD)
| No | Kompetensi Dasar |
|----|-----------------|
| 1 | 3.1 Menerapkan konsep ${materi} dalam pemecahan masalah |
| 2 | 3.2 Menganalisis hubungan ${materi} dengan kehidupan sehari-hari |
| 3 | 4.1 Menyelesaikan soal terkait ${materi} dengan metode yang tepat |
| 4 | 4.2 Membuat laporan hasil praktikum ${materi} |

### 4. Indikator Pencapaian Kompetensi
| No | Indikator |
|----|-----------|
| 1 | Menjelaskan konsep dasar ${materi} dengan benar |
| 2 | Menerapkan rumus ${materi} dalam soal |
| 3 | Menganalisis penerapan ${materi} dalam kasus nyata |
| 4 | Menyajikan hasil analisis secara sistematis |

### 5. Tujuan Pembelajaran
| No | Tujuan Pembelajaran |
|----|---------------------|
| 1 | Peserta didik mampu menjelaskan konsep ${materi} dengan tepat |
| 2 | Peserta didik mampu menerapkan konsep ${materi} dalam soal latihan |
| 3 | Peserta didik mampu menganalisis penerapan ${materi} |
| 4 | Peserta didik mampu menyajikan hasil pembelajaran |

## B. KEGIATAN PEMBELAJARAN

### 1. Kegiatan Pendahuluan
| Waktu | Kegiatan | Metode |
|-------|----------|--------|
| 10 menit | Guru menyapa, memeriksa kehadiran, dan mengondisikan kelas | Ceramah |
| 10 menit | Apersepsi: mengingat kembali materi sebelumnya terkait ${materi} | Tanya jawab |
| 5 menit | Menyampaikan tujuan pembelajaran | Ekspositori |

### 2. Kegiatan Inti
| Waktu | Kegiatan | Metode |
|-------|----------|--------|
| 20 menit | Eksplorasi konsep ${materi} melalui penjelasan guru | Ceramah interaktif |
| 25 menit | Diskusi kelompok tentang penerapan ${materi} | Kooperatif |
| 20 menit | Praktik penerapan konsep ${materi} | Praktikum |
| 10 menit | Presentasi hasil diskusi kelompok | Presentasi |

### 3. Kegiatan Penutup
| Waktu | Kegiatan | Metode |
|-------|----------|--------|
| 10 menit | Guru bersama siswa membuat kesimpulan | Diskusi kelas |
| 5 menit | Memberikan tes formatif untuk mengukur pememahaman | Tes tertulis |
| 5 menit | Memberikan tugas rumah dan informasi pertemuan berikutnya | Penugasan |

## C. PENILAIAN

### 1. Teknik Penilaian
| Jenis | Teknik | Instrumen |
|-------|--------|-----------|
| Sikap | Observasi | Lembar Observasi Sikap |
| Pengetahuan | Tes Tertulis | Soal Uraian dan Pilihan Ganda |
| Keterampilan | Praktik | Rubrik Penilaian Praktik |

### 2. Kriteria Ketuntasan Minimal (KKM)
| Komponen | KKM |
|----------|-----|
| Pengetahuan | 75 |
| Keterampilan | 75 |
| Sikap | Baik |

### 3. Remidial dan Pengayaan
| Kegiatan | Target |
|----------|--------|
| Remidial | Peserta didik yang belum mencapai KKM diberikan bimbingan tambahan |
| Pengayaan | Peserta didik yang mencapai KKM diberikan tugas pengayaan |

## D. MEDIA DAN SUMBER BELAJAR

### 1. Media Pembelajaran
| Jenis Media | Keterangan |
|-------------|------------|
| Media Visual | Papan tulis, spidol, LCD proyektor |
| Media Audio | Speaker untuk penjelasan audio |
| Media Interaktif | Presentasi PowerPoint, video pembelajaran |

### 2. Sumber Belajar
| Jenis Sumber | Keterangan |
|--------------|------------|
| Buku Teks | Buku ${mapel} Kelas ${kelas} Kurikulum 2013 |
| Buku Referensi | Buku panduan ${materi} tingkat lanjut |
| Sumber Internet | Website pembelajaran ${mapel} terpercaya |
| Lingkungan | Objek nyata terkait ${materi} di sekitar |

## E. LAMPIRAN

### 1. LKS (Lembar Kerja Siswa)
| Komponen | Isi |
|----------|-----|
| Judul | Praktikum ${materi} |
| Tujuan | Menerapkan konsep ${materi} dalam praktikum |
| Petunjuk | Ikuti langkah-langkah praktikum dengan teliti |
| Soal | Jawablah pertanyaan berdasarkan hasil praktikum |

### 2. Kunci Jawaban
| No | Jawaban |
|----|---------|
| 1 | [Jawaban soal nomor 1] |
| 2 | [Jawaban soal nomor 2] |
| 3 | [Jawaban soal nomor 3] |
| 4 | [Jawaban soal nomor 4] |

### 3. Daftar Pustaka
| No | Sumber |
|----|--------|
| 1 | Buku ${mapel} Kelas ${kelas} Kurikulum 2013 |
| 2 | Panduan Pembelajaran ${mapel} |
| 3 | Jurnal Pendidikan ${mapel} Terkini |

---
*Modul ini disusun sesuai Kurikulum 2013 dan Permendikbud No. 22 Tahun 2016*
    `;
  }
}
