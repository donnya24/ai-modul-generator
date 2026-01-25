// app/page.tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [moduleText, setModuleText] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, or 3

  const [form, setForm] = useState({
    // Step 1: Informasi Dasar
    namaGuru: "",
    institusi: "",

    // Step 1: Informasi Akademik
    kurikulum: "Kurikulum Merdeka", // Changed to include Kurikulum Berbasis Cinta
    jenjang: "SMP",
    mapel: "",
    tahunAjaran: "2025/2026",
    fase: "Fase D",
    kelas: "",
    semester: "Ganjil",

    // Step 2: Detail Inti Pembelajaran
    materi: "",
    jumlahPertemuan: "2",
    alokasiWaktu: "90",
    model: "Problem Based Learning",
    skl: [] as string[],
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCheckbox(value: string) {
    setForm((prev) => ({
      ...prev,
      skl: prev.skl.includes(value)
        ? prev.skl.filter((v) => v !== value)
        : [...prev.skl, value],
    }));
  }

  function validateStep1(): string | null {
    if (!form.namaGuru.trim()) return "Nama Guru wajib diisi";
    if (!form.institusi.trim()) return "Nama Institusi wajib diisi";
    if (!form.mapel.trim()) return "Mata pelajaran wajib diisi";
    if (!form.kelas.trim()) return "Kelas wajib diisi";
    return null;
  }

  function validateStep2(): string | null {
    if (!form.materi.trim()) return "Materi pokok wajib diisi";
    if (form.skl.length < 2) return "Pilih minimal 2 Profil Pelajar Pancasila";

    // Validate realistic duration for SMK with PjBL
    if (form.jenjang === "SMK" && form.model.includes("Project")) {
      const pertemuanNum = parseInt(form.jumlahPertemuan) || 2;
      if (pertemuanNum < 4) {
        return "Untuk SMK dengan Project Based Learning, minimal 4 pertemuan diperlukan";
      }
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setModuleText("");

    const validationError = validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setCurrentStep(3); // Move to step 3 (loading/result)

    try {
      console.log("📤 Mengirim request ke API dengan data:", form);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      console.log("📥 Menerima response dari API, status:", res.status);

      const data = await res.json();
      console.log("📊 Data dari API:", data);

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal generate modul");
      }

      setModuleText(data.data);
      console.log(
        "✅ Modul berhasil di-set ke state, panjang:",
        data.data.length,
      );
    } catch (err: any) {
      console.error("❌ Error di handleSubmit:", err);
      setError(err.message || "Terjadi kesalahan");
      setCurrentStep(2); // Go back to step 2 on error
    } finally {
      setLoading(false);
    }
  }

  const exportToDocx = () => {
    if (!moduleText) return;

    // Create a properly formatted HTML content
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Modul Ajar ${form.mapel}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
            h1, h2, h3 { color: #333; }
            h1 { text-align: center; margin-bottom: 5px; }
            h1 + p { text-align: center; font-style: italic; margin-bottom: 20px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #3b82f6; color: white; }
            .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
            .subsection-title { font-weight: bold; margin-top: 15px; margin-bottom: 8px; }
            ul, ol { margin-left: 20px; margin-bottom: 10px; }
            .lkpd-section { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #3b82f6; }
          </style>
        </head>
        <body>
          ${moduleText
            .replace(/^### (.+)$/gm, "<h3>$1</h3>")
            .replace(/^## (.+)$/gm, "<h2>$1</h2>")
            .replace(/^# (.+)$/gm, "<h1>$1</h1>")
            .replace(/^\*\*(.+)\*\*$/gm, "<strong>$1</strong>")
            .replace(/^\*(.+)\*$/gm, "<em>$1</em>")
            .replace(/^- (.+)$/gm, "<li>$1</li>")
            .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
            .replace(/^<li>/gm, "<ul><li>")
            .replace(/<\/li>$/gm, "</li></ul>")
            .replace(/<\/li><ul><li>/g, "</li><li>")
            .replace(/<\/ul><\/li>/g, "</li></ul>")
            .replace(/\n\n/g, "</p><p>")
            .replace(/^/, "<p>")
            .replace(/$/, "</p>")
            .replace(/<p><h/g, "<h")
            .replace(/<\/h([1-6])><\/p>/g, "</h$1>")
            .replace(/<p><ul>/g, "<ul>")
            .replace(/<\/ul><\/p>/g, "</ul>")
            .replace(/<p><table>/g, "<table>")
            .replace(/<\/table><\/p>/g, "</table>")
            .replace(/\| (.+) \|/g, (match, content) => {
              const cells = content.split(" | ");
              return (
                "<tr>" +
                cells.map((cell: string) => `<td>${cell}</td>`).join("") +
                "</tr>"
              );
            })
            .replace(/<tr>/g, "<table><tr>")
            .replace(/<\/tr>/g, "</tr></table>")
            .replace(/<\/table><table>/g, "")
            // Special handling for LKPD section
            .replace(
              /F\. Lembar Kerja Peserta Didik \(LKPD\)([\s\S]*?)G\./g,
              '<div class="lkpd-section"><h2>F. Lembar Kerja Peserta Didik (LKPD)</h2>$1</div><h2>G.',
            )}
        </body>
      </html>
    `;

    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Modul_Ajar_${form.mapel}_${form.kelas}_${new Date().toISOString().split("T")[0]}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setModuleText("");
    setError("");
    setForm({
      namaGuru: "",
      institusi: "",
      kurikulum: "Kurikulum Merdeka",
      jenjang: "SMP",
      mapel: "",
      tahunAjaran: "2025/2026",
      fase: "Fase D",
      kelas: "",
      semester: "Ganjil",
      materi: "",
      jumlahPertemuan: "2",
      alokasiWaktu: "90",
      model: "Problem Based Learning",
      skl: [],
    });
  };

  const inputClass =
    "w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors";
  const labelClass = "text-sm font-medium text-gray-700";

  return (
    <main className="min-h-screen bg-linear-to-brom-gray-50 to-white text-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* HEADER WITH CARD */}
        <header className="mb-8">
          <div className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-4 left-4 w-20 h-20 bg-white rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white rounded-full"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Sesuai dengan Peraturan Kurikulum Merdeka & Kurikulum Berbasis
                Cinta
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                GENERATOR MODUL AJAR (RPM)
              </h1>
              <div className="w-24 h-1 bg-white mx-auto mb-4 rounded-full"></div>
              <p className="text-xl md:text-2xl font-light opacity-90">
                Kurikulum Berbasis Cinta (KBC)
              </p>

              {/* Additional decorative elements */}
              <div className="mt-6 flex justify-center gap-8">
                <div className="flex items-center gap-2 text-sm opacity-75">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  <span>Struktur Lengkap</span>
                </div>
                <div className="flex items-center gap-2 text-sm opacity-75">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Waktu Realistis</span>
                </div>
                <div className="flex items-center gap-2 text-sm opacity-75">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Berbasis Cinta</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentStep >= 1 ? "bg-blue-600" : "bg-gray-300"}`}
              >
                1
              </div>
              <span
                className={`ml-2 font-medium ${currentStep >= 1 ? "text-blue-600" : "text-gray-500"}`}
              >
                Informasi Dasar
              </span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div
                className={`h-full ${currentStep >= 2 ? "bg-blue-600" : ""}`}
                style={{ width: currentStep >= 2 ? "100%" : "0%" }}
              ></div>
            </div>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentStep >= 2 ? "bg-blue-600" : "bg-gray-300"}`}
              >
                2
              </div>
              <span
                className={`ml-2 font-medium ${currentStep >= 2 ? "text-blue-600" : "text-gray-500"}`}
              >
                Detail Pembelajaran
              </span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div
                className={`h-full ${currentStep >= 3 ? "bg-blue-600" : ""}`}
                style={{ width: currentStep >= 3 ? "100%" : "0%" }}
              ></div>
            </div>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentStep >= 3 ? "bg-blue-600" : "bg-gray-300"}`}
              >
                3
              </div>
              <span
                className={`ml-2 font-medium ${currentStep >= 3 ? "text-blue-600" : "text-gray-500"}`}
              >
                Hasil
              </span>
            </div>
          </div>
        </div>

        {/* FORM INPUT - STEP 1 */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Langkah 1: Informasi Dasar
            </h2>

            <form className="space-y-6">
              {/* Informasi Pendidik */}
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-600 text-sm uppercase tracking-wide">
                  Informasi Pendidik
                </h3>

                <div>
                  <label className={labelClass}>Nama Guru*</label>
                  <input
                    name="namaGuru"
                    value={form.namaGuru}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Contoh: Donny Andika, S.Pd."
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Nama Institusi*</label>
                  <input
                    name="institusi"
                    value={form.institusi}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Contoh: SMKN 1 Nganjuk"
                    required
                  />
                </div>
              </div>

              {/* Informasi Akademik */}
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-600 text-sm uppercase tracking-wide">
                  Informasi Akademik
                </h3>

                <div>
                  <label className={labelClass}>Pilih Kurikulum*</label>
                  <select
                    name="kurikulum"
                    value={form.kurikulum}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option>Kurikulum Merdeka</option>
                    <option>Kurikulum Berbasis Cinta</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Jenjang Pendidikan*</label>
                  <select
                    name="jenjang"
                    value={form.jenjang}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option>TK/SDerajat</option>
                    <option>SD/MI</option>
                    <option>SMP/MTs</option>
                    <option>SMA/MA/Sederajat</option>
                    <option>SMK/Sederajat</option>
                    <option>TKLB</option>
                    <option>SDLB-SMALB</option>
                    <option>Kesetaraan</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Mata Pelajaran*</label>
                  <input
                    name="mapel"
                    value={form.mapel}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Contoh: Bahasa Basis Data"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Tahun Ajaran*</label>
                    <input
                      name="tahunAjaran"
                      value={form.tahunAjaran}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="2025/2026"
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Semester*</label>
                    <select
                      name="semester"
                      value={form.semester}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option>Ganjil</option>
                      <option>Genap</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Fase*</label>
                  <select
                    name="fase"
                    value={form.fase}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={form.kurikulum === "Kurikulum Berbasis Cinta"}
                  >
                    <option>Fase A (SD kelas 1–2)</option>
                    <option>Fase B (SD kelas 3–4)</option>
                    <option>Fase C (SD kelas 5–6)</option>
                    <option>Fase D (SMP kelas 7–9)</option>
                    <option>Fase E (SMA/SMK kelas 10)</option>
                    <option>Fase F (SMA/SMK kelas 11–12)</option>
                  </select>
                  {form.kurikulum === "Kurikulum Berbasis Cinta" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Fase tidak digunakan untuk Kurikulum Berbasis Cinta
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Kelas*</label>
                  <input
                    name="kelas"
                    value={form.kelas}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Contoh: XI atau 11"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Next Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const validationError = validateStep1();
                    if (validationError) {
                      setError(validationError);
                      return;
                    }
                    setError("");
                    setCurrentStep(2);
                  }}
                  className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  Selanjutnya
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORM INPUT - STEP 2 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Langkah 2: Detail Inti Pembelajaran
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Detail Pembelajaran */}
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-600 text-sm uppercase tracking-wide">
                  Detail Pembelajaran
                </h3>

                <div>
                  <label className={labelClass}>
                    Materi Pokok/Judul Modul*
                  </label>
                  <input
                    name="materi"
                    value={form.materi}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Contoh: Pengenalan dasar-dasar basis data"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Jumlah Pertemuan*</label>
                    <select
                      name="jumlahPertemuan"
                      value={form.jumlahPertemuan}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="1">1 Pertemuan</option>
                      <option value="2">2 Pertemuan</option>
                      <option value="3">3 Pertemuan</option>
                      <option value="4">4 Pertemuan</option>
                      <option value="5">5 Pertemuan</option>
                      <option value="6">6 Pertemuan</option>
                      <option value="7">7 Pertemuan</option>
                      <option value="8">8 Pertemuan</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Alokasi Waktu Per Pertemuan (menit)*
                    </label>
                    <input
                      name="alokasiWaktu"
                      type="number"
                      min="30"
                      max="240"
                      step="30"
                      value={form.alokasiWaktu}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Model Pembelajaran*</label>
                  <select
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option>Problem Based Learning</option>
                    <option>Project Based Learning</option>
                    <option>Cooperative Learning</option>
                    <option>Discovery Learning</option>
                    <option>Inquiry Learning</option>
                    <option>Differentiated Learning</option>
                    <option>Contextual Teaching and Learning (CTL)</option>
                    <option>Blended Learning</option>
                  </select>
                </div>
              </div>

              {/* Profil Pelajar Pancasila */}
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-600 text-sm uppercase tracking-wide">
                  Dimensi Profil Lulusan*
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    (minimal 2)
                  </span>
                </h3>
                <div className="space-y-2">
                  {[
                    "Beriman, bertakwa, dan berakhlak mulia",
                    "Berkebinekaan global",
                    "Bergotong royong",
                    "Mandiri",
                    "Bernalar kritis",
                    "Kreatif",
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={form.skl.includes(item)}
                        onChange={() => handleCheckbox(item)}
                        className="accent-blue-600"
                      />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 17l-5-5m0 0l5-5m-5 5h12"
                    />
                  </svg>
                  Kembali
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Membuat Modul...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Buat Modul Ajar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: LOADING AND RESULT */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg
                    className="animate-spin h-10 w-10 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  Sedang Membuat Modul Ajar
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Mohon tunggu sebentar, sistem sedang membuat modul ajar yang
                  sesuai dengan input Anda.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-md mx-auto">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full animate-pulse"
                    style={{ width: "70%" }}
                  ></div>
                </div>
              </div>
            ) : moduleText ? (
              <>
                {/* Header Output */}
                <div className="border-b border-gray-200 px-6 py-4 bg-linear-to-r from-blue-50 to-indigo-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        Modul Ajar Hasil Generate
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Format: Tabel • Struktur Lengkap • Siap Unduh
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={exportToDocx}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Unduh .DOCX
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(moduleText);
                          alert("Modul berhasil disalin ke clipboard!");
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                        Salin Teks
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="p-6">
                  <div className="prose prose-blue max-w-none border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-4">
                            <table
                              className="min-w-full border border-gray-300"
                              {...props}
                            />
                          </div>
                        ),
                        th: ({ node, ...props }) => (
                          <th
                            className="border border-gray-300 bg-blue-500 text-white px-4 py-2 text-left font-semibold"
                            {...props}
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td
                            className="border border-gray-300 px-4 py-2"
                            {...props}
                          />
                        ),
                        h1: ({ children, ...props }) => (
                          <h1
                            className="text-2xl font-bold text-center mb-4"
                            {...props}
                          >
                            {children}
                          </h1>
                        ),
                        h2: ({ children, ...props }) => (
                          <h2
                            className="text-xl font-bold mt-6 mb-3"
                            {...props}
                          >
                            {children}
                          </h2>
                        ),
                        h3: ({ children, ...props }) => (
                          <h3
                            className="text-lg font-semibold mt-4 mb-2"
                            {...props}
                          >
                            {children}
                          </h3>
                        ),
                        p: ({ children, ...props }) => {
                          // Check if this is part of LKPD section
                          const textContent = String(children).toLowerCase();
                          if (
                            textContent.includes("lembar kerja") ||
                            textContent.includes("lkpd") ||
                            textContent.includes("petunjuk belajar") ||
                            textContent.includes("tujuan pembelajaran") ||
                            textContent.includes("materi singkat") ||
                            textContent.includes("aktivitas") ||
                            textContent.includes("langkah kerja") ||
                            textContent.includes("tugas") ||
                            textContent.includes("komponen penilaian")
                          ) {
                            return (
                              <p className="mb-3 text-gray-800" {...props}>
                                {children}
                              </p>
                            );
                          }
                          return (
                            <p className="mb-3" {...props}>
                              {children}
                            </p>
                          );
                        },
                        ul: ({ children, ...props }) => {
                          const textContent = String(children).toLowerCase();
                          if (
                            textContent.includes("petunjuk") ||
                            textContent.includes("langkah") ||
                            textContent.includes("tugas")
                          ) {
                            return (
                              <ul
                                className="list-disc pl-6 mb-3 text-gray-800"
                                {...props}
                              >
                                {children}
                              </ul>
                            );
                          }
                          return (
                            <ul className="list-disc pl-6 mb-3" {...props}>
                              {children}
                            </ul>
                          );
                        },
                        ol: ({ children, ...props }) => (
                          <ol className="list-decimal pl-6 mb-3" {...props}>
                            {children}
                          </ol>
                        ),
                        li: ({ children, ...props }) => (
                          <li className="mb-1" {...props}>
                            {children}
                          </li>
                        ),
                        strong: ({ children, ...props }) => (
                          <strong className="font-semibold" {...props}>
                            {children}
                          </strong>
                        ),
                      }}
                    >
                      {moduleText}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Create New Button */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="flex justify-center">
                    <button
                      onClick={resetForm}
                      className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Buat Modul Baru
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  Gagal Membuat Modul
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {error ||
                    "Terjadi kesalahan saat membuat modul. Silakan coba lagi."}
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Mulai Ulang
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p className="mb-2">
            Generator Modul Ajar (RPM) • Kurikulum Berbasis Cinta (KBC)
          </p>
          <p className="flex items-center justify-center gap-2">
            Disusun oleh Donny Andika Kurniawan
            <a
              href="https://instagram.com/donny.ax"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 hover:text-pink-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.059-1.281-.073-1.689-.073-4.948 0-3.259.014-3.668.072-4.948.2-4.358 2.618-6.78 6.98-6.98 1.281-.058 1.689-.072 4.948-.072zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z" />
              </svg>
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
