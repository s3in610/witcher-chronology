document.addEventListener('DOMContentLoaded', () => {
    let eventsData = [];

    // Elementy DOM
    const searchInput = document.getElementById('search-input');
    const filterCharacter = document.getElementById('filter-character');
    const filterLocation = document.getElementById('filter-location');
    const filterYear = document.getElementById('filter-year');
    const resultsList = document.getElementById('results-list');
    const resultsCount = document.getElementById('results-count');
    
    const eventDetails = document.getElementById('event-details');
    const closeDetailsBtn = document.getElementById('close-details-btn');

    // Pobranie danych
    fetch('data/events.json')
        .then(res => res.json())
        .then(data => {
            eventsData = data;
            initFilters(eventsData);
            renderResults(eventsData);
        })
        .catch(err => console.error('Błąd wczytywania danych:', err));

    // Inicjalizacja opcji w filtrach na podstawie danych z JSON
    function initFilters(events) {
        const charactersSet = new Set();
        const locationsSet = new Set();
        const yearsSet = new Set();

        // Podstawowe postacie z trackerów
        ['Geralt', 'Ciri', 'Yennefer', 'Triss'].forEach(c => charactersSet.add(c));

        events.forEach(item => {
            if (item.year) yearsSet.add(item.year);
            if (item.location_name) locationsSet.add(item.location_name);
            if (item.other_characters) {
                item.other_characters.forEach(c => charactersSet.add(c));
            }
        });

        // Wypełnienie listy postaci
        Array.from(charactersSet).sort().forEach(char => {
            const opt = document.createElement('option');
            opt.value = char;
            opt.textContent = char;
            filterCharacter.appendChild(opt);
        });

        // Wypełnienie listy lokacji
        Array.from(locationsSet).sort().forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc;
            opt.textContent = loc;
            filterLocation.appendChild(opt);
        });

        // Wypełnienie listy lat
        Array.from(yearsSet).sort((a,b) => a - b).forEach(year => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = `${year} r.`;
            filterYear.appendChild(opt);
        });
    }

    // Główna funkcja filtrowania
    function filterEvents() {
        const query = searchInput.value.toLowerCase().trim();
        const selectedChar = filterCharacter.value;
        const selectedLoc = filterLocation.value;
        const selectedYear = filterYear.value;

        const filtered = eventsData.filter(event => {
            // Szukanie tekstowe (Tytuł, opis, ksiazka, tracker)
            const textMatch = !query || 
                event.title.toLowerCase().includes(query) ||
                event.description.toLowerCase().includes(query) ||
                event.book.toLowerCase().includes(query) ||
                (event.location_name && event.location_name.toLowerCase().includes(query)) ||
                (event.other_characters && event.other_characters.some(c => c.toLowerCase().includes(query))) ||
                Object.values(event.tracker).some(t => t.toLowerCase().includes(query));

            // Filtr postaci
            let charMatch = !selectedChar;
            if (selectedChar) {
                const inOthers = event.other_characters && event.other_characters.includes(selectedChar);
                const charKey = selectedChar.toLowerCase();
                const inTracker = event.tracker[charKey] && !event.tracker[charKey].includes("Jeszcze się nie urodził");
                charMatch = inOthers || inTracker || selectedChar === 'Geralt' || selectedChar === 'Ciri' || selectedChar === 'Yennefer' || selectedChar === 'Triss';
            }

            // Filtr lokacji
            const locMatch = !selectedLoc || event.location_name === selectedLoc;

            // Filtr roku
            const yearMatch = !selectedYear || event.year.toString() === selectedYear;

            return textMatch && charMatch && locMatch && yearMatch;
        });

        renderResults(filtered);
    }

    // Renderowanie kart wyników
    function renderResults(events) {
        resultsList.innerHTML = '';
        resultsCount.textContent = events.length;

        if (events.length === 0) {
            resultsList.innerHTML = '<p class="no-results">Brak wydarzeń spełniających podane kryteria.</p>';
            return;
        }

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <div class="result-header">
                    <span class="badge">${event.month} ${event.year} r.</span>
                    <span class="badge secondary">${event.book}</span>
                </div>
                <h3>${event.title}</h3>
                <p class="result-loc">📍 <strong>${event.location_name || 'Różne lokacje'}</strong></p>
                <p class="result-snippet">${event.description.substring(0, 110)}...</p>
                <button class="view-btn">Zobacz szczegóły & tracker &rarr;</button>
            `;

            card.querySelector('.view-btn').addEventListener('click', () => {
                showDetails(event);
            });

            resultsList.appendChild(card);
        });
    }

    // Pokazywanie karty szczegółowej
    function showDetails(event) {
        document.getElementById('event-title').textContent = event.title;
        document.getElementById('event-date').textContent = `${event.month} ${event.year} r.`;
        document.getElementById('event-book').textContent = `${event.book} (${event.chapter})`;
        document.getElementById('event-location').textContent = event.location_name || 'Brak danych';
        document.getElementById('event-description').textContent = event.description;

        const otherCharsText = (event.other_characters && event.other_characters.length > 0) 
            ? event.other_characters.join(', ') 
            : 'Brak dodatkowych postaci w bazie dla tego wydarzenia';
        document.getElementById('event-other-chars').textContent = otherCharsText;

        document.getElementById('pos-geralt').textContent = event.tracker.geralt || 'Brak danych';
        document.getElementById('pos-ciri').textContent = event.tracker.ciri || 'Brak danych';
        document.getElementById('pos-yennefer').textContent = event.tracker.yennefer || 'Brak danych';
        document.getElementById('pos-triss').textContent = event.tracker.triss || 'Brak danych';

        resultsList.classList.add('hidden');
        eventDetails.classList.remove('hidden');
        window.scrollTo({ top: eventDetails.offsetTop - 20, behavior: 'smooth' });
    }

    // Zamknięcie szczegółów
    closeDetailsBtn.addEventListener('click', () => {
        eventDetails.classList.add('hidden');
        resultsList.classList.remove('hidden');
    });

    // Event listenery dla wyszukiwania
    searchInput.addEventListener('input', filterEvents);
    filterCharacter.addEventListener('change', filterEvents);
    filterLocation.addEventListener('change', filterEvents);
    filterYear.addEventListener('change', filterEvents);
});
