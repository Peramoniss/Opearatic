// Executar após o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
	const score = document.getElementById('album-score');
	const left = document.getElementById('left-meta');
	const bottom = document.getElementById('bottom-meta');

	const mq = window.matchMedia('(max-width: 768px)');

	function handle(e) {
		if (e.matches) {
			// mobile -> colocar em bottom
			if (bottom && score && score.parentNode !== bottom) {
				bottom.appendChild(score);
			}
		} else {
			// desktop -> voltar para left (ou inserir numa posição específica)
			if (left && score && score.parentNode !== left) {
				left.appendChild(score);
			}
		}
	}

	function imageExists(url) {
		return new Promise(resolve => {
			const img = new Image();
			img.onload = () => resolve(true);
			img.onerror = () => resolve(false);
			img.src = url;
		});
	}

	async function getCover(artistData) {
		if (artistData.image && await imageExists(artistData.image)) {
			return artistData.image;
		}
		return "../img/no_picture.png";
	}

	// inicial
	handle(mq);
	// escutar mudanças
	mq.addEventListener
		? mq.addEventListener('change', handle)
		: mq.addListener(handle);

	async function fetchAvailableYears() {
		const response = await fetch(`https://opearatic.onrender.com/years`); //Change to http://localhost:8000 for local tests
		return await response.json();
	}

	async function fetchAvailablePages() {
		const response = await fetch(`https://opearatic.onrender.com/pages`);
		return await response.json();
	}

	async function fetchAllTime(page) {
		const response = await fetch(`https://opearatic.onrender.com/all-time/?page=${page}`);
		return await response.json();
	}

	/* ===========================================
		THEME TOGGLE
	=========================================== */
	const toggleBtn = document.getElementById("themeToggle");
	const root = document.documentElement;

	const savedTheme = localStorage.getItem("theme");
	if (savedTheme) {
		root.dataset.theme = savedTheme;
	}else{
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		root.dataset.theme = prefersDark ? "dark" : "light";
		//Does not save in local storage. If the browser preference is kept, the browser preference could change and the theme would change too
	}

	toggleBtn.textContent = root.dataset.theme === "dark" ? "☀️" : "🌙";

	toggleBtn.addEventListener("click", () => {
		const isDark = root.dataset.theme === "dark";
		const nextTheme = isDark ? "light" : "dark";

		root.dataset.theme = nextTheme;
		localStorage.setItem("theme", nextTheme);

		toggleBtn.textContent = nextTheme === "dark" ? "☀️" : "🌙";
	});

	function renderPagination(currentPage, totalPages) {
		const pagContainer = document.getElementById("pagination");
		pagContainer.innerHTML = "";

		const makeItem = (label, page, disabled = false, active = false) => `
			<li class="page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}">
				<a class="page-link rounded-pill px-3" href="?page=${page}">
					${label}
				</a>
			</li>
		`;

		// Anterior
		pagContainer.insertAdjacentHTML(
			"beforeend",
			makeItem("←", currentPage - 1, currentPage === 1)
		);

		// Janela de páginas
		const windowSize = 2;
		const start = Math.max(1, currentPage - windowSize);
		const end = Math.min(totalPages, currentPage + windowSize);

		for (let i = start; i <= end; i++) {
			pagContainer.insertAdjacentHTML(
				"beforeend",
				makeItem(i, i, false, i === currentPage)
			);
		}

		// Próxima
		pagContainer.insertAdjacentHTML(
			"beforeend",
			makeItem("→", currentPage + 1, currentPage === totalPages)
		);

		const upPagContainer = document.getElementById("upper-pagination");
		upPagContainer.innerHTML = pagContainer.innerHTML;
	}

	const container = document.getElementById("reviews");

	const params = new URLSearchParams(window.location.search);

	fetchAvailableYears().then(available_years => {
		const nav = document.getElementById("dropdown-lists");

		const year_nav = `
			<li><a class="dropdown-item" href="year-end_list.html?year=${available_years.at(-1)}">${available_years.at(-1)}</a></li>
			<li><a class="dropdown-item" href="year-end_list.html?year=${available_years.at(-2)}">${available_years.at(-2)}</a></li>
			<li><a class="dropdown-item" href="year-end_list.html?year=${available_years.at(-3)}">${available_years.at(-3)}</a></li>
		`;

		nav.insertAdjacentHTML("afterbegin", year_nav);

		const title = document.getElementById("title");
		title.insertAdjacentHTML("afterbegin", `Best Artists of All-Time`);

		const temp_page = parseInt(params.get("page"), 10);
		const page = Number.isInteger(temp_page) ? temp_page : 1;

		fetchAvailablePages().then(pages => {
			const totalPages = pages.length;
			renderPagination(page, totalPages);
		});

		fetchAllTime(page).then(async data => {
			let i = 1 + 50 * (page - 1);
            container.textContent = ""
			for (const [artistName, artistData] of Object.entries(data)) {
				const cover = await getCover(artistData);

				const template = `
					<div class="col-12">
						<div class="album-review-item d-flex flex-column flex-md-row bg-light-light rounded-4 p-6 shadow-sm">
							<div class="flex-shrink-0 mb-4 mb-md-0 me-md-6 cover-container">
								<img class="img-fluid rounded-3"
									src="${cover}"
									alt="Artist Image"
									style="width: 200px; height: 200px; object-fit: cover;" />
							</div>
							<div class="flex-grow-1">
								<div class="mb-4">
									<div class="d-flex justify-content-between align-items-center mb-2">
										<h3 class="font-heading fs-7 mb-0">${artistName}</h3>
										<span class="album-score">#${i}</span>
									</div>
								</div>
								<div>
									<h4 class="mb-3 fs-8 fw-bold text-success">${artistData.points} points</h4>
									<p class="mb-0 text-secondary">
										${artistData.awards.map(
											award => `<b>${award[2]} point${award[2] === 1 ? '' : 's'}</b> for <i>"${award[0]}"</i>, ${award[1]}`
										).join("<br>")}
									</p>
								</div>
							</div>
						</div>
					</div>
				`;
				container.insertAdjacentHTML("beforeend", template);
				i++;
			}
		});
	});
});