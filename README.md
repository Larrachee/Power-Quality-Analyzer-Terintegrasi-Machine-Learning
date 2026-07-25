# ⚡ Smart Power Quality Monitoring & Forecasting System

Sebuah sistem *Internet of Things* (IoT) berbasis ESP32 dan sensor PZEM-004T untuk memantau kualitas daya listrik secara *real-time*. Proyek ini dilengkapi dengan antarmuka *dashboard* interaktif, komunikasi WebSocket, dan prediksi pemakaian energi mingguan (kWh) menggunakan algoritma **Fuzzy Logic (Metode Sugeno)**.

Dashboard Preview (https://drive.google.com/file/d/1hljns7Tmy2qbbVdkSISsnCsLm5oKQlpZ/view?usp=drive_link)


## ✨ Fitur Utama
* **Real-Time Monitoring:** Pemantauan Tegangan (V), Arus (A), Daya (W), Energi (kWh), Frekuensi (Hz), dan Faktor Daya (PF) secara langsung tanpa *delay* menggunakan WebSocket.
* **Fuzzy Logic Forecasting:** Memprediksi total pemakaian listrik (kWh) untuk 7 hari ke depan berdasarkan data historis menggunakan *Fuzzy Inference System* (Sugeno).
* **Live Waveform Chart:** Visualisasi grafik pergerakan Arus dan Tegangan secara dinamis menggunakan Chart.js.
* **Harmonic Spectrum Estimation:** Estimasi simulasi parameter THD (Total Harmonic Distortion) berdasarkan persentase *load factor*.
* **Local Backend & Database:** Penyimpanan rekam jejak kelistrikan harian secara otomatis ke dalam *database* MySQL lokal.

---

## 🛠️ Tech Stack & Hardware

**Hardware:**
* Mikrokontroler ESP32
* Modul Sensor PZEM-004T v3.0
* Layar TFT (opsional untuk *display* lokal)
* Indikator LED & Buzzer (untuk notifikasi *overcurrent*)

**Software / Web Development:**
* **Firmware:** C++ (Arduino IDE)
* **Backend:** Node.js (HTTP & WebSocket Server)
* **REST API:** PHP native
* **Database:** MySQL (XAMPP)
* **Frontend:** HTML, CSS, Vanilla JavaScript, Chart.js

---

## ⚙️ Skema Instalasi & Konfigurasi

### 1. Konfigurasi Database (MySQL)
1. Instal dan jalankan [XAMPP](https://www.apachefriends.org/index.html), lalu aktifkan **MySQL** dan **Apache**.
2. Buka phpMyAdmin (`http://localhost/phpmyadmin`).
3. Buat *database* baru dengan nama `db_power_quality`.
4. Jalankan *query* SQL berikut untuk membuat tabel:
   ```sql
   CREATE TABLE `monitoring_pzem` (
     `id` int(11) NOT NULL AUTO_INCREMENT,
     `voltage` float NOT NULL,
     `current` float NOT NULL,
     `power` float NOT NULL,
     `energy` float NOT NULL,
     `frequency` float NOT NULL,
     `power_factor` float NOT NULL,
     `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
     PRIMARY KEY (`id`)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
   ```

### 2. Setup Backend (Node.js & PHP)
  1. Pastikan Node.js sudah terinstal.
  2. Buka terminal/CMD di dalam folder backend kamu.
  3. Instal dependensi yang dibutuhkan:
```
npm install mysql2 ws
```
  4. Jalankan server Node.js:
```
node server.js
```
  5. Pindahkan file api_prediksi.php ke dalam direktori instalasi XAMPP kamu (C:\xampp\htdocs\).


### 3. Setup Hardware (ESP32)
  1. Buka file program ESP32 di Arduino IDE.
  2. Pastikan kamu sudah menginstal library PZEM004Tv30, TFT_eSPI, dan HTTPClient.
  3. PENTING: Sesuaikan konfigurasi jaringan pada baris berikut:
```
const char* ssid = "NAMA_WIFI_KAMU"; 
const char* password = "PASSWORD_WIFI_KAMU";
// Ganti dengan IPv4 Address dari Laptop/PC server (cek via ipconfig di CMD)
const char* serverName = "[http://192.168.](http://192.168.)x.x:3000/";
```
  4. Hubungkan ESP32, lalu klik Upload.

### 4. Menjalankan Dashboard Frontend
  1. Buka file UI.js di text editor.
  2. Pastikan IP pada baris koneksi fetch API menunjuk ke localhost atau IP lokal yang tepat:
```
const response = await fetch('http://localhost/api_prediksi.php');
```
  3. Buka file index.html (atau nama file dashboard kamu) menggunakan browser, atau akses melalui http://localhost/nama_folder/index.html jika disimpan di htdocs.

     
### 🧠 Cara Kerja Fuzzy Logic (Forecasting)
Proyek ini mengimplementasikan logika fuzzy Sugeno untuk memprediksi lonjakan pemakaian. Sistem bekerja dengan cara:
Menarik seluruh data histori harian dari MySQL (via api_prediksi.php). Menghitung tren fluktuasi total daya dalam rentang minggu terakhir (batas toleransi dinilai pada 0.5 kWh). Memasukkan nilai tren ke dalam 3 himpunan fuzzy (Naik, Stabil, Turun). Melakukan defuzzifikasi dengan metode Weighted Average (Rata-rata Berbobot) untuk menghasilkan angka multiplier (pengali). Merender grafik batang prediksi minggu depan secara dinamis ke dashboard web.


### 🐛 Troubleshooting Umum
ESP32 mendapat error connection refused: Pastikan Windows Firewall dalam keadaan mati (atau buat Inbound Rule untuk membuka Port 3000), dan pastikan IP laptop pada kode ESP32 sudah benar.Tabel prediksi tidak muncul di web: Pastikan database MySQL menyala dan setidaknya memiliki rekaman data untuk minimal 2 hari yang berbeda, karena logika fuzzy membutuhkan perbandingan hari.Browser nge-lag (Freeze): Sistem WebSocket merender grafik 30-titik (waveform). Jika delay pengiriman HTTP POST di ESP32 dibuat terlalu cepat (di bawah 1000ms), browser bisa kehabisan memori. Pastikan interval baca di ESP32 dibatasi.
