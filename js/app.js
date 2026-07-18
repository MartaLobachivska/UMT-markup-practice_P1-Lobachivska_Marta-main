'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000';
  const IMAGES_PATH = './images/';

  /* =====================================================
     TOP-SELLING (category = "top") — slider by dots/arrows
  ===================================================== */

  const bestsellersList = document.querySelector('[data-bestsellers-list]');
  const paginationDots = document.querySelector('[data-pagination-dots]');
  const prevBtn = document.querySelector('[data-bestsellers-prev]');
  const nextBtn = document.querySelector('[data-bestsellers-next]');

  let topBouquets = [];
  let currentIndex = 0;
  const VISIBLE_CARDS = 3; // CSS itself hides card 2/3 on smaller breakpoints

  const bouquetCardTemplate = (bouquet) => `
    <li class="card">
      <img
        class="top-selling-img"
        src="${IMAGES_PATH}${bouquet.image}"
        width="405"
        height="320"
        loading="lazy"
        decoding="async"
        alt="${bouquet.alt || bouquet.name}"
      />
      <h3 class="top-selling-title">${bouquet.name}</h3>
      <p class="top-selling-text">${bouquet.description}</p>
      <p class="top-selling-price">$${bouquet.price}</p>
    </li>
  `;

  const renderTopSelling = () => {
    if (!bestsellersList || topBouquets.length === 0) return;

    bestsellersList.innerHTML = '';

    for (let i = 0; i < Math.min(VISIBLE_CARDS, topBouquets.length); i++) {
      const bouquet = topBouquets[(currentIndex + i) % topBouquets.length];
      bestsellersList.insertAdjacentHTML('beforeend', bouquetCardTemplate(bouquet));
    }

    renderDots();
  };

  const renderDots = () => {
    if (!paginationDots) return;

    paginationDots.innerHTML = topBouquets
      .map((_, index) => `<li class="dot${index === currentIndex ? ' active' : ''}" data-dot-index="${index}"></li>`)
      .join('');
  };

  const goToSlide = (index) => {
    if (topBouquets.length === 0) return;
    currentIndex = ((index % topBouquets.length) + topBouquets.length) % topBouquets.length;
    renderTopSelling();
  };

  paginationDots?.addEventListener('click', (event) => {
    const dot = event.target.closest('[data-dot-index]');
    if (!dot) return;
    goToSlide(Number(dot.dataset.dotIndex));
  });

  prevBtn?.addEventListener('click', () => goToSlide(currentIndex - 1));
  nextBtn?.addEventListener('click', () => goToSlide(currentIndex + 1));

  const showTopSellingError = () => {
    if (!bestsellersList) return;
    bestsellersList.innerHTML = `
      <li class="top-selling-text" style="list-style:none;">
        Не вдалося завантажити букети-бестселери. Спробуйте оновити сторінку.
      </li>
    `;
  };

  const loadTopSelling = async () => {
    try {
      const response = await axios.get(`${API_URL}/bouquets`, {
        params: { category: 'top' },
      });

      topBouquets = Array.isArray(response.data) ? response.data : [];

      if (topBouquets.length === 0) {
        showTopSellingError();
        return;
      }

      currentIndex = 0;
      renderTopSelling();
    } catch (error) {
      console.error('Failed to load top-selling bouquets:', error);
      showTopSellingError();
    }
  };

  /* =====================================================
     BOUQUETS (all categories) — "Load more" pagination
  ===================================================== */

  const bouquetList = document.querySelector('[data-bouquet-list]');
  const loadMoreBtn = document.querySelector('[data-load-more]');
  const bouquetEndMessage = document.querySelector('[data-bouquet-end-message]');

  const LIMIT = 4;
  let currentPage = 1;
  let isLoading = false;

  const bouquetItemTemplate = (bouquet) => `
    <li class="bouquet-card">
      <img
        class="bouquet-img"
        src="${IMAGES_PATH}${bouquet.image}"
        width="296"
        height="296"
        loading="lazy"
        decoding="async"
        alt="${bouquet.alt || bouquet.name}"
      />
      <h3 class="bouquet-name">${bouquet.name}</h3>
      <p class="bouquet-text">${bouquet.description}</p>
      <p class="bouquet-price">$${bouquet.price}</p>
    </li>
  `;

  const hideLoadMore = (message) => {
    if (loadMoreBtn) loadMoreBtn.hidden = true;
    if (bouquetEndMessage) {
      bouquetEndMessage.hidden = false;
      if (message) bouquetEndMessage.textContent = message;
    }
  };

  const loadBouquets = async (page) => {
    if (isLoading) return;
    isLoading = true;

    if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Loading...';
    }

    try {
      const response = await axios.get(`${API_URL}/bouquets`, {
        params: { _page: page, _limit: LIMIT },
      });

      const items = Array.isArray(response.data) ? response.data : [];

      if (items.length === 0) {
        hideLoadMore('There are no more bouquets to show.');
        return;
      }

      const markup = items.map(bouquetItemTemplate).join('');
      bouquetList?.insertAdjacentHTML('beforeend', markup);

      // json-server returns fewer items than LIMIT on the last page
      if (items.length < LIMIT) {
        hideLoadMore('You have viewed all our bouquets.');
      }
    } catch (error) {
      console.error('Failed to load bouquets:', error);
      if (bouquetList) {
        bouquetList.insertAdjacentHTML(
          'beforeend',
          `<li class="bouquet-text" style="list-style:none; grid-column: 1 / -1; text-align:center;">
             Не вдалося завантажити букети. Перевірте, чи запущено json-server, і спробуйте ще раз.
           </li>`
        );
      }
      hideLoadMore();
    } finally {
      isLoading = false;
      if (loadMoreBtn && !loadMoreBtn.hidden) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Show More';
      }
    }
  };

  loadMoreBtn?.addEventListener('click', () => {
    currentPage += 1;
    loadBouquets(currentPage);
  });

  /* =====================================================
     INIT
  ===================================================== */

  if (bestsellersList) loadTopSelling();
  if (bouquetList) loadBouquets(currentPage);
});
