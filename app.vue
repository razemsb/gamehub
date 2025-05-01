console.log('Vue version:', Vue.version);
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
    const showOrderModal = ref(false);
    const currentOrderId = ref(null);
    const searchQuery = ref('');
    const products = ref([]);
    const currentPage = ref(getPageFromUrl());
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

    // Получение номера страницы из URL
    function getPageFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get('page'), 10);
      return (page && page > 0) ? page : 1;
    }

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
      } catch (err) {
        error.value = 'Не удалось загрузить товары. Пожалуйста, попробуйте позже.';
      } finally {
        isLoading.value = false;
      }
    };

    // Дебаунсинг поиска
    const debouncedSearch = debounce(() => {
      currentPage.value = 1;
    }, 300);

    // Наблюдатель за поисковым запросом
    watch(searchQuery, () => {
      debouncedSearch();
    });

    // Обновление отфильтрованных товаров при изменении сортировки
    watch(sortOption, (newSort) => {
      currentPage.value = 1;
    });

    // Сохранение фильтров в localStorage
    watch([selectedPlatform, priceMin, priceMax], ([platform, min, max]) => {
      localStorage.setItem('selectedPlatform', platform);
      localStorage.setItem('priceMin', min);
      localStorage.setItem('priceMax', max);
      
      currentPage.value = 1;
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
        case 'rating-asc':
          return result.sort((a, b) => a.rating - b.rating);
        case 'rating-desc':
          return result.sort((a, b) => b.rating - a.rating);
        default:
          return result;
      }
    });

    const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));
    const paginatedProducts = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      return filteredProducts.value.slice(start, start + itemsPerPage);
    });

    function goToPage(page) {
      if (page < 1 || page > totalPages.value) return;
      currentPage.value = page;
      // Обновляем URL без перезагрузки
      const params = new URLSearchParams(window.location.search);
      if (page === 1) {
        params.delete('page');
      } else {
        params.set('page', page);
      }
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
      setTimeout(() => {
        const gamesSection = document.getElementById('hero');
        if (gamesSection) {
          gamesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    }

    watch(filteredProducts, () => {
      goToPage(1);
    });

    const showNotificationMessage = (message, type = 'success') => {
      notification.value = message;
      notificationType.value = type;
      showNotification.value = true;
    
      setTimeout(() => {
        showNotification.value = false;
      }, 2000);
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
      localStorage.removeItem('searchQuery');

      // Сбрасываем страницу
      currentPage.value = 1;

      // Обновляем URL без фильтров
      const params = new URLSearchParams(window.location.search);
      params.delete('platform');
      params.delete('min');
      params.delete('max');
      params.delete('sort');
      params.delete('search');
      window.history.replaceState({}, '', `?${params.toString()}`);

      // Перезагружаем игры
      loadProducts();
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

    const toggleOrderModal = (show = true) => {
      showOrderModal.value = show;
    };

    const checkout = () => {
      if (cart.value.length === 0) return;
      const orderId = Math.floor(Math.random() * 100000) + 1;
      currentOrderId.value = orderId;
      console.log('Opening order modal with orderId:', orderId);
      toggleOrderModal(true);
      cart.value = [];
      saveCart();
      toggleCart();
    };

    const countGames = computed(() => {
      return products.value.length;
    });

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
      showOrderModal.value = false;
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
    });

    const visiblePages = computed(() => {
      const pages = [];
      if (totalPages.value <= 7) {
        for (let i = 1; i <= totalPages.value; i++) pages.push(i);
      } else {
        if (currentPage.value <= 4) {
          pages.push(1, 2, 3, 4, 5, '...', totalPages.value);
        } else if (currentPage.value >= totalPages.value - 3) {
          pages.push(1, '...', totalPages.value - 4, totalPages.value - 3, totalPages.value - 2, totalPages.value - 1, totalPages.value);
        } else {
          pages.push(1, '...', currentPage.value - 1, currentPage.value, currentPage.value + 1, '...', totalPages.value);
        }
      }
      return pages;
    });

    // Функция для применения фильтра цены
    const applyPriceFilter = () => {
      // Фильтрация уже происходит в computed, эта функция нужна только для интерфейса
    };

    return {
      countGames,
      hasActiveFilters,
      resetFilters,
      selectedPlatform,
      priceMin,
      priceMax,
      sortOption,
      togglePlatform,
      products: products.value,
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
      showOrderModal,
      toggleOrderModal,
      currentOrderId,
      totalPages,
      paginatedProducts,
      goToPage,
      currentPage,
      visiblePages,
      applyPriceFilter
    };
  }
}).mount('#app');
