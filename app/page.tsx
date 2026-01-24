// app/page.tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [moduleText, setModuleText] = useState("");

  const [form, setForm] = useState({
    judul: "", // New field for title
    kurikulum: "Kurikulum Merdeka", // Changed to include K13 option
    namaGuru: "",
    institusi: "",
    jenjang: "SMP",
    fase: "Fase D",
    kelas: "",
    mapel: "",
    materi: "",
    tahunPelajaran: "2025/2026", // New field
    semester: "Ganjil", // New field
    durasi: "2",
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

  function validateForm(): string | null {
    if (!form.judul.trim()) return "Judul Modul wajib diisi";
    if (!form.namaGuru.trim()) return "Nama Guru wajib diisi";
    if (!form.institusi.trim()) return "Nama Institusi wajib diisi";
    if (!form.kelas.trim()) return "Kelas wajib diisi";
    if (!form.mapel.trim()) return "Mata pelajaran wajib diisi";
    if (!form.materi.trim()) return "Materi pokok wajib diisi";
    if (form.skl.length < 2) return "Pilih minimal 2 Profil Pelajar Pancasila";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setModuleText("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  }

  const exportToDocx = () => {
    if (!moduleText) return;

    const content = `${moduleText}`;

    const blob = new Blob([content], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Modul_Ajar_${form.mapel}_${form.kelas}_${new Date().toISOString().split("T")[0]}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToMarkdown = () => {
    if (!moduleText) return;

    const blob = new Blob([moduleText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Modul_Ajar_${form.mapel}_${form.kelas}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    if (!moduleText) return;

    try {
      // Create a temporary div to render the markdown
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "210mm"; // A4 width
      tempDiv.style.padding = "20mm";
      tempDiv.style.backgroundColor = "white";
      tempDiv.style.fontFamily = "Arial, sans-serif";
      tempDiv.style.fontSize = "12px";
      tempDiv.innerHTML = `
        <div style="margin-bottom: 20px;">${moduleText.replace(/\n/g, "<br>")}</div>
      `;
      document.body.appendChild(tempDiv);

      // Convert to canvas and then to PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      // Clean up
      document.body.removeChild(tempDiv);

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `Modul_Ajar_${form.mapel}_${form.kelas}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    }
  };

  const inputClass =
    "w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors";
  const labelClass = "text-sm font-medium text-gray-700";

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* HEADER WITH CARD */}
        <header className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
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
                Sesuai Permendikdasmen No. 13 Tahun 2025
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
                  <span>Modul Lengkap</span>
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
                  <span>Mudah & Cepat</span>
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FORM INPUT */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
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
                Input Data Modul
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informasi Dasar */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-600 text-sm uppercase tracking-wide">
                    Informasi Modul
                  </h3>

                  <div>
                    <label className={labelClass}>Judul Modul*</label>
                    <input
                      name="judul"
                      value={form.judul}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Contoh: Persamaan Linear Satu Variabel"
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Kurikulum*</label>
                    <select
                      name="kurikulum"
                      value={form.kurikulum}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option>Kurikulum Merdeka</option>
                      <option>Kurikulum 2013 (K13)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Tahun Pelajaran*</label>
                      <input
                        name="tahunPelajaran"
                        value={form.tahunPelajaran}
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
                    <label className={labelClass}>Nama Guru*</label>
                    <input
                      name="namaGuru"
                      value={form.namaGuru}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Budi Santoso, M.Pd."
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Satuan Pendidikan*</label>
                    <input
                      name="institusi"
                      value={form.institusi}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="SMP Negeri 1 Jakarta"
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Mata Pelajaran*</label>
                    <input
                      name="mapel"
                      value={form.mapel}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Matematika"
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Kelas*</label>
                    <input
                      name="kelas"
                      value={form.kelas}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="VII A"
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Materi Pokok*</label>
                    <textarea
                      name="materi"
                      value={form.materi}
                      onChange={handleChange}
                      className={`${inputClass} min-h-[80px]`}
                      placeholder="Persamaan Linear Satu Variabel"
                      required
                    />
                  </div>
                </div>

                {/* Pengaturan Pembelajaran */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-600 text-sm uppercase tracking-wide">
                    Pengaturan Pembelajaran
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Jenjang</label>
                      <select
                        name="jenjang"
                        value={form.jenjang}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option>SD</option>
                        <option>SMP</option>
                        <option>SMA</option>
                        <option>SMK</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Fase</label>
                      <select
                        name="fase"
                        value={form.fase}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option>Fase A</option>
                        <option>Fase B</option>
                        <option>Fase C</option>
                        <option>Fase D</option>
                        <option>Fase E</option>
                        <option>Fase F</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Durasi (JP)*</label>
                      <div className="flex items-center gap-2">
                        <input
                          name="durasi"
                          type="number"
                          min="1"
                          max="10"
                          value={form.durasi}
                          onChange={handleChange}
                          className={inputClass}
                          required
                        />
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                          = {(parseInt(form.durasi) || 2) * 45} menit
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Model Pembelajaran</label>
                      <select
                        name="model"
                        value={form.model}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option>Problem Based Learning</option>
                        <option>Project Based Learning</option>
                        <option>Discovery Learning</option>
                        <option>Inquiry Learning</option>
                        <option>Cooperative Learning</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Profil Pelajar Pancasila */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-600 text-sm uppercase tracking-wide">
                    Profil Pelajar Pancasila*
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
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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
                      <span>Generate Modul Ajar</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* OUTPUT PREVIEW */}
          <div className="lg:col-span-2">
            {moduleText ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header Output */}
                <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        Modul Ajar Hasil Generate
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Format: Markdown dengan Tabel • Siap Unduh
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
                        onClick={exportToPDF}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
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
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        Unduh .PDF
                      </button>
                      <button
                        onClick={exportToMarkdown}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
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
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Unduh .MD
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
                            className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold"
                            {...props}
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td
                            className="border border-gray-300 px-4 py-2"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {moduleText}
                    </ReactMarkdown>
                  </div>

                  {/* Raw Text (optional) */}
                  <details className="mt-6 border border-gray-200 rounded-lg">
                    <summary className="px-4 py-3 bg-gray-50 cursor-pointer font-medium text-gray-700">
                      Lihat Teks Mentah
                    </summary>
                    <pre className="p-4 bg-white text-sm overflow-auto max-h-96">
                      {moduleText}
                    </pre>
                  </details>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  Belum Ada Modul
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Isi formulir di samping dengan data pembelajaran Anda, lalu
                  klik "Generate Modul Ajar" untuk membuat modul dalam format
                  teks lengkap dengan tabel.
                </p>
                <div className="inline-flex flex-col items-center gap-2 bg-gray-50 px-6 py-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium">Fitur Output:</span>
                  </div>
                  <ul className="text-sm text-gray-600 text-left space-y-1">
                    <li>✓ Format teks lengkap dengan tabel markdown</li>
                    <li>✓ Struktur lengkap sesuai Kurikulum</li>
                    <li>✓ Download sebagai DOCX, PDF, atau Markdown</li>
                    <li>✓ Preview langsung di browser</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p className="mb-2">
            Generator Modul Ajar (RPM) • Kurikulum Berbasis Cinta (KBC)
          </p>
          <p className="flex items-center justify-center gap-2">
            Dirancang oleh andi pratama
            <a
              href="https://instagram.com/andipratama"
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
