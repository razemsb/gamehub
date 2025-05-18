const { createApp } = Vue;

const AdminApp = {
    template: `
        <div>
            <header class="header">
                <div class="container">
                    <div class="header__content">
                        <a href="#" class="logo">GAME<span>HUB</span></a>
                        <button class="reload-btn" @click="loadProducts">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
            </header>

            <section class="hero">
                <div class="container">
                    <h1>Админ панель сайта GAMEHUB</h1>
                </div>
            </section>
            
            <div class="admin-form">
                <h2>Добавить новый товар</h2>
                <div class="form-group">
                    <input type="text" v-model="newProduct.name" placeholder="Название" required>
                </div>
                <div class="form-group">
                    <textarea v-model="newProduct.description" placeholder="Описание"></textarea>
                </div>
                <div class="form-group">
                    <input type="number" v-model="newProduct.price" placeholder="Цена" required>
                </div>
                <div class="form-group">
                    <input type="text" v-model="newProduct.image" placeholder="URL изображения">
                </div>
                <div class="form-group">
                    <select v-model="newProduct.category">
                        <option value="games">Игры</option>
                        <option value="software">ПО</option>
                    </select>
                </div>
                <button @click="addProduct">Добавить</button>
            </div>

            <div class="products-list">
                <h2>Товары</h2>
                <div v-for="product in products" :key="product.id" class="product-item">
                    <h3>{{ product.name }}</h3>
                    <p>{{ product.description }}</p>
                    <p>Цена: {{ product.price }} ₽</p>
                    <button @click="deleteProduct(product.id)">Удалить</button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            newProduct: {
                id: null,
                name: '',
                description: '',
                price: null,
                image: '',
                category: 'games'
            },
            products: []
        }
    },
    methods: {
        async loadProducts() {
            try {
                const response = await fetch('/gamehub/api/data.json');
                this.products = (await response.json()).products;
            } catch (error) {
                alert('Ошибка загрузки');
                console.error(error);
            }
        },
        async addProduct() {
            if (!this.newProduct.name || !this.newProduct.price) {
                alert('Заполните обязательные поля');
                return;
            }

            try {
                const newId = this.products.length > 0 
                    ? Math.max(...this.products.map(p => p.id)) + 1 
                    : 1;

                this.products.push({
                    ...this.newProduct,
                    id: newId
                });

                this.newProduct = { 
                    name: '', 
                    description: '', 
                    price: null, 
                    image: '', 
                    category: 'games' 
                };

                alert('Товар добавлен (для сохранения нужен бэкенд)');
            } catch (error) {
                alert('Ошибка');
                console.error(error);
            }
        },
        deleteProduct(id) {
            if (!confirm('Удалить?')) return;
            this.products = this.products.filter(p => p.id !== id);
        }
    },
    mounted() {
        this.loadProducts();
    }
};

createApp(AdminApp).mount('#admin-app');