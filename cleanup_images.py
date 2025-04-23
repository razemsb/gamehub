import os
import json

def main():
    # Загружаем JSON с данными
    with open('api/data.json', 'r', encoding='utf-8') as f:
        games = json.load(f)

    # Собираем список используемых изображений
    used_images = set()
    for game in games:
        # Добавляем основное изображение
        used_images.add(game['img'])
        
        # Добавляем изображения из галереи
        if 'media' in game and 'gallery' in game['media']:
            for img in game['media']['gallery']:
                used_images.add(img)
        
        # Добавляем видео (если есть)
        if 'media' in game and 'video' in game['media']:
            used_images.add(game['media']['video'])

    # Получаем список всех файлов в папке img
    img_files = os.listdir('img')
    
    # Удаляем неиспользуемые изображения
    for img_file in img_files:
        if img_file not in used_images:
            try:
                os.remove(os.path.join('img', img_file))
                print(f"Удалено неиспользуемое изображение: {img_file}")
            except Exception as e:
                print(f"Ошибка при удалении {img_file}: {e}")

    # Выводим статистику
    print(f"\nСтатистика:")
    print(f"Всего файлов в папке img: {len(img_files)}")
    print(f"Используемых изображений: {len(used_images)}")
    print(f"Удалено файлов: {len(img_files) - len(used_images)}")

if __name__ == "__main__":
    main() 