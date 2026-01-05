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

	// inicial
	handle(mq);
	// escutar mudanças
	mq.addEventListener ? mq.addEventListener('change', handle) : mq.addListener(handle);

	async function fetchAvailableYears() {
		const response = await fetch(`http://127.0.0.1:8000/years`);
		return await response.json();
	}

	async function fetchYear(year) {
		const response = await fetch(`http://127.0.0.1:8000/year/${year}`);
		console.log(response);

		if (!response.ok) {
			available_years = await fetchAvailableYears();
			macro = document.getElementById("macro");
			macro.innerHTML = `
				<div class="col-12 text-center py-20">
					<h2 class="font-heading fs-5 mb-4">
						${year} is not available yet
					</h2>
					<p class="fs-9 text-secondary mw-xl mx-auto mb-6">
						This year hasn't been added to the site yet.  
						I'm constantly updating the lists, so check back later!
						(later meaning in a few months)
					</p>
					<a href="?year=${available_years.at(-1)}" class="btn btn-success text-success-light shadow">
						Go to latest year
					</a>
				</div>
			`;

			throw new Error("Year not found");
		}

		return await response.json();
	}

	const hon_html = `
		<div class="col-12 my-8">
			<div class="honorable-divider d-flex align-items-center justify-content-center">
				<span class="badge bg-success px-4 py-2 fs-9 shadow-sm">
					Honorable Mentions
				</span>
			</div>
		</div>
	`;

	const container = document.getElementById("reviews");
	const awards_container = document.getElementById("awardsGrid");
	container.insertAdjacentHTML("beforeend", hon_html);

	const params = new URLSearchParams(window.location.search);
	const temp_year = parseInt(params.get("year"), 10);

	fetchAvailableYears().then(available_years => {
		const nav = document.getElementById("dropdown-lists");
		year_nav = `
			<li><a class="dropdown-item" href="?year=${available_years.at(-1)}">${available_years.at(-1)}</a></li>
			<li><a class="dropdown-item" href="?year=${available_years.at(-2)}">${available_years.at(-2)}</a></li>
			<li><a class="dropdown-item" href="?year=${available_years.at(-3)}">${available_years.at(-3)}</a></li>
		`;
		nav.insertAdjacentHTML("afterbegin", year_nav);

		year = Number.isInteger(temp_year) ? temp_year : available_years.at(-1);

		const title = document.getElementById("title");
		title.insertAdjacentHTML("afterbegin", `Best Albums of ${year}`);

		const awards = document.getElementById("awards");
		awards.insertAdjacentHTML("afterbegin", `${year}'s Golden Pears`);

		const yearNav = document.getElementById("year-nav");
		const years = available_years.map(Number);
		const currentYear = Number(year);
		const index = years.indexOf(currentYear);

		if (index > 0) {
			const prevYear = years[index - 1];
			yearNav.insertAdjacentHTML(
				"beforeend",
				`
				<a href="?year=${prevYear}" class="btn btn-sm btn-outline-secondary rounded-pill px-4">
					← ${prevYear}
				</a>
				`
			);
		} else {
			yearNav.insertAdjacentHTML(
				"beforeend",
				`<span style="width: 90px;"></span>`
			);
		}

		if (index < years.length - 1) {
			const nextYear = years[index + 1];
			yearNav.insertAdjacentHTML(
				"beforeend",
				`
				<a href="?year=${nextYear}" class="btn btn-sm btn-outline-secondary rounded-pill px-4">
					${nextYear} →
				</a>
				`
			);
		} else {
			yearNav.insertAdjacentHTML(
				"beforeend",
				`<span style="width: 90px;"></span>`
			);
		}

		fetchYear(year).then(data => {
			const modified = document.getElementById("modified");
			modified.insertAdjacentHTML("afterbegin", `Last updated in ${data.last_modified}`);

			let honorable = true;
			let i = data.list.length;

			data.list.forEach(item => {
				if (item.honorable == 0 && honorable === true) {
					container.insertAdjacentHTML("beforeend", hon_html);
					honorable = false;
				}

				const highlightsHTML = item.highlights && item.highlights.length
					? `
						<div class="album-highlights mt-4 pt-4 border-top">
							<span class="text-success fw-bold fs-9 d-block mb-2">Highlights</span>
							<ul class="list-inline mb-0">
								${item.highlights.map(
									track => `<li class="list-inline-item highlight-pill" style="margin-bottom:.5rem;">${track}</li>`
								).join("")}
							</ul>
						</div>
					`
					: "";

				const cover = item.cover === ""
					? "https://images.unsplash.com/photo-1619983081593-e2ba5b543168?w=200&h=200&fit=crop"
					: item.cover;

				const template = `
					<div class="col-12">
						<div class="album-review-item d-flex flex-column flex-md-row bg-light-light rounded-4 p-6 shadow-sm">
							<div class="flex-shrink-0 mb-4 mb-md-0 me-md-6 cover-container">
								<img class="img-fluid rounded-3"
									src="${cover}"
									alt="Album Cover"
									style="width: 200px; height: 200px; object-fit: cover;" />
							</div>
							<div class="flex-grow-1">
								<div class="mb-4">
									<div class="d-flex justify-content-between align-items-center mb-2">
										<div class="d-flex align-items-center">
											<span class="album-rank me-2">#${i}</span>
											<h3 class="font-heading fs-7 mb-0">${item.album}</h3>
										</div>
										<span class="album-score">${item.score}</span>
									</div>
									<p class="mb-0 text-secondary fw-medium" style="margin-top: -1rem;">by ${item.artist}</p>
								</div>
								<div>
									<h4 class="mb-3 fs-8 fw-bold text-success">${item.title}</h4>
									<p class="mb-0 text-secondary">${item.review}</p>
									${highlightsHTML}
								</div>
							</div>
						</div>
					</div>
				`;

				container.insertAdjacentHTML("beforeend", template);
				i--;
			});

			data.awards.forEach(item => {
				const prizePic =
					item["prize-picture"] && item["prize-picture"].trim() !== ""
						? item["prize-picture"]
						: "https://images.unsplash.com/photo-1619983081593-e2ba5b543168?w=200&h=200&fit=crop";

				const winner =
					Array.isArray(item.nominees) && item.nominees.length
						? item.nominees[0]
						: null;

				const winnerHTML = winner
					? `
						<div class="mb-3">
							<span class="text-success fw-bold fs-9 d-block mb-2">Winner</span>
							<span class="highlight-pill" style="font-size: 1rem">🥇<b>${winner}</b></span>
						</div>
					`
					: "";

				const winnerSentence = item["winner-sentence"] || "";

				const nomineesHTML =
					Array.isArray(item.nominees) && item.nominees.length > 1
						? `
							<div class="album-highlights mt-4 pt-4 border-top">
								<span class="text-success fw-bold fs-9 d-block mb-2">Other Nominees</span>
								<ul class="list-inline mb-0">
									${item.nominees.slice(1).map(nom => `
										<li class="list-inline-item highlight-pill" style="margin-bottom:.5rem;">${nom}</li>
									`).join("")}
								</ul>
							</div>
						`
						: "";

				const awardCard = `
					<div class="col-12">
						<div class="album-review-item d-flex flex-column flex-md-row bg-light-light rounded-4 p-6 shadow-sm">
							<div class="flex-shrink-0 mb-4 mb-md-0 me-md-6">
								<img class="img-fluid rounded-3"
									src="${prizePic}"
									alt="Award image"
									style="width: 200px; height: 200px; object-fit: cover;" />
							</div>
							<div class="flex-grow-1">
								<div class="mb-3">
									<h3 class="font-heading fs-7 mb-0">${item.title}</h3>
								</div>
								${winnerHTML}
								${winnerSentence ? `<p class="mb-0 text-secondary">${winnerSentence}</p>` : ""}
								${nomineesHTML}
							</div>
						</div>
					</div>
				`;

				awards_container.insertAdjacentHTML("beforeend", awardCard);
			});
		});
	});

	/* ===========================================
		THEME TOGGLE
	=========================================== */
	const toggleBtn = document.getElementById("themeToggle");
	const root = document.documentElement;

	const savedTheme = localStorage.getItem("theme");
	if (savedTheme) {
		root.dataset.theme = savedTheme;
		toggleBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";
	}

	toggleBtn.addEventListener("click", () => {
		const isDark = root.dataset.theme === "dark";
		const nextTheme = isDark ? "light" : "dark";

		root.dataset.theme = nextTheme;
		localStorage.setItem("theme", nextTheme);

		toggleBtn.textContent = nextTheme === "dark" ? "☀️" : "🌙";
	});
});