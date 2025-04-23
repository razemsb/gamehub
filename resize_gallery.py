import os
import json
from PIL import Image

def resize_image(input_path, output_path, size=(1000, 675)):
    try:
        with Image.open(input_path) as img:
            # Сохраняем пропорции
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Создаем новое изображение с белым фоном
            new_img = Image.new('RGB', size, (255, 255, 255))
            
            # Вычисляем позицию для центрирования
            x = (size[0] - img.width) // 2
            y = (size[1] - img.height) // 2
            
            # Вставляем изображение по центру
            new_img.paste(img, (x, y))
            
            # Сохраняем результат
            new_img.save(output_path, quality=95)
            print(f"Изменен размер: {output_path}")
            return True
    except Exception as e:
        print(f"Ошибка при изменении размера {input_path}: {e}")
        return False

def main():
    # Загружаем JSON с данными
    with open('api/data.json', 'r', encoding='utf-8') as f:
        games = json.load(f)

    # Создаем папку для обработанных изображений
    processed_dir = 'img/processed'
    if not os.path.exists(processed_dir):
        os.makedirs(processed_dir)

    # Собираем список всех используемых изображений
    used_images = set()
    for game in games:
        # Добавляем основное изображение
        used_images.add(game['img'])
        
        # Добавляем изображения из галереи
        if 'media' in game and 'gallery' in game['media']:
            for img in game['media']['gallery']:
                used_images.add(img)

    # Обрабатываем все изображения
    for img_file in used_images:
        input_path = os.path.join('img', img_file)
        output_path = os.path.join(processed_dir, img_file)
        
        # Проверяем, существует ли исходный файл
        if os.path.exists(input_path):
            resize_image(input_path, output_path)
        else:
            print(f"Файл не найден: {input_path}")

    print("\nОбработка завершена!")
    print(f"Обработанные изображения сохранены в папке: {processed_dir}")

if __name__ == "__main__":
    main() 