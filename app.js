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
    const error = ref(null);
    const allProductsLoaded = ref(false);

    // Загрузка товаров
    const loadProducts = async () => {
      try {
        isLoading.value = true;
        error.value = null;
        
        // Проверяем кэш
        const cachedProducts = localStorage.getItem('cachedProducts');
        const cacheTimestamp = localStorage.getItem('productsCacheTimestamp');
        const now = Date.now();
        
        // Если есть кэш и он не старше 5 минут, используем его
        if (cachedProducts && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 300000) {
          products.value = JSON.parse(cachedProducts);
        } else {
          // Иначе загружаем новые данные
          const response = await fetch('/gamehub/api/data.json');
          
          if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
          }
          
          products.value = await response.json();
          
          // Сохраняем в кэш
          localStorage.setItem('cachedProducts', JSON.stringify(products.value));
          localStorage.setItem('productsCacheTimestamp', now.toString());
        }
        
        // Сбрасываем страницу и загружаем первую порцию товаров
        currentPage.value = 1;
        displayedProducts.value = [];
        loadMoreProducts();
        
      } catch (err) {
        error.value = 'Не удалось загрузить товары. Пожалуйста, попробуйте позже.';
      } finally {
        isLoading.value = false;
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
      
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const totalProducts = filteredProducts.value.length;
      
      // Если достигли конца списка, прекращаем
      if (start >= totalProducts) {
        return;
      }
      
      isLoading.value = true;
      
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
      let observer = null;
      let isObserving = false;

      const createObserver = () => {
        if (observer) {
          observer.disconnect();
          observer = null;
        }

        if (isObserving) return;

        observer = new IntersectionObserver((entries) => {
          const lastEntry = entries[0];
          if (lastEntry.isIntersecting && !isLoading.value) {
            const start = currentPage.value * itemsPerPage;
            const totalProducts = filteredProducts.value.length;
            
            // Проверяем, достигли ли мы конца списка
            if (start < totalProducts) {
              loadMoreProducts();
            } else {
              isObserving = false;
              observer.disconnect();
              observer = null;
            }
          }
        }, { threshold: 0.5 });

        // Наблюдаем за последней карточкой
        const cards = document.querySelectorAll('.game-card');
        if (cards.length > 0) {
          const lastCard = cards[cards.length - 1];
          observer.observe(lastCard);
          isObserving = true;
        }
      };

      // Сбрасываем состояние при изменении фильтров или поиска
      watch([searchQuery, selectedPlatform, priceMin, priceMax, sortOption], () => {
        isObserving = false;
        currentPage.value = 1;
        displayedProducts.value = [];
        setTimeout(createObserver, 100);
      });

      // Переподключаем наблюдатель при изменении отображаемых товаров
      watch(displayedProducts, () => {
        if (!isObserving) {
          setTimeout(createObserver, 100);
        }
      });

      // Создаем начальный наблюдатель
      createObserver();
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
      if (!product) return 'img/preview/default.png';
      
      // Всегда возвращаем полный путь к изображению
      return `img/${product.img}`;
    };

    // Получение изображения для корзины
    const getCartItemImage = (productId) => {
      const product = getProductById(productId);
      if (!product) return 'img/preview/default.png';
      
      // Для корзины всегда используем превью изображение
      return `img/${product.img}`;
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
      if (isCartOpen.value) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
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
      document.body.classList.add('modal-open');
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
      document.body.classList.remove('modal-open');
    };

    // Перезагрузка данных
    const reloadData = async () => {
      try {
        // Очищаем кэш
        localStorage.removeItem('cachedProducts');
        localStorage.removeItem('productsCacheTimestamp');
        
        // Очищаем текущие данные
        products.value = [];
        displayedProducts.value = [];
        currentPage.value = 1;
        
        // Показываем анимацию загрузки
        const reloadBtn = document.querySelector('.reload-btn');
        if (reloadBtn) {
          reloadBtn.classList.add('rotating');
        }
        
        // Загружаем данные заново
        await loadProducts();
        
        // Убираем анимацию
        if (reloadBtn) {
          reloadBtn.classList.remove('rotating');
        }
        
        // Показываем уведомление
        showNotificationMessage('Данные успешно обновлены', 'success');
      } catch (error) {
        console.error('Ошибка при перезагрузке данных:', error);
        showNotificationMessage('Ошибка при обновлении данных', 'error');
      }
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
      products: products.value,
      displayedProducts,
      cart,
      isCartOpen,
      searchQuery,
      platforms,
      filteredProducts,
      isInCart,
      getProductName,
      getProductPrice,
      getProductImage,
      getCartItemImage,
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
      currentMedia,
      reloadData,
      isLoading,
      error,
      applyPriceFilter: () => {
        // Валидация цен
        if (priceMin.value !== null && priceMin.value !== '') {
          const minPrice = Number(priceMin.value);
          if (isNaN(minPrice) || minPrice < 0) {
            showNotificationMessage('Минимальная цена должна быть положительным числом', 'error');
            return;
          }
        }
        if (priceMax.value !== null && priceMax.value !== '') {
          const maxPrice = Number(priceMax.value);
          if (isNaN(maxPrice) || maxPrice < 0) {
            showNotificationMessage('Максимальная цена должна быть положительным числом', 'error');
            return;
          }
        }
        if (priceMin.value !== null && priceMax.value !== null && 
            Number(priceMin.value) > Number(priceMax.value)) {
          showNotificationMessage('Минимальная цена не может быть больше максимальной', 'error');
          return;
        }

        // Сохраняем значения в localStorage
        localStorage.setItem('priceMin', priceMin.value);
        localStorage.setItem('priceMax', priceMax.value);

        // Сбрасываем страницу и перезагружаем товары
        currentPage.value = 1;
        displayedProducts.value = [];
        loadMoreProducts();
      }
    };
  }
}).mount('#app');
