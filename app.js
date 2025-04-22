const { createApp, ref, computed, onMounted, watch } = Vue;

// Утилиты
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

createApp({
  setup() {
    // Состояния с начальными значениями из localStorage
    const searchQuery = ref('');
    const products = ref([]);
    const displayedProducts = ref([]);
    const currentPage = ref(1);
    const itemsPerPage = 12;
    const isLoading = ref(false);
    const cart = ref(JSON.parse(localStorage.getItem('cart')) || []);
    const isCartOpen = ref(false);
    const selectedPlatform = ref(localStorage.getItem('selectedPlatform') || '');
    const priceMin = ref(Number(localStorage.getItem('priceMin')) || null);
    const priceMax = ref(Number(localStorage.getItem('priceMax')) || null);
    const sortOption = ref(localStorage.getItem('sortOption') || 'default');
    const notification = ref('');
    const showNotification = ref(false);
    const notificationType = ref('success');
    const showInfoModal = ref(false);
    const selectedGame = ref({});
    const currentMedia = ref({ type: 'image', src: '' });

    // Загрузка товаров с кэшированием
    const loadProducts = async () => {
      try {
        // Проверяем кэш
        const cachedProducts = localStorage.getItem('cachedProducts');
        const cacheTimestamp = localStorage.getItem('productsCacheTimestamp');
        const cacheAge = cacheTimestamp ? Date.now() - Number(cacheTimestamp) : Infinity;
        
        // Используем кэш, если он не старше 5 минут
        if (cachedProducts && cacheAge < 300000) {
          products.value = JSON.parse(cachedProducts);
        } else {
          const response = await fetch('api/data.php');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log('Loaded products:', data); // Для отладки
          products.value = data;
          
          // Обновляем кэш
          localStorage.setItem('cachedProducts', JSON.stringify(data));
          localStorage.setItem('productsCacheTimestamp', Date.now().toString());
        }
        
        loadMoreProducts();
      } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showNotificationMessage('Ошибка загрузки товаров: ' + error.message, 'error');
      }
    };

    // Дебаунсинг поиска
    const debouncedSearch = debounce(() => {
      currentPage.value = 1;
      displayedProducts.value = [];
      loadMoreProducts();
    }, 300);

    // Наблюдатель за поисковым запросом
    watch(searchQuery, () => {
      debouncedSearch();
    });

    // Сохранение фильтров в localStorage
    watch([selectedPlatform, priceMin, priceMax, sortOption], ([platform, min, max, sort]) => {
      localStorage.setItem('selectedPlatform', platform);
      localStorage.setItem('priceMin', min);
      localStorage.setItem('priceMax', max);
      localStorage.setItem('sortOption', sort);
      
      currentPage.value = 1;
      displayedProducts.value = [];
      loadMoreProducts();
    });

    // Оптимизированная фильтрация
    const filteredProducts = computed(() => {
      let result = products.value;

      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(product =>
          product.name.toLowerCase().includes(query) ||
          product.platform.toLowerCase().includes(query)
        );
      }

      if (selectedPlatform.value) {
        result = result.filter(product => product.platform === selectedPlatform.value);
      }

      if (priceMin.value !== null) {
        result = result.filter(product => product.price >= priceMin.value);
      }
      if (priceMax.value !== null) {
        result = result.filter(product => product.price <= priceMax.value);
      }

      // Сортировка
      switch (sortOption.value) {
        case 'price-asc':
          return result.sort((a, b) => a.price - b.price);
        case 'price-desc':
          return result.sort((a, b) => b.price - a.price);
        case 'name-asc':
          return result.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
          return result.sort((a, b) => b.name.localeCompare(a.name));
        default:
          return result;
      }
    });

    // Загрузка следующей порции товаров
    const loadMoreProducts = () => {
      if (isLoading.value) return;
      
      isLoading.value = true;
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      
      // Имитируем задержку загрузки
      setTimeout(() => {
        const newProducts = filteredProducts.value.slice(start, end);
        displayedProducts.value = [...displayedProducts.value, ...newProducts];
        currentPage.value++;
        isLoading.value = false;
      }, 1000);
    };

    // Наблюдатель за прокруткой
    const setupIntersectionObserver = () => {
      const observer = new IntersectionObserver((entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && !isLoading.value) {
          loadMoreProducts();
        }
      }, { threshold: 0.5 });

      // Наблюдаем за последней карточкой
      const observeLastCard = () => {
        const cards = document.querySelectorAll('.game-card');
        if (cards.length > 0) {
          const lastCard = cards[cards.length - 1];
          observer.observe(lastCard);
        }
      };

      // Переподключаем наблюдатель при изменении отображаемых товаров
      watch(displayedProducts, () => {
        setTimeout(observeLastCard, 100);
      });
    };

    const showNotificationMessage = (message, type = 'success') => {
      notification.value = message;
      notificationType.value = type;
      showNotification.value = true;
    
      setTimeout(() => {
        showNotification.value = false;
      }, 4000);
    };

    // Получение списка платформ
    const platforms = computed(() => {
      const uniquePlatforms = new Set();
      products.value.forEach(product => {
        uniquePlatforms.add(product.platform);
      });
      return Array.from(uniquePlatforms);
    });

    const togglePlatform = (platform) => {
      selectedPlatform.value = selectedPlatform.value === platform ? '' : platform;
    };

    // Поиск товара по ID
    const getProductById = (productId) => {
      return products.value.find(p => p.id === productId);
    };

    // Получение изображения товара
    const getProductImage = (productId) => {
      const product = getProductById(productId);
      return product ? product.img : 'default.jpg';
    };

    // Название товара
    const getProductName = (productId) => {
      const product = getProductById(productId);
      return product ? product.name : 'Товар удалён';
    };

    // Цена товара
    const getProductPrice = (productId) => {
      const product = getProductById(productId);
      return product ? product.price : 0;
    };

    // Добавление в корзину
    const addToCart = (productId) => {
      const existingItem = cart.value.find(item => item.productId === productId);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.value.push({ productId, quantity: 1 });
      }

      saveCart();
    };

    const hasActiveFilters = computed(() => {
      return (
        selectedPlatform.value ||
        priceMin.value !== null ||
        priceMax.value !== null ||
        sortOption.value !== 'default'
      );
    });

    const resetFilters = () => {
      selectedPlatform.value = '';
      priceMin.value = null;
      priceMax.value = null;
      sortOption.value = 'default';
      searchQuery.value = '';

      // Очищаем localStorage
      localStorage.removeItem('selectedPlatform');
      localStorage.removeItem('priceMin');
      localStorage.removeItem('priceMax');
      localStorage.removeItem('sortOption');

      // Сбрасываем страницу и перезагружаем товары
      currentPage.value = 1;
      displayedProducts.value = [];
      loadMoreProducts();
    };

    // Удаление из корзины
    const removeFromCart = (productId) => {
      cart.value = cart.value.filter(item => item.productId !== productId);
      saveCart();
    };

    const toggleCartItem = (productId) => {
      const index = cart.value.findIndex(item => item.productId === productId);
      const product = getProductById(productId);
      const productName = product ? product.name : 'Товар';
    
      if (index !== -1) {
        // Если товар в корзине, удаляем его
        cart.value.splice(index, 1);
        showNotificationMessage(`${productName} убран из корзины`, 'error');
      } else {
        // Если товара нет в корзине, добавляем его
        cart.value.push({ productId, quantity: 1 });
        showNotificationMessage(`${productName} добавлен в корзину`, 'success');
      }
    
      saveCart();
    };
    
    

    const isInCart = (productId) => {
      return cart.value.some(item => item.productId === productId);
    };
    

    // Сохранение корзины
    const saveCart = () => {
      localStorage.setItem('cart', JSON.stringify(cart.value));
    };

    // Общая сумма
    const total = computed(() => {
      return cart.value.reduce((sum, item) => {
        return sum + (getProductPrice(item.productId) * item.quantity);
      }, 0);
    });

    // Открытие/закрытие корзины
    const toggleCart = () => {
      isCartOpen.value = !isCartOpen.value;
    };

    // Оформление заказа
    const checkout = async () => {
      if (cart.value.length === 0) return;

      try {
        const response = await fetch('./api/order.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart: cart.value })
        });

        const data = await response.json();

        alert(`Заказ #${data.orderId} успешно оформлен!`);
        cart.value = [];
        saveCart();
        toggleCart();
      } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        alert('Произошла ошибка при оформлении заказа');
      }
    };

    const showGameInfo = (game) => {
      selectedGame.value = game;
      // Всегда показываем превью изображение при открытии
      currentMedia.value = {
        type: 'image',
        src: game.img
      };
      showInfoModal.value = true;
    };

    const selectImage = (image) => {
      currentMedia.value = {
        type: 'image',
        src: image
      };
    };

    const selectVideo = () => {
      if (selectedGame.value.media?.video) {
        currentMedia.value = {
          type: 'video',
          src: selectedGame.value.media.video
        };
      }
    };

    const nextSlide = () => {
      const media = selectedGame.value.media;
      if (!media) return;

      if (currentMedia.value.type === 'video') {
        // Если сейчас видео, переключаемся на первое изображение из галереи
        if (media.gallery && media.gallery.length > 0) {
          selectImage(media.gallery[0]);
        }
      } else {
        // Если сейчас изображение
        const currentIndex = media.gallery.indexOf(currentMedia.value.src);
        if (currentIndex === media.gallery.length - 1) {
          // Если это последнее изображение и есть видео, переключаемся на видео
          if (media.video) {
            selectVideo();
          } else {
            // Иначе переходим к первому изображению
            selectImage(media.gallery[0]);
          }
        } else {
          // Переходим к следующему изображению
          selectImage(media.gallery[currentIndex + 1]);
        }
      }
    };

    const prevSlide = () => {
      const media = selectedGame.value.media;
      if (!media) return;

      if (currentMedia.value.type === 'video') {
        // Если сейчас видео, переключаемся на последнее изображение из галереи
        if (media.gallery && media.gallery.length > 0) {
          selectImage(media.gallery[media.gallery.length - 1]);
        }
      } else {
        // Если сейчас изображение
        const currentIndex = media.gallery.indexOf(currentMedia.value.src);
        if (currentIndex === 0) {
          // Если это первое изображение и есть видео, переключаемся на видео
          if (media.video) {
            selectVideo();
          } else {
            // Иначе переходим к последнему изображению
            selectImage(media.gallery[media.gallery.length - 1]);
          }
        } else {
          // Переходим к предыдущему изображению
          selectImage(media.gallery[currentIndex - 1]);
        }
      }
    };

    const closeModals = () => {
      showInfoModal.value = false;
      isCartOpen.value = false;
    };

    // Загружаем товары при старте
    onMounted(() => {
      loadProducts();
      setupIntersectionObserver();
    });

    return {
      hasActiveFilters,
      resetFilters,
      selectedPlatform,
      priceMin,
      priceMax,
      sortOption,
      togglePlatform,
      products: displayedProducts,
      cart,
      isCartOpen,
      searchQuery,
      platforms,
      filteredProducts: displayedProducts,
      isInCart,
      getProductName,
      getProductPrice,
      getProductImage,
      addToCart,
      removeFromCart,
      toggleCartItem,
      total,
      toggleCart,
      checkout,
      notification,
      showNotification,
      notificationType,
      showInfoModal,
      selectedGame,
      showGameInfo,
      selectImage,
      selectVideo,
      nextSlide,
      prevSlide,
      closeModals,
      currentMedia
    };
  }
}).mount('#app');
