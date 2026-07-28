import { showToast } from "./notification.js";

const backdrop = document.querySelector("[data-modal-backdrop]");
const closeBtn = document.querySelector("[data-modal-close]");
const form = document.querySelector("[data-order-form]");
const bouquetIdField = document.querySelector("[data-order-bouquet-id]");
const bouquetNameField = document.querySelector("[data-order-bouquet-name]");

const ctaButtons = document.querySelectorAll("[data-explore-btn]");

let lastFocusedElement = null;

function isModalOpen() {
	return backdrop?.classList.contains("is-open") ?? false;
}

function openModal({ id = "", name = "" } = {}) {
	if (!backdrop) return;

	if (bouquetIdField) bouquetIdField.value = id;
	if (bouquetNameField) bouquetNameField.value = name;

	lastFocusedElement = document.activeElement;

	backdrop.classList.add("is-open");
	document.documentElement.classList.add("modal-open");
	document.body.classList.add("modal-open");

	const firstField = form?.querySelector("input:not([type='hidden']), textarea");
	firstField?.focus();
}

function closeModal() {
	if (!backdrop || !isModalOpen()) return;

	backdrop.classList.remove("is-open");
	document.documentElement.classList.remove("modal-open");
	document.body.classList.remove("modal-open");

	form?.reset();

	if (lastFocusedElement instanceof HTMLElement) {
		lastFocusedElement.focus();
	}
}

function handleBackdropClick(event) {
	if (event.target === backdrop) {
		closeModal();
	}
}

function handleKeydown(event) {
	if (event.key === "Escape" && isModalOpen()) {
		closeModal();
	}
}

function handleSubmit(event) {
	event.preventDefault();
	if (!form) return;

	if (!form.checkValidity()) {
		form.reportValidity();
		return;
	}

	const formData = new FormData(form);
	const name = formData.get("name");

	// Немає окремого "orders" ресурсу в db.json / json-server, тож заявка
	// обробляється на клієнті: показуємо підтвердження і закриваємо модалку.
	showToast(`Thanks, ${name}! We will contact you shortly.`, "success");
	closeModal();
}

function handleOrderEvent(event) {
	openModal(event.detail);
}

function handleCtaClick(event) {
	const targetSelector = event.currentTarget.dataset.exploreBtn;
	const target = targetSelector ? document.querySelector(targetSelector) : null;
	target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function initModal() {
	closeBtn?.addEventListener("click", closeModal);
	backdrop?.addEventListener("click", handleBackdropClick);
	document.addEventListener("keydown", handleKeydown);
	form?.addEventListener("submit", handleSubmit);
	document.addEventListener("bouquet:order", handleOrderEvent);

	ctaButtons.forEach((button) => {
		button.addEventListener("click", handleCtaClick);
	});
}