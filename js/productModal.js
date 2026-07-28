const backdrop = document.querySelector("[data-product-modal]");
const closeBtn = document.querySelector("[data-product-modal-close]");
const imageEl = document.querySelector("[data-product-image]");
const titleEl = document.querySelector("[data-product-title]");
const priceEl = document.querySelector("[data-product-price]");
const descriptionEl = document.querySelector("[data-product-description]");
const buyBtn = document.querySelector("[data-product-buy]");

const qtyValueEl = document.querySelector("[data-qty-value]");
const qtyIncreaseBtn = document.querySelector("[data-qty-increase]");
const qtyDecreaseBtn = document.querySelector("[data-qty-decrease]");

let currentProduct = null;
let quantity = 1;
let lastFocusedElement = null;

function isProductModalOpen() {
	return backdrop?.classList.contains("is-open") ?? false;
}

function updateQuantityUI() {
	if (qtyValueEl) qtyValueEl.textContent = String(quantity);
	if (qtyDecreaseBtn) qtyDecreaseBtn.disabled = quantity <= 1;
}

export function openProductModal(product) {
	if (!backdrop || !product) return;

	currentProduct = product;
	quantity = 1;
	updateQuantityUI();

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

function handleQuantityIncrease() {
	quantity += 1;
	updateQuantityUI();
}

function handleQuantityDecrease() {
	if (quantity > 1) {
		quantity -= 1;
		updateQuantityUI();
	}
}

function handleBuyClick() {
	if (!currentProduct) return;

	const { id, name, price } = currentProduct;
	const total = (Number(price) || 0) * quantity;

	closeProductModal();

	// Hands off to the existing order form (js/modal.js listens for this event
	// and pre-fills the hidden bouquetId/bouquet name fields).
	document.dispatchEvent(
		new CustomEvent("bouquet:order", {
			detail: { id, name },
		})
	);

	const messageField = document.querySelector('[name="message"]');
	if (messageField) {
		messageField.value = `I'd like to order "${name}" x${quantity} ($${total}).`;
	}
}

export function initProductModal() {
	if (!backdrop) return;

	closeBtn?.addEventListener("click", closeProductModal);
	backdrop.addEventListener("click", handleBackdropClick);
	document.addEventListener("keydown", handleKeydown);

	buyBtn?.addEventListener("click", handleBuyClick);
	qtyIncreaseBtn?.addEventListener("click", handleQuantityIncrease);
	qtyDecreaseBtn?.addEventListener("click", handleQuantityDecrease);
}