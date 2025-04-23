import os
import json
import requests
from PIL import Image
from io import BytesIO
import time

def download_image(url, filename, size=(800, 450)):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            img = img.resize(size, Image.Resampling.LANCZOS)
            img.save(filename)
            print(f"Скачано: {filename}")
            return True
    except Exception as e:
        print(f"Ошибка при скачивании {filename}: {e}")
    return False

def main():
    # Создаем папку для изображений, если её нет
    if not os.path.exists('img'):
        os.makedirs('img')

    # Загружаем JSON с данными
    with open('api/data.json', 'r', encoding='utf-8') as f:
        games = json.load(f)

    # Словарь с URL изображений для каждой игры
    image_urls = {
        "cyberpunk": "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
        "rdr2": "https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg",
        "witcher3": "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg",
        "gow": "https://cdn.akamai.steamstatic.com/steam/apps/1817070/header.jpg",
        "eldenring": "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg",
        "bg3": "https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg",
        "starfield": "https://cdn.akamai.steamstatic.com/steam/apps/1716740/header.jpg",
        "hogwarts": "https://cdn.akamai.steamstatic.com/steam/apps/990080/header.jpg",
        "re4": "https://cdn.akamai.steamstatic.com/steam/apps/2050650/header.jpg",
        "deadspace": "https://cdn.akamai.steamstatic.com/steam/apps/1693980/header.jpg",
        "mw3": "https://cdn.akamai.steamstatic.com/steam/apps/1938090/header.jpg",
        "alanwake2": "https://cdn.akamai.steamstatic.com/steam/apps/2079320/header.jpg",
        "gta6": "https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg",
        "ff16": "https://cdn.akamai.steamstatic.com/steam/apps/1359340/header.jpg",
        "sf6": "https://cdn.akamai.steamstatic.com/steam/apps/1364780/header.jpg",
        "mk1": "https://cdn.akamai.steamstatic.com/steam/apps/1971870/header.jpg",
        "acmirage": "https://cdn.akamai.steamstatic.com/steam/apps/1812150/header.jpg",
        "spiderman2": "https://cdn.akamai.steamstatic.com/steam/apps/1817070/header.jpg",
        "forza": "https://cdn.akamai.steamstatic.com/steam/apps/1222680/header.jpg",
        "cities2": "https://cdn.akamai.steamstatic.com/steam/apps/949230/header.jpg"
    }

    # Словарь с URL для галереи изображений
    gallery_urls = {
        "cyberpunk": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1091500/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "rdr2": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1174180/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1174180/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1174180/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "witcher3": [
            "https://cdn.akamai.steamstatic.com/steam/apps/292030/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/292030/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/292030/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "gow": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1817070/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1817070/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1817070/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "eldenring": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1245620/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1245620/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1245620/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "bg3": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1086940/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1086940/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1086940/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "starfield": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1716740/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1716740/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1716740/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "hogwarts": [
            "https://cdn.akamai.steamstatic.com/steam/apps/990080/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/990080/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/990080/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "re4": [
            "https://cdn.akamai.steamstatic.com/steam/apps/2050650/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/2050650/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/2050650/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "deadspace": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1693980/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1693980/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1693980/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "mw3": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1938090/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1938090/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1938090/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "alanwake2": [
            "https://cdn.akamai.steamstatic.com/steam/apps/2079320/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/2079320/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/2079320/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "gta6": [
            "https://cdn.akamai.steamstatic.com/steam/apps/271590/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/271590/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/271590/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "ff16": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1359340/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1359340/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1359340/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "sf6": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1364780/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1364780/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1364780/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "mk1": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1971870/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1971870/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1971870/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "acmirage": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1812150/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1812150/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1812150/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "spiderman2": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1817070/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1817070/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1817070/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "forza": [
            "https://cdn.akamai.steamstatic.com/steam/apps/1222680/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1222680/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/1222680/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ],
        "cities2": [
            "https://cdn.akamai.steamstatic.com/steam/apps/949230/ss_1a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/949230/ss_2a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg",
            "https://cdn.akamai.steamstatic.com/steam/apps/949230/ss_3a0e2821c34a3d1d2296f9a3b0639d6f8f7f9e2f.jpg"
        ]
    }

    # Скачиваем основные изображения и галерею
    for game in games:
        game_id = game['img'].split('.')[0]
        if game_id in image_urls:
            # Скачиваем основное изображение
            main_image = f"img/{game['img']}"
            download_image(image_urls[game_id], main_image)

            # Скачиваем изображения для галереи
            if game_id in gallery_urls:
                for i, url in enumerate(gallery_urls[game_id], 1):
                    gallery_image = f"img/{game_id}-{i}.jpg"
                    download_image(url, gallery_image, size=(1200, 675))

        time.sleep(1)  # Задержка между запросами

    # Удаляем неиспользуемые изображения
    used_images = set()
    for game in games:
        used_images.add(game['img'])
        game_id = game['img'].split('.')[0]
        for i in range(1, 4):
            used_images.add(f"{game_id}-{i}.jpg")

    # Получаем список всех файлов в папке img
    img_files = os.listdir('img')
    for img_file in img_files:
        if img_file not in used_images:
            try:
                os.remove(os.path.join('img', img_file))
                print(f"Удалено неиспользуемое изображение: {img_file}")
            except Exception as e:
                print(f"Ошибка при удалении {img_file}: {e}")

if __name__ == "__main__":
    main() 