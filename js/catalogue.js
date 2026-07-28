import { apiClient } from "./apiClient.js";
import { showToast } from "./notification.js";
import { openProductModal } from "./productModal.js";

const BESTSELLERS_WINDOW_SIZE = 3;
const BOUQUETS_PER_PAGE = 4;

const bestsellersList = document.querySelector("[data-bestsellers-list]");
const paginationDots = document.querySelector("[data-pagination-dots]");
const bestsellersPrevBtn = document.querySelector("[data-bestsellers-prev]");
const bestsellersNextBtn = document.querySelector("[data-bestsellers-next]");

const bouquetList = document.querySelector("[data-bouquet-list]");
const loadMoreBtn = document.querySelector("[data-load-more]");
const endMessage = document.querySelector("[data-bouquet-end-message]");

let topBouquets = [];
let bestsellersIndex = 0;

let bouquetsPage = 1;
let isLoadingMore = false;

// id -> full item data, для кліку по картці
const bestsellersById = new Map();
const bouquetsById = new Map();

// function createBouquetCardMarkup({ id, name, description, price, image, alt }) {
// 	return `
//     <li class="bouquet-card">
//       <img
//         class="bouquet-img"
//         src="./images/${image}"
//         alt="${alt ?? name}"
//         loading="lazy"
//       />
//       <h3 class="bouquet-name">${name}</h3>
//       <p class="bouquet-text">${description}</p>
//       <p class="bouquet-price">$${price}</p>
//     </li>
//   `;
// }


function createBouquetCardMarkup({ id, name, description, price, image, alt }) {
	return `
    <li
      class="bouquet-card"
      data-id="${id}"
      tabindex="0"
      role="button"
      aria-label="View details for ${name}"
    >
      <img
        class="bouquet-img"
        src="./images/${image}"
        alt="${alt ?? name}"
        loading="lazy"
      />
      <h3 class="bouquet-name">${name}</h3>
      <p class="bouquet-text">${description}</p>
      <p class="bouquet-price">$${price}</p>
    </li>
  `;
}

// function createTopSellingCardMarkup({ name, description, image, alt }) {
// 	return `
//     <li class="top-selling-card">
//       <img
//         class="top-selling-img"
//         src="./images/${image}"
//         alt="${alt ?? name}"
//         loading="lazy"
//       />
//       <h3 class="top-selling-title">${name}</h3>
//       <p class="top-selling-text">${description}</p>
//     </li>
//   `;
// }

function createTopSellingCardMarkup({ id, name, description, image, alt }) {
	return `
    <li
      class="top-selling-card"
      data-id="${id}"
      tabindex="0"
      role="button"
      aria-label="View details for ${name}"
    >
      <img
        class="top-selling-img"
        src="./images/${image}"
        alt="${alt ?? name}"
        loading="lazy"
      />
      <h3 class="top-selling-title">${name}</h3>
      <p class="top-selling-text">${description}</p>
    </li>
  `;
}

function renderStateMessage(container, message) {
	if (!container) return;
	container.innerHTML = "";
	container.insertAdjacentHTML("beforeend", `<li class="state-message">${message}</li>`);
}

// ---------- Top-Selling (bestsellers, category=top only) ----------

function renderBestsellersWindow() {
	if (!bestsellersList) return;

	if (topBouquets.length === 0) {
		renderStateMessage(bestsellersList, "No bestsellers available right now.");
		return;
	}

	const total = topBouquets.length;
	const windowSize = Math.min(BESTSELLERS_WINDOW_SIZE, total);
	const visible = [];

	for (let i = 0; i < windowSize; i += 1) {
		visible.push(topBouquets[(bestsellersIndex + i) % total]);
	}

	bestsellersList.innerHTML = "";
	bestsellersList.insertAdjacentHTML("beforeend", visible.map(createTopSellingCardMarkup).join(""));
}

function renderPaginationDots() {
	if (!paginationDots) return;

	paginationDots.innerHTML = "";

	const dotsMarkup = topBouquets
		.map((_, index) => {
			const activeClass = index === bestsellersIndex ? " active" : "";
			return `<li><button type="button" class="dot${activeClass}" aria-label="Go to bouquet ${index + 1}" data-dot-index="${index}"></button></li>`;
		})
		.join("");

	paginationDots.insertAdjacentHTML("beforeend", dotsMarkup);
}

function updateBestsellersUI() {
	renderBestsellersWindow();
	renderPaginationDots();
}

function shiftBestsellers(step) {
	if (topBouquets.length === 0) return;
	const total = topBouquets.length;
	bestsellersIndex = (bestsellersIndex + step + total) % total;
	updateBestsellersUI();
}

async function loadBestsellers() {
	try {
		const { data } = await apiClient.get("/bouquets", {
			params: { category: "top" },
		});

		const all = Array.isArray(data) ? data : [];
		// json-server filters by category=top server-side already, so this
		// filter is a no-op there. The static build (GitHub Pages) serves the
		// whole collection as one file with no server-side filtering, so we
		// filter client-side to get only the "top" items in both cases.
		topBouquets = all.filter((item) => item.category === "top");
		bestsellersIndex = 0;

		bestsellersById.clear();
		topBouquets.forEach((item) => bestsellersById.set(String(item.id), item));

		updateBestsellersUI();
	} catch (error) {
		renderStateMessage(bestsellersList, "Failed to load bestsellers. Please try again later.");
		if (paginationDots) paginationDots.innerHTML = "";
		showToast("Could not load bestsellers.", "error");
	}
}

// ---------- Bouquets (all categories, paginated with Load more) ----------

function toggleLoadMoreVisibility(shouldShow) {
	if (!loadMoreBtn) return;
	loadMoreBtn.hidden = !shouldShow;
}

function showEndMessage(message) {
	if (!endMessage) return;
	endMessage.textContent = message;
	endMessage.hidden = false;
}

function hideEndMessage() {
	if (!endMessage) return;
	endMessage.hidden = true;
}

async function fetchBouquetsPage(page) {
	const { data: raw } = await apiClient.get("/bouquets", {
		params: { _page: page, _per_page: BOUQUETS_PER_PAGE },
	});

	// json-server v1 pagination shape: { first, prev, next, last, pages, items, data: [...] }
	if (raw && !Array.isArray(raw) && Array.isArray(raw.data)) {
		return { data: raw.data, next: raw.next };
	}

	// Static build (GitHub Pages) serves the whole collection as one flat
	// array with no server-side pagination/filtering, so we paginate it here
	// on the client instead.
	const all = Array.isArray(raw) ? raw : [];
	const start = (page - 1) * BOUQUETS_PER_PAGE;
	const pageItems = all.slice(start, start + BOUQUETS_PER_PAGE);
	const hasMore = start + BOUQUETS_PER_PAGE < all.length;
	return { data: pageItems, next: hasMore ? page + 1 : null };
}

async function loadInitialBouquets() {
	try {
		const { data, next } = await fetchBouquetsPage(bouquetsPage);

		if (!data || data.length === 0) {
			renderStateMessage(bouquetList, "No bouquets available right now.");
			toggleLoadMoreVisibility(false);
			return;
		}

		bouquetsById.clear();
		data.forEach((item) => bouquetsById.set(String(item.id), item));

		bouquetList.innerHTML = "";
		bouquetList.insertAdjacentHTML("beforeend", data.map(createBouquetCardMarkup).join(""));

		if (next === null || next === undefined) {
			toggleLoadMoreVisibility(false);
			showEndMessage("You have viewed all our bouquets.");
		} else {
			toggleLoadMoreVisibility(true);
			hideEndMessage();
		}
	} catch (error) {
		renderStateMessage(bouquetList, "Failed to load bouquets. Please try again later.");
		toggleLoadMoreVisibility(false);
		showToast("Could not load bouquets.", "error");
	}
}

async function handleLoadMore() {
	if (isLoadingMore || !loadMoreBtn) return;

	isLoadingMore = true;
	loadMoreBtn.disabled = true;

	try {
		const nextPage = bouquetsPage + 1;
		const { data, next } = await fetchBouquetsPage(nextPage);

		if (!data || data.length === 0) {
			toggleLoadMoreVisibility(false);
			showEndMessage("You have viewed all our bouquets.");
			return;
		}

		bouquetsPage = nextPage;
		data.forEach((item) => bouquetsById.set(String(item.id), item));
		bouquetList.insertAdjacentHTML("beforeend", data.map(createBouquetCardMarkup).join(""));

		if (next === null || next === undefined) {
			toggleLoadMoreVisibility(false);
			showEndMessage("You have viewed all our bouquets.");
		}
	} catch (error) {
		showToast("Could not load more bouquets. Please try again.", "error");
	} finally {
		isLoadingMore = false;
		loadMoreBtn.disabled = false;
	}
}

// function handleOrderButtonClick(event) {
// 	const button = event.target.closest("[data-order-btn]");
// 	if (!button) return;

// 	document.dispatchEvent(
// 		new CustomEvent("bouquet:order", {
// 			detail: { id: button.dataset.id, name: button.dataset.name },
// 		})
// 	);
// }

// export function initCatalogue() {
// 	loadBestsellers();
// 	loadInitialBouquets();

// 	bestsellersPrevBtn?.addEventListener("click", () => shiftBestsellers(-1));
// 	bestsellersNextBtn?.addEventListener("click", () => shiftBestsellers(1));

// 	paginationDots?.addEventListener("click", (event) => {
// 		const dot = event.target.closest("[data-dot-index]");
// 		if (!dot) return;
// 		bestsellersIndex = Number(dot.dataset.dotIndex);
// 		updateBestsellersUI();
// 	});

// 	loadMoreBtn?.addEventListener("click", handleLoadMore);
// 	bouquetList?.addEventListener("click", handleOrderButtonClick);
// }

function handleCardActivate(event, itemsById) {
	const card = event.target.closest("[data-id]");
	if (!card) return;
	const product = itemsById.get(card.dataset.id);
	if (product) openProductModal(product);
}

function handleCardKeydown(event, itemsById) {
	if (event.key !== "Enter" && event.key !== " ") return;
	const card = event.target.closest("[data-id]");
	if (!card) return;
	event.preventDefault();
	const product = itemsById.get(card.dataset.id);
	if (product) openProductModal(product);
}

export function initCatalogue() {
	loadBestsellers();
	loadInitialBouquets();

	bestsellersPrevBtn?.addEventListener("click", () => shiftBestsellers(-1));
	bestsellersNextBtn?.addEventListener("click", () => shiftBestsellers(1));

	paginationDots?.addEventListener("click", (event) => {
		const dot = event.target.closest("[data-dot-index]");
		if (!dot) return;
		bestsellersIndex = Number(dot.dataset.dotIndex);
		updateBestsellersUI();
	});

	loadMoreBtn?.addEventListener("click", handleLoadMore);

	bestsellersList?.addEventListener("click", (event) => handleCardActivate(event, bestsellersById));
	bestsellersList?.addEventListener("keydown", (event) => handleCardKeydown(event, bestsellersById));
	bouquetList?.addEventListener("click", (event) => handleCardActivate(event, bouquetsById));
	bouquetList?.addEventListener("keydown", (event) => handleCardKeydown(event, bouquetsById));
}