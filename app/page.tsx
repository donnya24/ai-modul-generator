"use client";

import { useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const [form, setForm] = useState({
    namaGuru: "",
    institusi: "",
    kurikulum: "Kurikulum Merdeka",
    jenjang: "SMP",
    fase: "Fase D",
    kelas: "",
    mapel: "",
    materi: "",
    durasi: "2 x 40 menit",
    model: "Problem Based Learning",
    skl: [] as string[],
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  function handleCheckbox(value: string) {
    setForm((prev) => ({
      ...prev,
      skl: prev.skl.includes(value)
        ? prev.skl.filter((v) => v !== value)
        : [...prev.skl, value],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult("");

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setResult(data.data || "Gagal generate modul");
    setLoading(false);
  }

  const inputClass =
    "w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  const selectClass = inputClass;

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* HEADER */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-black">
            Generator Modul Ajar
          </h1>
          <p className="text-gray-700 mt-1">
            Kurikulum Merdeka berbasis AI (Gemini)
          </p>
        </header>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        >
          {/* INFORMASI PENDIDIK */}
          <section>
            <h2 className="text-lg font-semibold text-blue-600 mb-4">
              Informasi Pendidik
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-black">
                  Nama Guru
                </label>
                <input
                  name="namaGuru"
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-black">
                  Nama Institusi
                </label>
                <input
                  name="institusi"
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="SMP Negeri 1"
                />
              </div>
            </div>
          </section>

          {/* INFORMASI AKADEMIK */}
          <section>
            <h2 className="text-lg font-semibold text-blue-600 mb-4">
              Informasi Akademik
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-black">
                  Kurikulum
                </label>
                <select
                  name="kurikulum"
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option className="text-black bg-white">
                    Kurikulum Merdeka
                  </option>
                  <option className="text-black bg-white">
                    Kurikulum Merdeka Revisi
                  </option>
                  <option className="text-black bg-white">
                    Kurikulum 2013
                  </option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-black">
                  Jenjang Pendidikan
                </label>
                <select
                  name="jenjang"
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option className="text-black bg-white">SD</option>
                  <option className="text-black bg-white">SMP</option>
                  <option className="text-black bg-white">SMA/SMK</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-black">Fase</label>
                <select
                  name="fase"
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option className="text-black bg-white">Fase A</option>
                  <option className="text-black bg-white">Fase B</option>
                  <option className="text-black bg-white">Fase C</option>
                  <option className="text-black bg-white">Fase D</option>
                  <option className="text-black bg-white">Fase E</option>
                  <option className="text-black bg-white">Fase F</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-black">Kelas</label>
                <input
                  name="kelas"
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="VIII"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-black">
                  Mata Pelajaran
                </label>
                <input
                  name="mapel"
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Informatika"
                />
              </div>
            </div>
          </section>

          {/* DETAIL PEMBELAJARAN */}
          <section>
            <h2 className="text-lg font-semibold text-blue-600 mb-4">
              Detail Inti Pembelajaran
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-black">
                  Materi Pokok / Judul Modul
                </label>
                <input
                  name="materi"
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-black">
                  Lama Waktu per Pertemuan
                </label>
                <input
                  name="durasi"
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-black">
                  Model Pembelajaran
                </label>
                <select
                  name="model"
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option className="text-black bg-white">
                    Problem Based Learning
                  </option>
                  <option className="text-black bg-white">
                    Project Based Learning
                  </option>
                  <option className="text-black bg-white">
                    Discovery Learning
                  </option>
                  <option className="text-black bg-white">
                    Inquiry Learning
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* SKL 2025 */}
          <section>
            <h2 className="text-lg font-semibold text-blue-600 mb-4">
              Kesesuaian SKL 2025
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Keimanan, ketakwaan & akhlak mulia",
                "Kewargaan",
                "Penalaran kritis",
                "Kreativitas",
                "Kolaborasi",
                "Kemandirian",
                "Kesehatan",
                "Komunikasi",
              ].map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 text-black"
                >
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    onChange={() => handleCheckbox(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </section>

          {/* BUTTON */}
          <button
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Menghasilkan Modul..." : "Generate Modul Ajar"}
          </button>
        </form>

        {/* OUTPUT */}
        {result && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-black mb-3">
              Hasil Modul Ajar
            </h2>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-black whitespace-pre-wrap">
              {result}
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}
