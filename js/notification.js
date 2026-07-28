const TOAST_DURATION_MS = 4000;

function getToastContainer() {
	let container = document.querySelector("[data-toast-container]");

	if (!container) {
		container = document.createElement("div");
		container.className = "toast-container";
		container.setAttribute("data-toast-container", "");
		container.setAttribute("aria-live", "polite");
		document.body.appendChild(container);
	}

	return container;
}

/**
 * Показує коротке спливаюче повідомлення (успіх/помилка).
 * @param {string} message
 * @param {"success" | "error"} type
 */
export function showToast(message, type = "success") {
	const container = getToastContainer();

	const toast = document.createElement("p");
	toast.className = `toast toast--${type}`;
	toast.textContent = message;
	container.appendChild(toast);

	requestAnimationFrame(() => {
		toast.classList.add("is-visible");
	});

	setTimeout(() => {
		toast.classList.remove("is-visible");
		toast.addEventListener("transitionend", () => toast.remove(), { once: true });
	}, TOAST_DURATION_MS);
}