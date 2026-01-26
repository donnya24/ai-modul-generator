// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
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

  // Scroll ke atas ketika step berubah
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Effect untuk animasi progress loading
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (loading) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          // Simulasi progress: 0-80% cepat, 80-100% lambat
          if (prev < 80) {
            return prev + Math.random() * 15 + 5;
          } else if (prev < 95) {
            return prev + Math.random() * 3 + 1;
          } else if (prev < 100) {
            return prev + 0.5;
          }
          return prev;
        });
      }, 200);
    } else {
      setLoadingProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

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
    
    // Scroll ke atas sebelum mulai proses
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    setError("");
    setModuleText("");
    setLoadingProgress(0);

    const validationError = validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setCurrentStep(3); // Move to step 3 (loading/result)

    try {
      console.log("📤 Mengirim request ke API dengan data:", form);

      // Simulasi progress sebelum fetch
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLoadingProgress(30);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      console.log("📥 Menerima response dari API, status:", res.status);

      // Progress saat menerima response
      setLoadingProgress(70);

      const data = await res.json();
      console.log("📊 Data dari API:", data);

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal generate modul");
      }

      // Progress akhir
      setLoadingProgress(95);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setModuleText(data.data);
      console.log(
        "✅ Modul berhasil di-set ke state, panjang:",
        data.data.length,
      );

      // Selesaikan progress
      setLoadingProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err: any) {
      console.error("❌ Error di handleSubmit:", err);
      setError(err.message || "Terjadi kesalahan");
      setCurrentStep(2); // Go back to step 2 on error
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  }

  const exportToDocx = () => {
    if (!moduleText) return;

    // Function to sanitize HTML
    const sanitizeHTML = (html: string) => {
      return html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/–/g, "&#8211;")
        .replace(/—/g, "&#8212;")
        .replace(/…/g, "&#8230;");
    };

    // Process the module text to HTML
    let htmlOutput = "";
    const lines = moduleText.split("\n");
    let inTable = false;
    let tableRows: string[] = [];
    let currentListType: "ul" | "ol" | null = null;
    let listItems: string[] = [];
    let inLKPD = false;
    let isTPTable = false; // Flag khusus untuk tabel Pemetaan TP

    const processList = () => {
      if (listItems.length > 0) {
        if (currentListType === "ol") {
          htmlOutput += '<ol style="margin: 0 0 12pt 0; padding-left: 24pt;">';
          listItems.forEach((item) => {
            htmlOutput += `<li style="margin: 3pt 0; text-align: justify; color: #000000; font-family: \'Times New Roman\', serif; font-size: 11pt;">${sanitizeHTML(item)}</li>`;
          });
          htmlOutput += "</ol>";
        } else {
          htmlOutput += '<ul style="margin: 0 0 12pt 0; padding-left: 24pt;">';
          listItems.forEach((item) => {
            htmlOutput += `<li style="margin: 3pt 0; text-align: justify; color: #000000; font-family: \'Times New Roman\', serif; font-size: 11pt;">${sanitizeHTML(item)}</li>`;
          });
          htmlOutput += "</ul>";
        }
        listItems = [];
        currentListType = null;
      }
    };

    const processTable = () => {
      if (tableRows.length > 0) {
        // Clean table rows from extra pipes and dashes
        const cleanedRows = tableRows
          .filter((row) => {
            const trimmed = row.trim();
            // Remove completely empty rows
            if (trimmed === "") return false;
            // Remove separator rows (lines with only dashes, pipes, or spaces)
            if (trimmed.match(/^[-| ]+$/)) return false;
            return true;
          })
          .map((row) => {
            // Remove leading/trailing pipes and clean cells
            let cleanRow = row.trim();
            if (cleanRow.startsWith("|")) cleanRow = cleanRow.substring(1);
            if (cleanRow.endsWith("|"))
              cleanRow = cleanRow.substring(0, cleanRow.length - 1);
            return cleanRow;
          });

        if (cleanedRows.length > 0) {
          htmlOutput += '<div style="margin: 12pt 0;">';
          htmlOutput +=
            "<table style=\"border-collapse: collapse; width: 100%; border: 1pt solid #000000; font-family: 'Times New Roman', serif; font-size: 11pt; color: #000000;\">";

          cleanedRows.forEach((row, index) => {
            const cells = row.split("|").map((cell) => {
              // Clean each cell - preserve intentional spaces and checkboxes
              let cleanCell = cell.trim();

              // Handle checkbox cells - khusus untuk tabel TP
              if (isTPTable) {
                // Untuk header row, biarkan asli
                if (index === 0) {
                  return cleanCell;
                }

                // Untuk data rows, handle checkbox dengan benar
                if (cleanCell === "✓" || cleanCell.includes("✓")) {
                  return "☑"; // Checkbox tercentang
                } else if (cleanCell === "" || cleanCell === " ") {
                  return "☐"; // Checkbox tidak tercentang
                } else if (cleanCell.includes("TP")) {
                  return cleanCell; // Kolom TP, biarkan asli
                }
              }

              // Untuk tabel non-TP, handle checkbox umum
              if (cleanCell.includes("[✓]")) {
                cleanCell = cleanCell.replace(/\[✓\]/g, "☑");
              }
              if (cleanCell.includes("[ ]")) {
                cleanCell = cleanCell.replace(/\[ \]/g, "☐");
              }

              return cleanCell;
            });

            if (cells.length === 0) return;

            if (index === 0) {
              // Table header row - GANTI WARNA DARI BIRU KE HIJAU (TEAL/EMERALD)
              htmlOutput += "<thead>";
              htmlOutput += "<tr>";
              cells.forEach((cell) => {
                // Check if this is TP table header
                const isTPHeader =
                  isTPTable &&
                  (cell.includes("TP") ||
                    cell.includes("Pertemuan") ||
                    cell.includes("pertemuan"));

                // PERUBAHAN: Mengganti warna background dari #3b82f6 (biru) ke #0d9488 (teal-700)
                htmlOutput += `<th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; padding: 8pt 6pt; border: 1pt solid #000000; vertical-align: middle; font-family: \'Times New Roman\', serif; font-size: 11pt;">${sanitizeHTML(cell)}</th>`;
              });
              htmlOutput += "</tr>";
              htmlOutput += "</thead>";
              htmlOutput += "<tbody>";
            } else {
              // Table data rows
              htmlOutput += "<tr>";
              cells.forEach((cell, cellIndex) => {
                // Untuk tabel TP, align center untuk kolom checkbox
                const alignStyle = isTPTable && cellIndex > 0 ? "center" : "left";
                const cellContent = sanitizeHTML(cell);

                htmlOutput += `<td style="padding: 6pt; border: 1pt solid #000000; vertical-align: middle; text-align: ${alignStyle}; color: #000000; font-family: \'Times New Roman\', serif; font-size: 11pt;">${cellContent}</td>`;
              });
              htmlOutput += "</tr>";
            }
          });

          htmlOutput += "</tbody>";
          htmlOutput += "</table>";
          htmlOutput += "</div>";
        }
        tableRows = [];
        isTPTable = false; // Reset flag setelah tabel diproses
      }
    };

    // [Kode parsing lines tetap sama...]
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Deteksi tabel Pemetaan TP
      if (
        trimmedLine.toLowerCase().includes("pemetaan tp") ||
        trimmedLine.toLowerCase().includes("pemetaan tujuan pembelajaran")
      ) {
        isTPTable = true;
      }


      // Skip separator rows (lines with only dashes and pipes)
      if (trimmedLine.match(/^[-| ]+$/)) {
        // Tapi jangan skip jika ini di tengah tabel (mungkin separator header)
        if (!inTable) {
          continue;
        }
      }

      // Skip empty lines between sections
      if (trimmedLine === "" && !inTable && listItems.length === 0 && !inLKPD) {
        htmlOutput += "<br>";
        continue;
      }

      // Handle main title
      if (trimmedLine.startsWith("MODUL AJAR ")) {
        processList();
        processTable();
        const title = trimmedLine.replace("MODUL AJAR ", "");
        htmlOutput += `
          <div style="text-align: center; margin-bottom: 24pt;">
            <h1 style="font-size: 16pt; font-weight: bold; color: #000000; margin: 0 0 6pt 0; font-family: 'Times New Roman', serif; text-align: center;">MODUL AJAR</h1>
            <h1 style="font-size: 16pt; font-weight: bold; color: #000000; margin: 0; font-family: 'Times New Roman', serif; text-align: center;">${sanitizeHTML(title)}</h1>
          </div>
        `;
        continue;
      }

      // Handle quoted subtitle
      if (trimmedLine.match(/^"(.+)"$/)) {
        processList();
        processTable();
        const subtitle = trimmedLine.replace(/^"(.+)"$/, "$1");
        htmlOutput += `<p style="text-align: center; font-style: italic; font-size: 11pt; margin: 0 0 12pt 0; font-family: 'Times New Roman', serif; color: #000000;">"${sanitizeHTML(subtitle)}"</p>`;
        continue;
      }

      // Handle section headers with letters (A., B., C., etc.)
      if (trimmedLine.match(/^([A-J])\.\s+(.+)$/)) {
        processList();
        processTable();
        const [, letter, title] = trimmedLine.match(/^([A-J])\.\s+(.+)$/) || [];
        htmlOutput += `
          <h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 18pt 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: 'Times New Roman', serif;">
            ${letter}. ${sanitizeHTML(title)}
          </h2>
        `;
        continue;
      }

      // Handle ### headers
      if (trimmedLine.startsWith("### ")) {
        processList();
        processTable();
        const title = trimmedLine.replace("### ", "");
        htmlOutput += `<h3 style="font-size: 13pt; font-weight: bold; color: #000000; margin: 15pt 0 7.5pt 0; font-family: 'Times New Roman', serif;">${sanitizeHTML(title)}</h3>`;
        continue;
      }

      // Handle ## headers
      if (trimmedLine.startsWith("## ")) {
        processList();
        processTable();
        const title = trimmedLine.replace("## ", "");
        htmlOutput += `<h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 18pt 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: 'Times New Roman', serif;">${sanitizeHTML(title)}</h2>`;
        continue;
      }

      // Handle # headers
      if (trimmedLine.startsWith("# ")) {
        processList();
        processTable();
        const title = trimmedLine.replace("# ", "");
        htmlOutput += `<h1 style="font-size: 16pt; font-weight: bold; color: #000000; margin: 24pt 0 12pt 0; text-align: center; font-family: 'Times New Roman', serif;">${sanitizeHTML(title)}</h1>`;
        continue;
      }

      // Handle LKPD section start
      if (
        trimmedLine === "F. Lembar Kerja Peserta Didik (LKPD)" ||
        trimmedLine.includes("Lembar Kerja Peserta Didik")
      ) {
        processList();
        processTable();
        inLKPD = true;
        htmlOutput += `
          <div style="margin: 15pt 0; padding: 12pt; background-color: #f8fafc; border: 1pt solid #cbd5e1; border-radius: 4pt; page-break-inside: avoid;">
            <h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 0 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: 'Times New Roman', serif;">
              ${sanitizeHTML(trimmedLine)}
            </h2>
        `;
        continue;
      }

      // Handle LKPD section end (when we reach next major section)
      if (inLKPD && trimmedLine.match(/^[G-J]\.\s+/)) {
        processList();
        processTable();
        htmlOutput += "</div>";
        inLKPD = false;
        // Continue processing this line as a new section
        i--; // Reprocess this line
        continue;
      }

      // Handle tables - start of table
      if (line.includes("|") && !inTable) {
        processList();
        inTable = true;
        tableRows.push(line);
        continue;
      }

      // Handle tables - continuing table
      if (inTable && line.includes("|")) {
        tableRows.push(line);
        continue;
      }

      // Handle tables - end of table
      if (inTable && !line.includes("|")) {
        processTable();
        inTable = false;
        // Continue processing this line
        i--; // Reprocess this line
        continue;
      }

      // Handle unordered list items
      if (trimmedLine.startsWith("- ")) {
        if (currentListType !== "ul") {
          processList();
          currentListType = "ul";
        }
        const item = trimmedLine.replace("- ", "");
        listItems.push(item);
        continue;
      }

      // Handle ordered list items
      if (trimmedLine.match(/^\d+\.\s+/)) {
        if (currentListType !== "ol") {
          processList();
          currentListType = "ol";
        }
        const item = trimmedLine.replace(/^\d+\.\s+/, "");
        listItems.push(item);
        continue;
      }

      // Handle bold text
      let processedLine = trimmedLine.replace(
        /\*\*(.+?)\*\*/g,
        '<strong style="font-weight: bold; color: #000000;">$1</strong>',
      );

      // Handle italic text
      processedLine = processedLine.replace(
        /\*(.+?)\*/g,
        '<em style="font-style: italic; color: #000000;">$1</em>',
      );

      // Handle checkboxes in text - replace [✓] with checked checkbox, [ ] with empty checkbox
      processedLine = processedLine.replace(/\[✓\]/g, "☑");
      processedLine = processedLine.replace(/\[ \]/g, "☐");

      // Handle plain ✓ and empty cells for TP table
      processedLine = processedLine.replace(/^\s*✓\s*$/g, "☑");
      processedLine = processedLine.replace(/^\s*$\s*/g, "☐");

      // Check if this is a section title line (like in LKPD)
      const lowerLine = trimmedLine.toLowerCase();
      if (
        lowerLine.includes("tujuan:") ||
        lowerLine.includes("petunjuk:") ||
        lowerLine.includes("materi:") ||
        lowerLine.includes("aktivitas:") ||
        lowerLine.includes("langkah kerja:") ||
        lowerLine.includes("tugas:") ||
        lowerLine.includes("penilaian:") ||
        lowerLine.includes("rubrik:") ||
        lowerLine.includes("komponen penilaian:")
      ) {
        processList();
        processTable();
        htmlOutput += `<p style="font-weight: bold; margin: 9pt 0 3pt 0; font-family: 'Times New Roman', serif; font-size: 11pt; color: #000000;">${sanitizeHTML(processedLine)}</p>`;
        continue;
      }

      // Regular paragraph
      if (processedLine.trim()) {
        processList();
        processTable();

        // Determine if this is a centered text (like in LKPD activities)
        const shouldCenter =
          processedLine.includes("LKPD") ||
          processedLine.includes("LEMBAR KERJA") ||
          processedLine.includes("Nama:") ||
          processedLine.includes("Kelas:") ||
          processedLine.includes("Kelompok:") ||
          processedLine.includes("Tanggal:");

        const alignment = shouldCenter ? "center" : "justify";

        htmlOutput += `<p style="margin: 0 0 6pt 0; text-align: ${alignment}; font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #000000;">${sanitizeHTML(processedLine)}</p>`;
      }
    }

    // Process any remaining lists, tables, or close LKPD
    processList();
    processTable();
    if (inLKPD) {
      htmlOutput += "</div>";
    }

    // Add page breaks before major sections (but not before A)
    htmlOutput = htmlOutput
      .replace(
        /<h2 style="[^"]*">B\./g,
        '<div style="page-break-before: always;"></div><h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 18pt 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: \'Times New Roman\', serif;">B.',
      )
      .replace(
        /<h2 style="[^"]*">C\./g,
        '<div style="page-break-before: always;"></div><h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 18pt 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: \'Times New Roman\', serif;">C.',
      )
      .replace(
        /<h2 style="[^"]*">D\./g,
        '<div style="page-break-before: always;"></div><h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 18pt 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: \'Times New Roman\', serif;">D.',
      )
      .replace(
        /<h2 style="[^"]*">E\./g,
        '<div style="page-break-before: always;"></div><h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 18pt 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: \'Times New Roman\', serif;">E.',
      )
      .replace(
        /<h2 style="[^"]*">F\./g,
        '<div style="page-break-before: always;"></div><h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 18pt 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: \'Times New Roman\', serif;">F.',
      )
      .replace(
        /<h2 style="[^"]*">G\./g,
        '<div style="page-break-before: always;"></div><h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 18pt 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: \'Times New Roman\', serif;">G.',
      )
      .replace(
        /<h2 style="[^"]*">H\./g,
        '<div style="page-break-before: always;"></div><h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 18pt 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: \'Times New Roman\', serif;">H.',
      )
      .replace(
        /<h2 style="[^"]*">I\./g,
        '<div style="page-break-before: always;"></div><h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 18pt 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: \'Times New Roman\', serif;">I.',
      )
      .replace(
        /<h2 style="[^"]*">J\./g,
        '<div style="page-break-before: always;"></div><h2 style="font-size: 14pt; font-weight: bold; color: #000000; margin: 18pt 0 9pt 0; border-bottom: 2pt solid #000000; padding-bottom: 3pt; font-family: \'Times New Roman\', serif;">J.',
      );

    // Add signature section
    const signatureSection = `
      <div style="margin-top: 36pt; text-align: center;">
        <div style="margin-top: 36pt; border-top: 1pt solid #000000; width: 50%; margin-left: auto; margin-right: auto;"></div>
        <p style="margin: 12pt 0 6pt 0; font-family: 'Times New Roman', serif; font-size: 11pt; color: #000000;">${sanitizeHTML(form.namaGuru)}</p>
        <p style="margin: 6pt 0; font-family: 'Times New Roman', serif; font-size: 11pt; color: #000000;">Guru ${sanitizeHTML(form.mapel)}</p>
        <p style="margin: 6pt 0; font-family: 'Times New Roman', serif; font-size: 11pt; color: #000000;">${sanitizeHTML(form.institusi)}</p>
        <br>
        <p style="margin: 6pt 0; font-family: 'Times New Roman', serif; font-size: 11pt; color: #000000;">Tanggal: ${new Date().toLocaleDateString(
          "id-ID",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        )}</p>
      </div>
      <div style="margin-top: 24pt; font-size: 10pt; text-align: center; font-family: 'Times New Roman', serif; color: #000000;">
        <p>Dibuat dengan Generator Modul Ajar (RPM) • Kurikulum Berbasis Cinta (KBC)</p>
        <p>© ${new Date().getFullYear()} • Disusun oleh: ${sanitizeHTML(form.namaGuru)}</p>
      </div>
    `;

    // Create the final HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Modul Ajar ${sanitizeHTML(form.mapel)}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
              <w:ValidateAgainstSchemas/>
              <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
              <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
              <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
              <w:Compatibility>
                <w:BreakWrappedTables/>
                <w:SnapToGridInCell/>
                <w:WrapTextWithPunct/>
                <w:UseAsianBreakRules/>
                <w:DontGrowAutofit/>
                <w:SplitPgBreakAndParaMark/>
                <w:EnableOpenTypeKerning/>
                <w:DontFlipMirrorIndents/>
                <w:OverrideTableStyleHps/>
              </w:Compatibility>
              <w:BrowserLevel>MicrosoftInternetExplorer4</w:BrowserLevel>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: A4 portrait;
              margin: 2.54cm 2.54cm 2.54cm 2.54cm;
              mso-page-orientation: portrait;
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.5;
              margin: 0;
              padding: 0;
              color: #000000;
            }
            * {
              color: #000000;
            }
          </style>
        </head>
        <body>
          ${htmlOutput}
          ${signatureSection}
        </body>
      </html>
    `;

    // Create a blob with the HTML content
    const blob = new Blob(["\ufeff" + htmlContent], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Modul_Ajar_${form.mapel.replace(/[^a-zA-Z0-9]/g, "_")}_${form.kelas}_${new Date().toISOString().split("T")[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    // Scroll ke atas sebelum reset
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    setCurrentStep(1);
    setModuleText("");
    setError("");
    setLoadingProgress(0);
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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* HEADER WITH CARD - Warna biru muda kehijauan */}
        <header className="mb-8">
          <div className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
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
                Sesuai dengan Peraturan Kurikulum Merdeka & Kurikulum Berbasis Cinta
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-white">
                GENERATOR MODUL AJAR (RPM)
              </h1>
              <div className="w-24 h-1 bg-white mx-auto mb-4 rounded-full"></div>
              <p className="text-xl md:text-2xl font-light opacity-90 text-white">
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
                  <span>Format A4</span>
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentStep >= 1 ? "bg-teal-500" : "bg-gray-300"}`}
              >
                1
              </div>
              <span
                className={`ml-2 font-medium ${currentStep >= 1 ? "text-teal-600" : "text-gray-500"}`}
              >
                Informasi Dasar
              </span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div
                className={`h-full ${currentStep >= 2 ? "bg-teal-500" : ""}`}
                style={{ width: currentStep >= 2 ? "100%" : "0%" }}
              ></div>
            </div>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentStep >= 2 ? "bg-teal-500" : "bg-gray-300"}`}
              >
                2
              </div>
              <span
                className={`ml-2 font-medium ${currentStep >= 2 ? "text-teal-600" : "text-gray-500"}`}
              >
                Detail Pembelajaran
              </span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div
                className={`h-full ${currentStep >= 3 ? "bg-teal-500" : ""}`}
                style={{ width: currentStep >= 3 ? "100%" : "0%" }}
              ></div>
            </div>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentStep >= 3 ? "bg-teal-500" : "bg-gray-300"}`}
              >
                3
              </div>
              <span
                className={`ml-2 font-medium ${currentStep >= 3 ? "text-teal-600" : "text-gray-500"}`}
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
                className="w-5 h-5 text-teal-600"
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
                <h3 className="font-semibold text-teal-600 text-sm uppercase tracking-wide">
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
                    placeholder="Contoh: SMKN 1 Surabaya"
                    required
                  />
                </div>
              </div>

              {/* Informasi Akademik */}
              <div className="space-y-4">
                <h3 className="font-semibold text-teal-600 text-sm uppercase tracking-wide">
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
                    placeholder="Contoh: Basis Data"
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
                    <option>Fase A (SD Kelas 1-2)</option>
                    <option>Fase B (SD Kelas 3-4)</option>
                    <option>Fase C (SD Kelas 5-6)</option>
                    <option>Fase D (SMP Kelas 7-9)</option>
                    <option>Fase E (SMA/SMK Kelas 10)</option>
                    <option>Fase F (SMA/SMK Kelas 11-12)</option>
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
                    placeholder="Contoh: (XI atau 11)"
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
                    // Scroll ke atas sebelum validasi
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    
                    const validationError = validateStep1();
                    if (validationError) {
                      setError(validationError);
                      return;
                    }
                    setError("");
                    setCurrentStep(2);
                  }}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
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
                className="w-5 h-5 text-teal-600"
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
                <h3 className="font-semibold text-teal-600 text-sm uppercase tracking-wide">
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
                      Total Waktu Per Pertemuan (menit)*
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
                <h3 className="font-semibold text-teal-600 text-sm uppercase tracking-wide">
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
                        className="accent-teal-600"
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
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setCurrentStep(1);
                  }}
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
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
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
                <div className="w-24 h-24 mx-auto mb-8 relative">
                  {/* Circular progress bar */}
                  <div className="absolute inset-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${loadingProgress * 2.83} 283`}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-300 ease-out"
                      />
                    </svg>
                  </div>
                  {/* Percentage text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-teal-700">
                      {Math.round(loadingProgress)}%
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  {loadingProgress < 30 && "Mempersiapkan data..."}
                  {loadingProgress >= 30 &&
                    loadingProgress < 70 &&
                    "Mengirim permintaan ke server..."}
                  {loadingProgress >= 70 &&
                    loadingProgress < 95 &&
                    "Membuat modul ajar..."}
                  {loadingProgress >= 95 && "Menyelesaikan..."}
                </h3>

                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Mohon tunggu sebentar, sistem sedang membuat modul ajar yang
                  sesuai dengan input Anda.
                </p>

                {/* Detailed progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto mb-4">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-emerald-500 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>

                <div className="flex justify-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    Mempersiapkan
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    Mengirim data
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    Membuat modul
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    Selesai
                  </span>
                </div>
              </div>
            ) : moduleText ? (
              <>
                {/* Header Output */}
                <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        Modul Ajar Hasil Generate
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Format: Tabel • Kertas A4 • Siap Unduh
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={exportToDocx}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 text-sm"
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
                        Unduh .DOC
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Preview - A4 Paper Style */}
                <div className="p-6 bg-gray-100 overflow-auto">
                  <div
                    className="max-w-4xl mx-auto bg-white shadow-lg"
                    style={{ minHeight: "1122px" }}
                  >
                    <div className="p-8" style={{ minHeight: "1122px" }}>
                      <div className="prose prose-sm max-w-none">
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
                                className="border border-gray-300 bg-teal-600 text-white px-4 py-2 text-left font-semibold"
                                {...props}
                              />
                            ),
                            td: ({ node, ...props }) => (
                              <td
                                className="border border-gray-300 px-4 py-2"
                                {...props}
                              />
                            ),
                            h1: ({ children, ...props }) => {
                              const text = String(children);
                              // Check if this is the main title or mapel title
                              if (text === "Modul Ajar") {
                                return (
                                  <h1
                                    className="text-xl font-bold text-center mb-2"
                                    {...props}
                                  >
                                    {children}
                                  </h1>
                                );
                              } else {
                                return (
                                  <h1
                                    className="text-xl font-bold text-center mb-4"
                                    {...props}
                                  >
                                    {children}
                                  </h1>
                                );
                              }
                            },
                            h2: ({ children, ...props }) => (
                              <h2
                                className="text-lg font-bold mt-6 mb-3"
                                {...props}
                              >
                                {children}
                              </h2>
                            ),
                            h3: ({ children, ...props }) => (
                              <h3
                                className="text-base font-semibold mt-4 mb-2"
                                {...props}
                              >
                                {children}
                              </h3>
                            ),
                            p: ({ children, ...props }) => {
                              // Check if this is a quoted title
                              const text = String(children);
                              if (text.startsWith('"') && text.endsWith('"')) {
                                return (
                                  <p
                                    className="text-center italic mb-4"
                                    {...props}
                                  >
                                    {children}
                                  </p>
                                );
                              }

                              // Check if this is part of LKPD section
                              const textContent = text.toLowerCase();
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
                              const textContent =
                                String(children).toLowerCase();
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
                  </div>
                </div>

                {/* Create New Button */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="flex justify-center">
                    <button
                      onClick={resetForm}
                      className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
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
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      setCurrentStep(2);
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Mulai Ulang
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Bagian FAQ */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pertanyaan Umum (FAQ)</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-700">❓ Bagaimana cara menggunakan generator ini?</p>
                  <p className="text-sm text-gray-600 mt-1">Isi semua form dengan data yang sesuai, kemudian klik "Buat Modul Ajar".</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">❓ Apakah modul yang dihasilkan sesuai kurikulum?</p>
                  <p className="text-sm text-gray-600 mt-1">Ya, modul disusun sesuai Kurikulum Merdeka dan Kurikulum Berbasis Cinta.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">❓ Bisakah saya mengedit hasil modul?</p>
                  <p className="text-sm text-gray-600 mt-1">Ya, hasil bisa diedit langsung di Microsoft Word setelah diunduh.</p>
                </div>
              </div>
            </div>
            
            {/* Bagian Kontak */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Butuh Bantuan?</h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-lg border border-teal-100">
                  <p className="font-medium text-gray-700 mb-2">💬 Chat via WhatsApp</p>
                  <p className="text-sm text-gray-600 mb-3">Punya pertanyaan spesifik? Hubungi kami via WhatsApp untuk konsultasi langsung.</p>
                  <a
                    href="https://wa.me/6285785964920?text=Halo%20saya%20mau%20bertanya%20tentang%20Generator%20Modul%20Ajar%20(RPM)"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.897 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411" />
                    </svg>
                    Chat via WhatsApp
                  </a>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Jam operasional: Senin-Jumat, 08:00-17:00 WIB</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Copyright dan kredit */}
          <div className="text-center text-gray-500 text-sm border-t border-gray-100 pt-6">
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
          </div>
        </footer>
      </div>
    </main>
  );
}