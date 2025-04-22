<?php
header('Content-Type: application/json');
require_once 'data.php';

$input = json_decode(file_get_contents('php://input'), true);
$cartItems = $input['cart'];

foreach ($cartItems as $item) {
    $productId = $item['productId'];
    $product = array_filter($products, fn($p) => $p['id'] == $productId);
    $product = reset($product);

    if (!$product || $product['stock'] < $item['quantity']) {
        http_response_code(400);
        die(json_encode(['error' => "Товар ID {$productId} недоступен"]));
    }

    // Уменьшаем остаток
    $products = array_map(function($p) use ($productId, $item) {
        if ($p['id'] == $productId) $p['stock'] -= $item['quantity'];
        return $p;
    }, $products);
}

// Сохраняем заказ
$orderId = count($orders) + 1;
$orders[] = [
    'id' => $orderId,
    'items' => $cartItems,
    'status' => 'pending'
];

echo json_encode(['orderId' => $orderId]);
?>