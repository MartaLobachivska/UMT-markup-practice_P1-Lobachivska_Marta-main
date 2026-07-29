const backdrop = document.querySelector("[data-product-modal]");
const closeBtn = document.querySelector("[data-product-modal-close]");
const imageEl = document.querySelector("[data-product-image]");
const titleEl = document.querySelector("[data-product-title]");
const priceEl = document.querySelector("[data-product-price]");
const descriptionEl = document.querySelector("[data-product-description]");
const buyBtn = document.querySelector("[data-product-buy]");
const qtyInput = document.querySelector("[data-qty-value]");

let currentProduct = null;
let lastFocusedElement = null;

function isProductModalOpen() {
	return backdrop?.classList.contains("is-open") ?? false;
}

function getQuantity() {
	const value = Number(qtyInput?.value);
	return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

function clampQuantity() {
	if (!qtyInput) return;
	qtyInput.value = String(getQuantity());
}

export function openProductModal(product) {
	if (!backdrop || !product) return;

	currentProduct = product;
	if (qtyInput) qtyInput.value = "1";

	if (imageEl) {
		imageEl.src = `./images/${product.image}`;
		imageEl.alt = product.alt ?? product.name ?? "";
	}
	if (titleEl) titleEl.textContent = product.name ?? "";
	if (priceEl) priceEl.textContent = `$${product.price}`;
	if (descriptionEl) descriptionEl.textContent = product.description ?? "";

	lastFocusedElement = document.activeElement;

	backdrop.classList.add("is-open");
	document.documentElement.classList.add("modal-open");
	document.body.classList.add("modal-open");

	closeBtn?.focus();
}

function closeProductModal() {
	if (!backdrop || !isProductModalOpen()) return;

	backdrop.classList.remove("is-open");
	document.documentElement.classList.remove("modal-open");
	document.body.classList.remove("modal-open");

	if (lastFocusedElement instanceof HTMLElement) {
		lastFocusedElement.focus();
	}
}

function handleBackdropClick(event) {
	if (event.target === backdrop) {
		closeProductModal();
	}
}

function handleKeydown(event) {
	if (event.key === "Escape" && isProductModalOpen()) {
		closeProductModal();
	}
}

function handleBuyClick() {
	if (!currentProduct) return;

	clampQuantity();
	const { id, name } = currentProduct;

	closeProductModal();

	// Hands off to the existing order form (js/modal.js listens for this event
	// and pre-fills the hidden bouquetId/bouquet name fields).
	document.dispatchEvent(
		new CustomEvent("bouquet:order", {
			detail: { id, name },
		})
	);
}

export function initProductModal() {
	if (!backdrop) return;

	closeBtn?.addEventListener("click", closeProductModal);
	backdrop.addEventListener("click", handleBackdropClick);
	document.addEventListener("keydown", handleKeydown);

	buyBtn?.addEventListener("click", handleBuyClick);
	qtyInput?.addEventListener("blur", clampQuantity);
	qtyInput?.addEventListener("change", clampQuantity);
}