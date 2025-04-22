<?php
header('Content-Type: application/json');
require_once 'data.php';

echo json_encode($products);
?>