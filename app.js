document.addEventListener('DOMContentLoaded', () => {
    let eventsData = [];
    let locationsData = [];

    const eventSelect = document.getElementById('event-select');
    const eventDetails = document.getElementById('event-details');

    // Pobieranie danych z plików JSON
    Promise.all([
        fetch('data/events.json').then(res => res.json()),
        fetch('data/locations.json').then(res => res.json())
    ]).then(([events, locations]) => {
        eventsData = events;
        locationsData = locations;
        populateDropdown(eventsData);
    }).catch(err => console.error('Błąd wczytywania danych:', err));

    function populateDropdown(events) {
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = `[${event.year} - ${event.book}]${event.title}`;
            eventSelect.appendChild(option);
        });
    }

    eventSelect.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        if (!selectedId) {
            eventDetails.classList.add('hidden');
            return;
        }

        const event = eventsData.find(item => item.id === selectedId);
        if (event) {
            renderEventDetails(event);
        }
    });

    function renderEventDetails(event) {
        document.getElementById('event-title').textContent = event.title;
        document.getElementById('event-date').textContent = `${event.month}${event.year} r.`;
        document.getElementById('event-book').textContent = `${event.book} (${event.chapter})`;
        
        const loc = locationsData.find(l => l.id === event.location_id);
        document.getElementById('event-location').textContent = loc ? loc.name : event.location_id;

        document.getElementById('event-description').textContent = event.description;

        // Uzupełnienie trackerów postaci
        document.getElementById('pos-geralt').textContent = event.tracker.geralt || 'Brak danych';
        document.getElementById('pos-ciri').textContent = event.tracker.ciri || 'Brak danych';
        document.getElementById('pos-yennefer').textContent = event.tracker.yennefer || 'Brak danych';
        document.getElementById('pos-triss').textContent = event.tracker.triss || 'Brak danych';

        eventDetails.classList.remove('hidden');
    }
});
