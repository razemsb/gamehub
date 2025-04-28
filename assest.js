let lastScrollY = window.scrollY;
const filtersBar = document.querySelector('.filters-bar');
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    if (!filtersBar) return;
    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY && currentScrollY > (header?.offsetHeight || 60)) {
        filtersBar.classList.add('hide');
    } else {
        filtersBar.classList.remove('hide');
    }
    lastScrollY = currentScrollY;
});

// Кнопка "Прокрутить к фильтрам" на мобильных
const scrollToFiltersBtn = document.getElementById('scrollToFiltersBtn');
const firstGameCard = document.querySelector('.game-card');

function updateScrollToFiltersBtn() {
    if (!scrollToFiltersBtn || !firstGameCard || window.innerWidth > 768) return;
    const rect = firstGameCard.getBoundingClientRect();
    const offset = rect.bottom + window.scrollY;
    if (window.scrollY > offset + 50) {
        scrollToFiltersBtn.style.display = 'flex';
        setTimeout(() => scrollToFiltersBtn.classList.add('show'), 10);
    } else {
        scrollToFiltersBtn.classList.remove('show');
        setTimeout(() => scrollToFiltersBtn.style.display = 'none', 200);
    }
}

window.addEventListener('scroll', updateScrollToFiltersBtn);
window.addEventListener('resize', updateScrollToFiltersBtn);
document.addEventListener('DOMContentLoaded', updateScrollToFiltersBtn);

if (scrollToFiltersBtn) {
    scrollToFiltersBtn.addEventListener('click', () => {
        const filtersBar = document.querySelector('.filters-bar');
        if (filtersBar) {
            filtersBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

// Кнопка "Наверх" на мобильных
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

function updateScrollToTopBtn() {
    if (!scrollToTopBtn || window.innerWidth > 768) return;
    if (window.scrollY > 400) {
        scrollToTopBtn.style.display = 'flex';
        setTimeout(() => scrollToTopBtn.classList.add('show'), 10);
    } else {
        scrollToTopBtn.classList.remove('show');
        setTimeout(() => scrollToTopBtn.style.display = 'none', 200);
    }
}

window.addEventListener('scroll', updateScrollToTopBtn);
window.addEventListener('resize', updateScrollToTopBtn);
document.addEventListener('DOMContentLoaded', updateScrollToTopBtn);

if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
} 