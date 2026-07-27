document.addEventListener('DOMContentLoaded', () => {
    let eventsData = [];

    // Elementy DOM
    const searchInput = document.getElementById('search-input');
    const filterBook = document.getElementById('filter-book');
    const filterCharacter = document.getElementById('filter-character');
    const filterLocation = document.getElementById('filter-location');
    const filterYear = document.getElementById('filter-year');
    const resultsList = document.getElementById('results-list');
    const resultsCount = document.getElementById('results-count');
    
    const eventDetails = document.getElementById('event-details');
    const closeDetailsBtn = document.getElementById('close-details-btn');

    // Pobranie danych z odpornością na błędy
    fetch('data/events.json')
        .then(res => {
            if (!res.ok) {
                throw new Error(`Błąd HTTP ${res.status}: Nie znaleziono pliku data/events.json`);
            }
            return res.json();
        })
        .then(data => {
            eventsData = data;
            initFilters(eventsData);
            renderResults(eventsData);
        })
        .catch(err => {
            console.error('Błąd ładowania danych:', err);
            resultsList.innerHTML = `
                <div style="grid-column: 1/-1; background-color: #331111; color: #ff9999; padding: 1.5rem; border-radius: 8px; border: 1px solid #ff4444;">
                    <h3>Nie udało się załadować bazy danych</h3>
                    <p><strong>Szczegóły błędu:</strong> ${err.message}</p>
                    <p><em>Wskazówka: Użyj lokalnego serwera (np. Live Server w VS Code) lub uruchom stronę na GitHub Pages.</em></p>
                </div>
            `;
        });

    // Inicjalizacja opcji w filtrach na podstawie danych z JSON
    function initFilters(events) {
        const booksMap = new Map();
        const charactersSet = new Set();
        const locationsSet = new Set();
        const yearsSet = new Set();

        ['Geralt', 'Ciri', 'Yennefer', 'Triss'].forEach(c => charactersSet.add(c));

        events.forEach(item => {
            if (item.book && item.year) {
                if (!booksMap.has(item.book) || item.year < booksMap.get(item.book)) {
                    booksMap.set(item.book, item.year);
                }
            }

            if (item.year) yearsSet.add(item.year);
            if (item.location_name) locationsSet.add(item.location_name);
            if (item.other_characters && Array.isArray(item.other_characters)) {
                item.other_characters.forEach(c => charactersSet.add(c));
            }
        });

        const sortedBooks = Array.from(booksMap.entries()).sort((a, b) => a[1] - b[1]);

        sortedBooks.forEach(([bookTitle, minYear]) => {
            const opt = document.createElement('option');
            opt.value = bookTitle;
            opt.textContent = `[${minYear} r.] ${bookTitle}`;
            filterBook.appendChild(opt);
        });

        Array.from(charactersSet).sort().forEach(char => {
            const opt = document.createElement('option');
            opt.value = char;
            opt.textContent = char;
            filterCharacter.appendChild(opt);
        });

        Array.from(locationsSet).sort().forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc;
            opt.textContent = loc;
            filterLocation.appendChild(opt);
        });

        Array.from(yearsSet).sort((a, b) => a - b).forEach(year => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = `${year} r.`;
            filterYear.appendChild(opt);
        });
    }

    // Główna funkcja filtrowania
    function filterEvents() {
        // NAPRAWA: Po zmianie jakiegokolwiek filtra zamykamy widok szczegółów i wracamy do listy wyników
        eventDetails.classList.add('hidden');
        resultsList.classList.remove('hidden');

        const query = searchInput.value.toLowerCase().trim();
        const selectedBook = filterBook.value;
        const selectedChar = filterCharacter.value;
        const selectedLoc = filterLocation.value;
        const selectedYear = filterYear.value;

        const filtered = eventsData.filter(event => {
            const titleMatch = event.title ? event.title.toLowerCase().includes(query) : false;
            const descMatch = event.description ? event.description.toLowerCase().includes(query) : false;
            const bookMatch = event.book ? event.book.toLowerCase().includes(query) : false;
            const locNameMatch = event.location_name ? event.location_name.toLowerCase().includes(query) : false;
            
            const otherCharsMatch = event.other_characters && Array.isArray(event.other_characters)
                ? event.other_characters.some(c => c.toLowerCase().includes(query))
                : false;

            const trackerMatch = event.tracker 
                ? Object.values(event.tracker).some(t => typeof t === 'string' && t.toLowerCase().includes(query))
                : false;

            const textMatch = !query || titleMatch || descMatch || bookMatch || locNameMatch || otherCharsMatch || trackerMatch;

            const bookFilterMatch = !selectedBook || event.book === selectedBook;

            let charMatch = !selectedChar;
            if (selectedChar) {
                const charLower = selectedChar.toLowerCase();
                const inOthers = event.other_characters && event.other_characters.includes(selectedChar);
                
                let inTracker = false;
                if (event.tracker) {
                    if (event.tracker[charLower]) {
                        inTracker = !event.tracker[charLower].includes("Jeszcze się nie urodził");
                    } else {
                        inTracker = Object.values(event.tracker).some(t => typeof t === 'string' && t.toLowerCase().includes(charLower));
                    }
                }

                charMatch = inOthers || inTracker;
            }

            const locMatch = !selectedLoc || event.location_name === selectedLoc;
            const yearMatch = !selectedYear || (event.year && event.year.toString() === selectedYear);

            return textMatch && bookFilterMatch && charMatch && locMatch && yearMatch;
        });

        renderResults(filtered);
    }

    // Renderowanie kart wyników
    function renderResults(events) {
        resultsList.innerHTML = '';
        resultsCount.textContent = events.length;

        if (events.length === 0) {
            resultsList.innerHTML = '<p class="no-results" style="grid-column: 1/-1; text-align: center; color: #aaa; padding: 2rem;">Brak wydarzeń spełniających podane kryteria.</p>';
            return;
        }

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'result-card';
            
            const descSnippet = event.description 
                ? (event.description.length > 110 ? event.description.substring(0, 110) + '...' : event.description)
                : '';

            const chapterInfo = event.chapter ? ` (${event.chapter})` : '';

            card.innerHTML = `
                <div>
                    <div class="result-header">
                        <span class="badge">${event.month || ''} ${event.year || ''} r.</span>
                        <span class="badge secondary">${event.book || ''}</span>
                    </div>
                    <h3>${event.title || 'Bez tytułu'}</h3>
                    <p class="result-loc">📖 <strong>[${event.year || ''} r.] ${event.book || ''}</strong>${chapterInfo}</p>
                    <p class="result-loc">📍 <strong>${event.location_name || 'Różne lokacje'}</strong></p>
                    <p class="result-snippet">${descSnippet}</p>
                </div>
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
        document.getElementById('event-title').textContent = event.title || '';
        document.getElementById('event-date').textContent = `${event.month || ''} ${event.year || ''} r.`;
        document.getElementById('event-book').textContent = `[${event.year || ''} r.] ${event.book || ''} (${event.chapter || ''})`;
        document.getElementById('event-location').textContent = event.location_name || 'Brak danych';
        document.getElementById('event-description').textContent = event.description || '';

        const otherCharsText = (event.other_characters && event.other_characters.length > 0) 
            ? event.other_characters.join(', ') 
            : 'Brak dodatkowych postaci w bazie dla tego wydarzenia';
        document.getElementById('event-other-chars').textContent = otherCharsText;

        const tracker = event.tracker || {};
        document.getElementById('pos-geralt').textContent = tracker.geralt || 'Brak danych';
        document.getElementById('pos-ciri').textContent = tracker.ciri || 'Brak danych';
        document.getElementById('pos-yennefer').textContent = tracker.yennefer || 'Brak danych';
        document.getElementById('pos-triss').textContent = tracker.triss || 'Brak danych';

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
    filterBook.addEventListener('change', filterEvents);
    filterCharacter.addEventListener('change', filterEvents);
    filterLocation.addEventListener('change', filterEvents);
    filterYear.addEventListener('change', filterEvents);
});