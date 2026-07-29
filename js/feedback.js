import { apiClient } from "./apiClient.js";
import { showToast } from "./notification.js";

const FEEDBACK_WINDOW_SIZE = 3;

const feedbackList = document.querySelector("[data-feedback-list]");
const feedbackPrevBtn = document.querySelector("[data-feedback-prev]");
const feedbackNextBtn = document.querySelector("[data-feedback-next]");

let feedbacks = [];
let feedbackIndex = 0;

function renderStateMessage(container, message) {
	if (!container) return;
	container.innerHTML = "";
	container.insertAdjacentHTML("beforeend", `<li class="state-message">${message}</li>`);
}

function createFeedbackCardMarkup({ text, author, location }) {
	const authorLine = location ? `${author}, ${location}` : author;

	return `
    <li class="feedback-card">
      <blockquote class="feedback-quote">"${text}"</blockquote>
      <cite class="feedback-author">${authorLine}</cite>
    </li>
  `;
}

function renderFeedbackWindow() {
	if (!feedbackList) return;

	if (feedbacks.length === 0) {
		renderStateMessage(feedbackList, "No reviews available right now.");
		return;
	}

	const total = feedbacks.length;
	const windowSize = Math.min(FEEDBACK_WINDOW_SIZE, total);
	const visible = [];

	for (let i = 0; i < windowSize; i += 1) {
		visible.push(feedbacks[(feedbackIndex + i) % total]);
	}

	feedbackList.innerHTML = "";
	feedbackList.insertAdjacentHTML("beforeend", visible.map(createFeedbackCardMarkup).join(""));
}

function shiftFeedback(step) {
	if (feedbacks.length === 0) return;
	const total = feedbacks.length;
	feedbackIndex = (feedbackIndex + step + total) % total;
	renderFeedbackWindow();
}

async function loadFeedbacks() {
	try {
		const { data } = await apiClient.get("/feedbacks");

		feedbacks = Array.isArray(data) ? data : [];
		feedbackIndex = 0;
		renderFeedbackWindow();
	} catch (error) {
		renderStateMessage(feedbackList, "Failed to load reviews. Please try again later.");
		showToast("Could not load reviews.", "error");
	}
}

export function initFeedback() {
	loadFeedbacks();

	feedbackPrevBtn?.addEventListener("click", () => shiftFeedback(-1));
	feedbackNextBtn?.addEventListener("click", () => shiftFeedback(1));
}