export function setProgress(percent) {
	const fill = document.querySelector(".progress-bar-fill");
	const text = document.querySelector(".progress-text");

	if (!fill || !text) return;

	fill.style.width = percent + "%";

	if (percent >= 100) {
		setTimeout(() => {
			fill.style.width = "0%";
		}, 1500);
	}
}
