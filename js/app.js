import { initMobileMenu } from "./mobile-menu.js";
import { initModal } from "./modal.js";
import { initProductModal } from "./productModal.js";
import { initCatalogue } from "./catalogue.js";

document.addEventListener("DOMContentLoaded", () => {
	window.AOS?.init();

	initMobileMenu();
	initModal();
	initProductModal();
	initCatalogue();
});