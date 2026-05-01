const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

const RASI_NAMES = [
  'Mesha', 'Rishaba', 'Mithuna', 'Kataka', 'Simha', 'Kanya',
  'Thula', 'Vrischika', 'Dhanus', 'Makara', 'Kumbha', 'Meena'
];

// South Indian chart layout (fixed houses)
// Row 0: H12, H1, H2, H3
// Row 1: H11, [blank], [blank], H4
// Row 2: H10, [blank], [blank], H5
// Row 3: H9, H8, H7, H6
const CHART_LAYOUT = [12, 1, 2, 3, 11, null, null, 4, 10, null, null, 5, 9, 8, 7, 6];

function drawSouthIndianChart(doc, planets = {}, lagna = 1, title = 'Birth Chart', startX = 20, startY = 40) {
  const cellSize = 30;
  const gridSize = 4;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, startX + (cellSize * gridSize) / 2, startY - 3, { align: 'center' });

  // Build planet-to-house map
  const planetsByHouse = {};
  for (const [name, data] of Object.entries(planets)) {
    const h = data.house;
    if (!planetsByHouse[h]) planetsByHouse[h] = [];
    planetsByHouse[h].push(name.slice(0, 2).toUpperCase());
  }
  // Add lagna marker
  if (!planetsByHouse[1]) planetsByHouse[1] = [];
  if (!planetsByHouse[1].includes('La')) planetsByHouse[1].unshift('La');

  // Draw cells
  doc.setLineWidth(0.5);
  doc.setDrawColor(100, 40, 40); // maroon border

  for (let i = 0; i < CHART_LAYOUT.length; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    const x = startX + col * cellSize;
    const y = startY + row * cellSize;
    const houseNum = CHART_LAYOUT[i];

    if (houseNum === null) {
      // Center blank cells — draw with light fill
      doc.setFillColor(253, 248, 235);
      doc.rect(x, y, cellSize, cellSize, 'FD');
      continue;
    }

    doc.setFillColor(255, 252, 245);
    doc.rect(x, y, cellSize, cellSize, 'FD');

    // House number (small, top-left)
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 100, 100);
    doc.text(String(houseNum), x + 2, y + 5);

    // Rasi name (very small)
    doc.setFontSize(5);
    doc.text(RASI_NAMES[(houseNum - 1)] || '', x + 2, y + 9);

    // Planet names in this house
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 20, 20);
    const planetsInHouse = planetsByHouse[houseNum] || [];
    planetsInHouse.forEach((p, idx) => {
      doc.text(p, x + 5, y + 16 + idx * 6);
    });
    doc.setTextColor(0, 0, 0);
  }

  // Draw center logo area (2x2 middle)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(155, 44, 44);
  doc.text('Jatham', startX + cellSize * 1.5 + 3, startY + cellSize * 2 + 5, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

function drawPoruthamsTable(doc, poruthams = {}, doshaAnalysis = {}, startY = 20) {
  const PORUTHAM_NAMES = {
    dina: 'Dina', gana: 'Gana', yoni: 'Yoni', rasi: 'Rasi',
    rasiAthipathi: 'Rasi Athipathi', rajju: 'Rajju *', vedha: 'Vedha *',
    vasya: 'Vasya', mahendra: 'Mahendra', streeDeergha: 'Stree Deergha'
  };

  const WEIGHTS_DISPLAY = {
    dina: 'Standard', gana: 'Important', yoni: 'Standard', rasi: 'Standard',
    rasiAthipathi: 'Standard', rajju: 'CRITICAL', vedha: 'CRITICAL',
    vasya: 'Standard', mahendra: 'Standard', streeDeergha: 'Standard'
  };

  const COLOR_MAP = {
    pass: [34, 139, 34],        // green
    conditional: [200, 140, 0], // amber
    fail: [178, 34, 34]         // red
  };

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Porutham (Compatibility) Summary', 20, startY);
  startY += 8;

  // Table header
  doc.setFillColor(155, 44, 44);
  doc.rect(20, startY, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Porutham', 25, startY + 5.5);
  doc.text('Result', 95, startY + 5.5);
  doc.text('Weight', 125, startY + 5.5);
  doc.text('Detail', 155, startY + 5.5, { maxWidth: 35 });
  startY += 8;

  let rowIndex = 0;
  for (const [key, val] of Object.entries(poruthams)) {
    const isEven = rowIndex % 2 === 0;
    if (isEven) doc.setFillColor(255, 252, 245);
    else doc.setFillColor(249, 246, 229);
    doc.rect(20, startY, 170, 8, 'F');

    doc.setTextColor(45, 55, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(PORUTHAM_NAMES[key] || key, 25, startY + 5.5);

    const color = COLOR_MAP[val.result] || [100, 100, 100];
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.text(val.result.toUpperCase(), 95, startY + 5.5);

    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(WEIGHTS_DISPLAY[key] || 'Standard', 125, startY + 5.5);
    doc.text((val.detail || '').slice(0, 25), 155, startY + 5.5);

    startY += 8;
    rowIndex++;
  }

  // Dosha summary row
  startY += 4;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(155, 44, 44);
  doc.text('Dosha Summary:', 20, startY);
  startY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(45, 55, 72);
  doc.setFontSize(8);
  if (doshaAnalysis.nadiDosham) doc.text('⚠ Nadi Dosham detected. Samyam check: ' + (doshaAnalysis.nadiSamyam ? 'Cancelled' : 'NOT cancelled'), 25, startY);
  else doc.text('✓ No Nadi Dosham', 25, startY);
  startY += 5;
  if (doshaAnalysis.chevvaiSamyam) doc.text('✓ Chevvai Samyam (mutual cancellation present)', 25, startY);

  return startY + 10;
}

const generateAstrologerPDF = async (matchId, profileA, profileB, matchResult) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PAGE_W = 210;

      // ─── PAGE 1: COVER ────────────────────────────────────────────────────────
      doc.setFillColor(155, 44, 44);
      doc.rect(0, 0, PAGE_W, 60, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text('Jatham', PAGE_W / 2, 30, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Thirumana Porutham — Compatibility Report', PAGE_W / 2, 40, { align: 'center' });

      doc.setTextColor(45, 55, 72);
      doc.setFontSize(11);
      doc.text(`${profileA.candidateName} & ${profileB.candidateName}`, PAGE_W / 2, 80, { align: 'center' });

      const now = new Date();
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Report Generated: ${now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, PAGE_W / 2, 90, { align: 'center' });
      doc.text(`Report ID: ${matchId}`, PAGE_W / 2, 95, { align: 'center' });

      // Overall score box
      const scoreColor = matchResult.overallScore >= 70 ? [34, 139, 34] : matchResult.overallScore >= 50 ? [200, 140, 0] : [178, 34, 34];
      doc.setFillColor(...scoreColor);
      doc.roundedRect(75, 105, 60, 25, 5, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${matchResult.overallScore}%`, PAGE_W / 2, 118, { align: 'center' });
      doc.setFontSize(8);
      doc.text('Overall Compatibility', PAGE_W / 2, 125, { align: 'center' });

      // Hard reject warning
      if (matchResult.hasHardReject) {
        doc.setFillColor(255, 235, 235);
        doc.roundedRect(20, 135, PAGE_W - 40, 20, 3, 3, 'FD');
        doc.setTextColor(178, 34, 34);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('⚠ ADVISORY: A critical compatibility concern has been detected.', PAGE_W / 2, 144, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('Please review the Rajju/Vedha/Nadi analysis and consult a qualified astrologer.', PAGE_W / 2, 150, { align: 'center' });
      }

      // Disclaimer box
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(20, matchResult.hasHardReject ? 160 : 140, PAGE_W - 40, 28, 3, 3, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      const dY = matchResult.hasHardReject ? 165 : 145;
      doc.text('DISCLAIMER', PAGE_W / 2, dY, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      const disclaimerText = 'This compatibility analysis is generated by a rule-based system and is intended as a decision support tool only. It does not constitute astrological advice or a guarantee of marital compatibility. All results carry probabilistic language ("tendency toward", "risk of", "alignment suggests") and do not represent certainties. Please verify all results with a qualified Jyotish astrologer before making any marriage-related decisions.';
      const splitDisclaimer = doc.splitTextToSize(disclaimerText, PAGE_W - 50);
      doc.text(splitDisclaimer, PAGE_W / 2, dY + 5, { align: 'center' });

      // ─── PAGE 2: GROOM CHART ─────────────────────────────────────────────────
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(155, 44, 44);
      doc.text('Groom — Birth Chart', PAGE_W / 2, 20, { align: 'center' });

      drawSouthIndianChart(doc, profileA.astroData?.planets || {}, profileA.astroData?.lagna || 1, '', 30, 30);

      // Groom Details Table
      let gY = 165;
      doc.setFontSize(10);
      doc.setTextColor(45, 55, 72);
      doc.text('Planetary Details', 20, gY);
      gY += 5;

      const groomDetails = [
        ['Name', profileA.candidateName],
        ['Nakshatra', `${profileA.astroData?.nakshatraName || '—'} (Pada ${profileA.astroData?.pada || '—'})`],
        ['Rasi', profileA.astroData?.rasiName || '—'],
        ['Lagna', profileA.astroData?.lagnaName || '—'],
        ['Gana', (profileA.astroData?.gana || '—').toUpperCase()],
        ['Nadi', (profileA.astroData?.nadiType || '—').toUpperCase()],
        ['Yoni', (profileA.astroData?.yoniAnimal || '—')],
        ['Chevvai Dosham', profileA.astroData?.chevvaiDosham ? `YES (${profileA.astroData?.chevvaiDoshamType})` : 'No'],
        ['Calculation', profileA.astroData?.calculationMethod || 'Thirukkanitha'],
      ];

      for (const [label, value] of groomDetails) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 50, 50);
        doc.text(label + ':', 25, gY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(45, 55, 72);
        doc.text(String(value), 75, gY);
        gY += 6;
      }

      // ─── PAGE 3: BRIDE CHART ─────────────────────────────────────────────────
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(155, 44, 44);
      doc.text('Bride — Birth Chart', PAGE_W / 2, 20, { align: 'center' });

      drawSouthIndianChart(doc, profileB.astroData?.planets || {}, profileB.astroData?.lagna || 1, '', 30, 30);

      let bY = 165;
      doc.setFontSize(10);
      doc.setTextColor(45, 55, 72);
      doc.text('Planetary Details', 20, bY);
      bY += 5;

      const brideDetails = [
        ['Name', profileB.candidateName],
        ['Nakshatra', `${profileB.astroData?.nakshatraName || '—'} (Pada ${profileB.astroData?.pada || '—'})`],
        ['Rasi', profileB.astroData?.rasiName || '—'],
        ['Lagna', profileB.astroData?.lagnaName || '—'],
        ['Gana', (profileB.astroData?.gana || '—').toUpperCase()],
        ['Nadi', (profileB.astroData?.nadiType || '—').toUpperCase()],
        ['Yoni', (profileB.astroData?.yoniAnimal || '—')],
        ['Chevvai Dosham', profileB.astroData?.chevvaiDosham ? `YES (${profileB.astroData?.chevvaiDoshamType})` : 'No'],
        ['Calculation', profileB.astroData?.calculationMethod || 'Thirukkanitha'],
      ];

      for (const [label, value] of brideDetails) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 50, 50);
        doc.text(label + ':', 25, bY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(45, 55, 72);
        doc.text(String(value), 75, bY);
        bY += 6;
      }

      // ─── PAGE 4: PORUTHAM TABLE ───────────────────────────────────────────────
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(155, 44, 44);
      doc.text('Porutham Analysis', PAGE_W / 2, 15, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Pass: ${matchResult.passCount}/10  |  Conditional: ${matchResult.conditionalCount}  |  Fail: ${matchResult.failCount}  |  Score: ${matchResult.overallScore}%`, PAGE_W / 2, 22, { align: 'center' });

      drawPoruthamsTable(doc, matchResult.poruthams || {}, matchResult.doshaAnalysis || {}, 30);

      // ─── PAGE 5: AI REPORT ────────────────────────────────────────────────────
      if (matchResult.aiReport?.reportText) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(155, 44, 44);
        doc.text('AI Synthesis Report', PAGE_W / 2, 15, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 120, 120);
        doc.text('Generated by Anthropic Claude | For informational purposes only', PAGE_W / 2, 21, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(45, 55, 72);
        const reportLines = doc.splitTextToSize(matchResult.aiReport.reportText, PAGE_W - 40);
        doc.text(reportLines, 20, 30);
      }

      // ─── PAGE 6: ASTROLOGER NOTES ─────────────────────────────────────────────
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(155, 44, 44);
      doc.text("Astrologer's Assessment", PAGE_W / 2, 20, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('For use by a qualified Jyotish astrologer reviewing this chart pair', PAGE_W / 2, 27, { align: 'center' });

      // Blank lines for astrologer notes
      let noteY = 40;
      for (let i = 0; i < 20; i++) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, noteY, PAGE_W - 20, noteY);
        noteY += 8;
      }

      noteY += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(155, 44, 44);
      doc.text('Suggested Pariharams (Remedies)', 20, noteY);
      noteY += 8;

      for (let i = 0; i < 10; i++) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, noteY, PAGE_W - 20, noteY);
        noteY += 8;
      }

      // Signature line
      noteY += 10;
      doc.setDrawColor(100, 100, 100);
      doc.line(20, noteY, 90, noteY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Astrologer Signature & Seal', 20, noteY + 5);

      doc.line(120, noteY, PAGE_W - 20, noteY);
      doc.text('Date of Consultation', 120, noteY + 5);

      // Save PDF
      const pdfDir = path.join(__dirname, '../../data/pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const filePath = path.join(pdfDir, `${matchId}.pdf`);
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      fs.writeFileSync(filePath, pdfBuffer);

      resolve(filePath);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateAstrologerPDF
};
