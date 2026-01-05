document.addEventListener('DOMContentLoaded', async () => {
    async function fetchAvailableYears() {
    const response = await fetch(`https://opearatic.onrender.com/years`);
    if (!response.ok) throw new Error("Failed to fetch years");
    return await response.json();
    }

    /* ===========================================
        THEME TOGGLE (same behavior as your main page)
        =========================================== */
    const toggleBtn = document.getElementById("themeToggle");
    const root = document.documentElement;

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
    root.dataset.theme = savedTheme;
    if (toggleBtn) toggleBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";
    } else {
    if (toggleBtn) toggleBtn.textContent = "🌙";
    }

    if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const isDark = root.dataset.theme === "dark";
        const nextTheme = isDark ? "light" : "dark";
        root.dataset.theme = nextTheme;
        localStorage.setItem("theme", nextTheme);
        toggleBtn.textContent = nextTheme === "dark" ? "☀️" : "🌙";
    });
    }

    /* ===========================================
        YEARS RENDER
        =========================================== */
    const yearsMeta = document.getElementById("yearsMeta");
    const yearsGrid = document.getElementById("yearsGrid");
    const yearsRail = document.getElementById("yearsRail");
    const carouselInner = document.getElementById("yearsCarouselInner");
    const dropdown = document.getElementById("dropdown-lists");

    try {
    const years = (await fetchAvailableYears()).map(y => parseInt(y, 10));
    years.sort((a,b) => b - a);

    if (yearsMeta) yearsMeta.textContent = `${years.length} years available • latest: ${years[0]}`;

    // Navbar dropdown (top 3 recent)
    if (dropdown && years.length) {
        const top = years.slice(0, 3);
        const yearNav = top.map(y => `
        <li><a class="dropdown-item" href="year-end_list.html?year=${y}">${y}</a></li>
        `).join("");
        dropdown.insertAdjacentHTML("afterbegin", yearNav);
    }

    // Pill template
    const pill = (y) => `
        <a class="highlight-pill year-pill" href="year-end_list.html?year=${y}" aria-label="Open year ${y}">
        ${y}
        </a>
    `;

    // Desktop grid
    if (yearsGrid) {
        yearsGrid.innerHTML = years.map(pill).join("");
    }

    // Mobile rail (always useful as fallback)
    if (yearsRail) {
        yearsRail.innerHTML = years.map(pill).join("");
    }

    // Mobile carousel (only if more than ~10 years)
    if (carouselInner) {
        const chunkSize = 10; // pills per slide
        const chunks = [];
        for (let i = 0; i < years.length; i += chunkSize) chunks.push(years.slice(i, i + chunkSize));

        // If only 1 chunk, carousel isn't that useful — keep it but it's fine
        carouselInner.innerHTML = chunks.map((chunk, idx) => `
        <div class="carousel-item ${idx === 0 ? "active" : ""}">
            <div class="d-flex flex-wrap justify-content-center gap-3 px-4 py-4">
            ${chunk.map(pill).join("")}
            </div>
        </div>
        `).join("");
    }
    } catch (err) {
    if (yearsMeta) yearsMeta.textContent = "Could not load years. Is the API running at 127.0.0.1:8000?";
    console.error(err);
    }
});
