<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "db_power_quality");

if ($conn->connect_error) {
    die(json_encode(["error" => "Koneksi gagal: " . $conn->connect_error]));
}

$sql = "SELECT 
            DATE(created_at) AS tanggal,
            ROUND(AVG(voltage), 1) AS rata_rata_tegangan,
            ROUND(MAX(current), 3) AS arus_tertinggi,
            ROUND(AVG(power), 1) AS rata_rata_daya,
            ROUND(MAX(energy) - MIN(energy), 3) AS total_kwh_harian,
            ROUND(AVG(power_factor), 2) AS rata_rata_pf
        FROM monitoring_pzem
        GROUP BY DATE(created_at)
        ORDER BY tanggal ASC";

$result = $conn->query($sql);
$data = array();

if ($result) {
    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}

// Ubah ke format JSON
echo json_encode($data);
$conn->close();
?>
