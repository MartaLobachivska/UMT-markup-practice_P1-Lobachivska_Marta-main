export function initMobileMenu() {
	const menu = document.querySelector("[data-menu]");
	const button = document.querySelector("[data-menu-button]");

	if (!menu || !button) return;

	const links = menu.querySelectorAll(".menu-link");

	const toggleMenu = () => {
		menu.classList.toggle("is-open");
		button.classList.toggle("is-open");

		const isOpen = menu.classList.contains("is-open");
		button.setAttribute("aria-expanded", String(isOpen));

		document.documentElement.classList.toggle("menu-open", isOpen);
		document.body.classList.toggle("menu-open", isOpen);
	};

	button.addEventListener("click", toggleMenu);

	links.forEach((link) => {
		link.addEventListener("click", (event) => {
			event.preventDefault();

			const target = document.querySelector(link.getAttribute("href"));

			menu.classList.remove("is-open");
			button.classList.remove("is-open");
			button.setAttribute("aria-expanded", "false");

			document.documentElement.classList.remove("menu-open");
			document.body.classList.remove("menu-open");

			setTimeout(() => {
				target?.scrollIntoView({ behavior: "smooth", block: "start" });
			}, 250);
		});
	});
}