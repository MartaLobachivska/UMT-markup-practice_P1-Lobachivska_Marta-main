import { initMobileMenu } from "./mobile-menu.js";
import { initModal } from "./modal.js";
import { initProductModal } from "./productModal.js";
import { initCatalogue } from "./catalogue.js";
import { initFeedback } from "./feedback.js";

document.addEventListener("DOMContentLoaded", () => {
	window.AOS?.init();

	initMobileMenu();
	initModal();
	initProductModal();
	initCatalogue();
	initFeedback();
});