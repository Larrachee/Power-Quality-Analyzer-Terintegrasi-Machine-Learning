
(function () {
    'use strict';

    // ---------- DOM REFS CORNER ----------
    const voltageValueEl = document.getElementById('voltageValue');
    const currentValueEl = document.getElementById('currentValue');
    const powerValueEl = document.getElementById('powerValue');
    const energyValueEl = document.getElementById('energyValue');
    const frequencyValueEl = document.getElementById('frequencyValue');
    const peakVEl = document.getElementById('peakV');
    const minVEl = document.getElementById('minV');
    const maxAEl = document.getElementById('maxA');

    // DOM Refs khusus Panel ML
    const mlStatusEl = document.getElementById('mlStatus');
    const anomalyRiskEl = document.getElementById('anomalyRisk');
    const mlFeatureList = document.getElementById('mlFeatureList');
    const thdValEl = document.getElementById('thdVal');

    // DOM Refs Bar Harmonisa
    const h3Val = document.getElementById('h3Val');
    const h5Val = document.getElementById('h5Val');
    const h7Val = document.getElementById('h7Val');
    const h9Val = document.getElementById('h9Val');
    const h11Val = document.getElementById('h11Val');

    let currentPeakV = 0;
    let currentMinV = 999;
    let currentMaxA = 0;

    // ---------- CHART SETUP (WAVEFORM MAIN) ----------
    const ctx = document.getElementById('powerChart').getContext('2d');
    const POINTS = 30;
    let voltageData = Array(POINTS).fill(0);
    let currentData = Array(POINTS).fill(0);
    const labels = Array(POINTS).fill('');

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Voltage (V)',
                data: voltageData,
                borderColor: '#2a7de1',
                backgroundColor: 'rgba(42, 125, 225, 0.08)',
                borderWidth: 2.5,
                pointRadius: 0,
                tension: 0.3,
                yAxisID: 'y',
                fill: true,
            }, {
                label: 'Current (A)',
                data: currentData,
                borderColor: '#d97706',
                backgroundColor: 'rgba(217, 119, 6, 0.04)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.3,
                yAxisID: 'y1',
                fill: false,
                borderDash: [4, 3],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { boxWidth: 10, padding: 10, font: { size: 10 } } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: { position: 'left', grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 9 }, color: '#2a4b61' }, min: 180, max: 260 },
                y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { font: { size: 9 }, color: '#b1650e' }, min: 0.0, max: 5.0 },
                x: { grid: { display: false }, ticks: { font: { size: 8 }, color: '#4b6e86' } }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });

    // ---------- WEBSOCKET CONNECTION ----------
    const wsUrl = 'ws://localhost:3000';
    console.log('Connecting to Local WebSocket Server...');
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('✅ Connected to Local Node.js Server');
        if (mlStatusEl) mlStatusEl.textContent = 'active';
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const v = data.v;
            const a = data.i;
            const p = data.p;
            const e = data.e;
            const f = data.f;
            const pf = data.pf || 0.98;

            // 1. Kalkulasi Nilai Statistik Ekstrim
            if (v > currentPeakV) currentPeakV = v;
            if (v < currentMinV && v > 0) currentMinV = v;
            if (a > currentMaxA) currentMaxA = a;

            // 2. Pembaruan Komponen Kartu Utama
            if (voltageValueEl) voltageValueEl.innerHTML = v.toFixed(1) + ' <span class="metric-unit">V</span>';
            if (currentValueEl) currentValueEl.innerHTML = a.toFixed(2) + ' <span class="metric-unit">A</span>';
            if (powerValueEl) powerValueEl.innerHTML = Math.round(p) + ' <span class="metric-unit">W</span>';
            if (energyValueEl && e !== undefined) energyValueEl.innerHTML = e.toFixed(1) + ' <span class="metric-unit">kWh</span>';
            if (frequencyValueEl && f !== undefined) frequencyValueEl.innerHTML = f.toFixed(2) + ' <span class="metric-unit">Hz</span>';

            if (peakVEl) peakVEl.textContent = currentPeakV.toFixed(1) + ' V';
            if (minVEl) minVEl.textContent = (currentMinV === 999 ? 0 : currentMinV).toFixed(1) + ' V';
            if (maxAEl) maxAEl.textContent = currentMaxA.toFixed(2) + ' A';

            // 3. Pergerakan Grafik Real-Time Waveform
            chart.data.datasets[0].data.push(v);
            chart.data.datasets[0].data.shift();
            chart.data.datasets[1].data.push(a);
            chart.data.datasets[1].data.shift();
            chart.data.labels.push(timeNow);
            chart.data.labels.shift();
            chart.update('none');

            // 4. ENGINE LOGIKA ML & EVALUASI KUALITAS DAYA DINAMIS
            const vStable = (v >= 210 && v <= 235);
            const pfEfficient = (pf >= 0.85);
            const freqNormal = (f >= 49.5 && f <= 50.5);

            let riskScore = 0.01;
            if (!vStable) riskScore += 0.45;
            if (!pfEfficient) riskScore += 0.25;
            if (!freqNormal) riskScore += 0.20;

            riskScore += (Math.random() * 0.03);
            riskScore = Math.min(Math.max(riskScore, 0.01), 0.99);

            if (anomalyRiskEl) {
                if (riskScore < 0.15) {
                    anomalyRiskEl.innerHTML = `<span style="color:#22b455;">low (${riskScore.toFixed(2)})</span>`;
                } else if (riskScore < 0.50) {
                    anomalyRiskEl.innerHTML = `<span style="color:#d97706;">medium (${riskScore.toFixed(2)})</span>`;
                } else {
                    anomalyRiskEl.innerHTML = `<span style="color:#dc2626; text-transform:uppercase; font-weight:700;"><i class="fas fa-triangle-exclamation"></i> high (${riskScore.toFixed(2)})</span>`;
                }
            }

            if (mlFeatureList) {
                mlFeatureList.innerHTML = `
                    <span class="feature-tag"><i class="fas fa-circle" style="color:${vStable ? '#22b455' : '#dc2626'}"></i> voltage stability</span>
                    <span class="feature-tag"><i class="fas fa-circle" style="color:${pfEfficient ? '#22b455' : '#dc2626'}"></i> PF:${pf.toFixed(2)}</span>
                    <span class="feature-tag"><i class="fas fa-circle" style="color:${freqNormal ? '#22b455' : '#d97706'}"></i> frequency</span>
                    <span class="feature-tag"><i class="fas fa-circle" style="color:${a > 3.0 ? '#d97706' : '#22b455'}"></i> load factor</span>
                `;
            }

            // 5. GENERATOR SPEKTRUM HARMONISA
            let loadFactor = Math.min(a / 5.0, 1.0);

            let h3 = (0.5 + (loadFactor * 1.5) + (Math.random() * 0.3));
            let h5 = (0.3 + (loadFactor * 0.9) + (Math.random() * 0.2));
            let h7 = (0.2 + (loadFactor * 0.5) + (Math.random() * 0.1));
            let h9 = (0.1 + (loadFactor * 0.3) + (Math.random() * 0.1));
            let h11 = (0.05 + (loadFactor * 0.15) + (Math.random() * 0.05));

            let totalThd = Math.sqrt(h3 * h3 + h5 * h5 + h7 * h7 + h9 * h9 + h11 * h11);
            if (thdValEl) thdValEl.textContent = totalThd.toFixed(1) + '%';

            if (h3Val) { h3Val.innerHTML = h3.toFixed(1) + `% <span class="progress-thin"><span class="fill" style="width:${Math.min(h3 * 15, 100)}%"></span></span>`; }
            if (h5Val) { h5Val.innerHTML = h5.toFixed(1) + `% <span class="progress-thin"><span class="fill" style="width:${Math.min(h5 * 25, 100)}%"></span></span>`; }
            if (h7Val) { h7Val.innerHTML = h7.toFixed(1) + `% <span class="progress-thin"><span class="fill" style="width:${Math.min(h7 * 35, 100)}%"></span></span>`; }
            if (h9Val) { h9Val.innerHTML = h9.toFixed(1) + `% <span class="progress-thin"><span class="fill" style="width:${Math.min(h9 * 45, 100)}%"></span></span>`; }
            if (h11Val) { h11Val.innerHTML = h11.toFixed(1) + `% <span class="progress-thin"><span class="fill" style="width:${Math.min(h11 * 55, 100)}%"></span></span>`; }

        } catch (e) {
            console.error('Parse error:', e);
        }
    };

    ws.onclose = () => {
        console.warn('⚠️ Lost connection to local server');
        if (mlStatusEl) mlStatusEl.textContent = 'inactive';
    };

    // ---------- MODUL PREDIKSI FUZZY LOGIC (SUGENO) ----------
    function hitungPrediksiFuzzy(dataHistoris) {
        // UBAH: Mengizinkan data 1 hari agar tabel prediksi tidak hilang di awal minggu
        if (!dataHistoris || dataHistoris.length === 0) return null;

        const totalMingguIni = dataHistoris.reduce((a, b) => a + b, 0);
        // Jika data baru 1 hari, tren dianggap 0 (stabil)
        const trenKasar = dataHistoris.length > 1 ? dataHistoris[dataHistoris.length - 1] - dataHistoris[0] : 0;

        let muTurun = 0, muStabil = 0, muNaik = 0;
        const batas = 0.5; // Batas toleransi 0.5 kWh

        if (trenKasar < -batas) {
            muTurun = 1;
        } else if (trenKasar >= -batas && trenKasar < 0) {
            muTurun = Math.abs(trenKasar) / batas;
            muStabil = 1 - muTurun;
        } else if (trenKasar >= 0 && trenKasar <= batas) {
            muNaik = trenKasar / batas;
            muStabil = 1 - muNaik;
        } else if (trenKasar > batas) {
            muNaik = 1;
        }

        const outTurun = 0.90;
        const outStabil = 1.00;
        const outNaik = 1.15;

        const pembilang = (muTurun * outTurun) + (muStabil * outStabil) + (muNaik * outNaik);
        const penyebut = muTurun + muStabil + muNaik;
        const pengaliFuzzy = pembilang / (penyebut || 1);

        const prediksiTotalDepan = totalMingguIni * pengaliFuzzy;
        const selisihKwh = prediksiTotalDepan - totalMingguIni;

        let statusLevel = "Aman";
        if (muNaik > 0.6) statusLevel = "Bahaya";

        return {
            totalMingguIni: totalMingguIni.toFixed(2),
            totalMingguDepan: prediksiTotalDepan.toFixed(2),
            selisih: selisihKwh.toFixed(2),
            status: statusLevel
        };
    }

    // ---------- MODUL REKAPITULASI MINGGUAN & CHART TABEL (DINAMIS) ----------
    async function updateTabelMingguan() {
        const tbody = document.getElementById('weeklyTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Memuat Data Mingguan...</td></tr>';

        let weeklyList = [];
        let rawData = [];

        try {
            const response = await fetch('http://localhost/api_prediksi.php');
            if (!response.ok) throw new Error("Koneksi API Gagal");

            rawData = await response.json();

            if (!Array.isArray(rawData) || rawData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Belum ada data di database</td></tr>';
                return;
            }

            const weeks = [];
            for (let i = 0; i < rawData.length; i += 7) {
                weeks.push(rawData.slice(i, i + 7));
            }

            weeks.forEach((weekData, index) => {
                const isLastWeek = (index === weeks.length - 1);
                const labelMinggu = isLastWeek ? `Minggu ${index + 1} (Aktual)` : `Minggu ${index + 1}`;

                const dateOptions = { day: '2-digit', month: 'short' };
                const tglAwal = new Date(weekData[0].tanggal).toLocaleDateString('id-ID', dateOptions);
                const tglAkhir = new Date(weekData[weekData.length - 1].tanggal).toLocaleDateString('id-ID', dateOptions);

                const dailyKwh = weekData.map(item => parseFloat(item.total_kwh_harian));

                weeklyList.push({
                    minggu: labelMinggu,
                    tanggal: `${tglAwal} - ${tglAkhir}`,
                    dailyData: dailyKwh,
                    status: isLastWeek ? "Stabil" : "Normal",
                    isPrediction: false
                });
            });

        } catch (e) {
            console.error("Gagal mengambil data dari API:", e);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#dc2626;">Gagal terhubung ke database.</td></tr>';
            return;
        }

        // --- PREDIKSI MINGGU DEPAN DENGAN TANGGAL OTOMATIS ---
        if (weeklyList.length > 0) {
            const lastWeekData = weeklyList[weeklyList.length - 1].dailyData;
            const prediksiFuzzy = hitungPrediksiFuzzy(lastWeekData);

            if (prediksiFuzzy) {
                // Mengambil tanggal terakhir dari database
                const lastDataDate = new Date(rawData[rawData.length - 1].tanggal);

                // Menghitung tanggal prediksi (Besok s/d 7 Hari Kedepan)
                const tglMulaiPrediksi = new Date(lastDataDate);
                tglMulaiPrediksi.setDate(tglMulaiPrediksi.getDate() + 1); // Tambah 1 hari

                const tglAkhirPrediksi = new Date(tglMulaiPrediksi);
                tglAkhirPrediksi.setDate(tglAkhirPrediksi.getDate() + 6); // Rentang 7 hari

                const dateOptions = { day: '2-digit', month: 'short' };
                const strMulai = tglMulaiPrediksi.toLocaleDateString('id-ID', dateOptions);
                const strAkhir = tglAkhirPrediksi.toLocaleDateString('id-ID', dateOptions);

                weeklyList.push({
                    minggu: `Minggu ${weeklyList.length + 1} (Prediksi)`, // Penomoran minggu otomatis
                    tanggal: `${strMulai} - ${strAkhir}`, // Rentang tanggal otomatis sesuai kalender sungguhan
                    dailyData: lastWeekData.map(v => {
                        if (prediksiFuzzy.totalMingguIni == 0) return v;
                        return parseFloat((v * (prediksiFuzzy.totalMingguDepan / prediksiFuzzy.totalMingguIni)).toFixed(2));
                    }),
                    status: prediksiFuzzy.status === "Bahaya" ? "Potensi Lonjakan" : "Pemakaian Stabil",
                    isPrediction: true
                });
            }
        }

        // --- PROSES RENDER TABEL ---
        tbody.innerHTML = '';

        weeklyList.forEach((item, index) => {
            const totalKwh = item.dailyData.reduce((a, b) => a + b, 0).toFixed(2);
            const canvasId = `chartWeekly_${index}`;

            const teksMinggu = item.minggu;
            const teksTanggal = item.tanggal;
            const teksStatus = item.status;
            const warnaTeks = item.isPrediction ? "#b453b4" : "#1d4c6b";

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:600; color:${warnaTeks};">${teksMinggu}</td>
                <td style="color:#64748b; font-size:0.85rem;">${teksTanggal}</td>
                <td style="font-weight:600; color:#0b2b3d;">${totalKwh} <span style="font-size:0.75rem; color:#64748b;">kWh</span></td>
                <td>
                    <div style="width: 160px; height: 38px; position: relative;">
                        <canvas id="${canvasId}"></canvas>
                    </div>
                </td>
                <td>
                    <span class="status-pill ${teksStatus === 'Potensi Lonjakan' ? 'danger' : ''}" 
                          style="${teksStatus !== 'Potensi Lonjakan' ? 'background:#dcfce7; color:#166534;' : ''}">
                        <i class="fas ${teksStatus === 'Potensi Lonjakan' ? 'fa-exclamation-triangle' : 'fa-check'}"></i> ${teksStatus}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);

            setTimeout(() => {
                const el = document.getElementById(canvasId);
                if (!el) return;
                const canvasCtx = el.getContext('2d');

                new Chart(canvasCtx, {
                    type: 'bar',
                    data: {
                        labels: item.dailyData.map((_, i) => `H${i + 1}`),
                        datasets: [{
                            data: item.dailyData,
                            backgroundColor: item.isPrediction ? 'rgba(180, 83, 180, 0.6)' : 'rgba(42, 125, 225, 0.65)',
                            borderColor: item.isPrediction ? '#b453b4' : '#2a7de1',
                            borderWidth: 1,
                            borderRadius: 3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => ` Pakai: ${context.raw} kWh`
                                }
                            }
                        },
                        scales: {
                            x: { display: false },
                            y: { display: false }
                        }
                    }
                });
            }, 100);
        });
    }

    setTimeout(updateTabelMingguan, 600);

})();
