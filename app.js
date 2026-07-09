// Global variables
let currentDate = new Date();
let currentView = 'calendar';
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let events = [];
let categories = [
    { id: 'work', name: '직무', color: '#94A3B8' },
    { id: 'personal', name: '개인', color: '#F59E0B' },
    { id: 'health', name: '건강', color: '#10B981' },
    { id: 'deadline', name: '마감', color: '#DC2626' },
    { id: 'important', name: '중요', color: '#4F46E5' }
];
let currentEventId = null;
let isDarkMode = false;

// DOM Elements
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthEl = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const todayBtn = document.getElementById('today-btn');
const addEventBtn = document.getElementById('add-event-btn');
const addListEventBtn = document.getElementById('add-list-event-btn');
const eventForm = document.getElementById('event-form');
const modalOverlay = document.getElementById('modal-overlay');
const eventModal = document.getElementById('event-modal');
const deleteModal = document.getElementById('delete-modal');
const toast = document.getElementById('toast');
const viewTabs = document.querySelectorAll('.view-tab');
const navTabs = document.querySelectorAll('.nav-tab');
const views = document.querySelectorAll('.view');
const filterBtns = document.querySelectorAll('.filter-btn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load data from IndexedDB
    loadDataFromDB();
    
    // Set up event listeners
    setupEventListeners();
    
    // Render initial view
    renderCalendar();
    renderEventList();
    updateCategoriesList();
    
    // Hide modals by default - added explicit class removal
    modalOverlay.style.display = 'none';
    eventModal.classList.remove('active');
    deleteModal.style.display = 'none';
    deleteModal.classList.remove('active');
});

function setupEventListeners() {
    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));
    todayBtn.addEventListener('click', goToToday);
    
    // View switching
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchView(tab.dataset.view));
    });
    
    viewTabs.forEach(tab => {
        tab.addEventListener('click', () => switchCalendarView(tab.dataset.view));
    });
    
    // Add event buttons
    addEventBtn.addEventListener('click', openAddEventModal);
    addListEventBtn.addEventListener('click', openAddEventModal);
    
    // Modal events
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('save-btn').addEventListener('click', saveEvent);
    document.getElementById('delete-cancel-btn').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-confirm-btn').addEventListener('click', deleteEvent);
    document.getElementById('close-btn').addEventListener('click', closeModal);
    
    // Modal overlay click to close
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });
    
    // Form events
    document.getElementById('all-day-checkbox').addEventListener('change', toggleDateTimeFields);
    
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderEventList();
        });
    });
    
    // Theme toggle
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'dark') {
                enableDarkMode();
            } else {
                disableDarkMode();
            }
        });
    });
    
    // Search functionality
    document.getElementById('search-input').addEventListener('input', renderEventList);
}

function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    renderCalendar();
}

function switchView(view) {
    // Hide all views
    views.forEach(v => v.classList.remove('active'));
    
    // Activate the selected view
    document.getElementById(`${view}-view`).classList.add('active');
    
    // Update active nav tab
    navTabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    currentView = view;
}

function switchCalendarView(view) {
    // Update active view tab
    viewTabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Re-render calendar with new view
    renderCalendar();
}

function toggleDateTimeFields() {
    const isAllDay = document.getElementById('all-day-checkbox').checked;
    const startDateTime = document.querySelectorAll('.date-time-row')[0];
    const endDateTime = document.querySelectorAll('.date-time-row')[1];
    
    if (isAllDay) {
        startDateTime.style.display = 'none';
        endDateTime.style.display = 'none';
    } else {
        startDateTime.style.display = 'flex';
        endDateTime.style.display = 'flex';
    }
}

function openAddEventModal() {
    currentEventId = null;
    eventForm.reset();
    
    // Set default values
    const today = new Date();
    document.getElementById('event-start-date').value = formatDate(today);
    document.getElementById('event-end-date').value = formatDate(today);
    
    document.getElementById('modal-title').textContent = '일정 등록';
    modalOverlay.style.display = 'flex';
    eventModal.classList.add('active');
    
    // Ensure the form is properly reset
    document.getElementById('title-error').textContent = '';
}

function openEditEventModal(eventId) {
    currentEventId = eventId;
    const event = events.find(e => e.id === eventId);
    
    if (!event) return;
    
    document.getElementById('event-title').value = event.title || '';
    document.getElementById('event-start-date').value = event.startDate || '';
    document.getElementById('event-start-time').value = event.startTime || '';
    document.getElementById('event-end-date').value = event.endDate || '';
    document.getElementById('event-end-time').value = event.endTime || '';
    document.getElementById('all-day-checkbox').checked = event.allDay || false;
    document.getElementById('event-location').value = event.location || '';
    document.getElementById('event-description').value = event.description || '';
    document.getElementById('event-category').value = event.category || '';
    
    toggleDateTimeFields(); // Update form based on allDay flag
    
    document.getElementById('modal-title').textContent = '일정 수정';
    modalOverlay.style.display = 'flex';
    eventModal.classList.add('active');
}

function saveEvent(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;
    
    const title = document.getElementById('event-title').value;
    const startDate = document.getElementById('event-start-date').value;
    const startTime = document.getElementById('event-start-time').value;
    const endDate = document.getElementById('event-end-date').value;
    const endTime = document.getElementById('event-end-time').value;
    const allDay = document.getElementById('all-day-checkbox').checked;
    const location = document.getElementById('event-location').value;
    const description = document.getElementById('event-description').value;
    const category = document.getElementById('event-category').value;
    
    const eventData = {
        id: Date.now().toString(),
        title,
        startDate,
        startTime,
        endDate,
        endTime,
        allDay,
        location,
        description,
        category
    };
    
    if (currentEventId) {
        // Update existing event
        events = events.map(event => 
            event.id === currentEventId ? { ...event, ...eventData } : event
        );
        showToast('수정 완료');
    } else {
        // Add new event
        events.push(eventData);
        showToast('저장 완료');
    }
    
    // Save to IndexedDB and rerender
    saveDataToDB();
    closeModal();
    
    if (currentView === 'calendar') {
        renderCalendar();
    } else {
        renderEventList();
    }
}

function validateForm() {
    const title = document.getElementById('event-title').value.trim();
    const errorElement = document.getElementById('title-error');
    
    if (!title) {
        errorElement.textContent = '제목을 입력해주세요 (필수)';
        return false;
    } else {
        errorElement.textContent = '';
        return true;
    }
}

function deleteEvent() {
    if (!currentEventId) return;
    
    events = events.filter(event => event.id !== currentEventId);
    saveDataToDB();
    closeDeleteModal();
    showToast('삭제 완료');
    
    // Re-render based on current view
    if (currentView === 'calendar') {
        renderCalendar();
    } else {
        renderEventList();
    }
}

function openDeleteConfirmation(eventId) {
    currentEventId = eventId;
    deleteModal.style.display = 'flex';
}

function closeModal() {
    modalOverlay.style.display = 'none';
    eventModal.classList.remove('active');
    document.getElementById('event-form').reset();
    currentEventId = null;
    document.getElementById('title-error').textContent = '';
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    deleteModal.classList.remove('active');
    currentEventId = null;
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function renderCalendar() {
    // Clear calendar grid
    calendarGrid.innerHTML = '';
    
    // Set current month header
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    currentMonthEl.textContent = `${currentYear}년 ${monthNames[currentMonth]}`;
    
    // Create calendar header row
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    dayNames.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'calendar-header-cell';
        cell.textContent = day;
        calendarGrid.appendChild(cell);
    });
    
    // Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Previous month days
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        addCalendarCell(day, currentMonth - 1, currentYear, true);
    }
    
    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear());
        addCalendarCell(i, currentMonth, currentYear, false, isToday);
    }
    
    // Next month days
    const totalCells = 42; // 6 rows x 7 days
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
        addCalendarCell(i, currentMonth + 1, currentYear, true);
    }
}

function addCalendarCell(day, month, year, isOtherMonth, isToday = false) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    
    if (isOtherMonth) {
        cell.classList.add('other-month');
    }
    
    if (isToday) {
        cell.classList.add('today-cell');
    }
    
    // Add date number
    const dateEl = document.createElement('div');
    dateEl.className = 'calendar-date';
    dateEl.textContent = day;
    cell.appendChild(dateEl);
    
    // Add events for this day
    const dayEvents = getEventsForDay(day, month, year);
    if (dayEvents.length > 0) {
        const eventContainer = document.createElement('div');
        eventContainer.className = 'event-container';
        
        // Show only first few events and add overflow indicator
        const visibleEvents = dayEvents.slice(0, 3);
        const hiddenCount = Math.max(0, dayEvents.length - 3);
        
        visibleEvents.forEach(event => {
            const chip = createEventChip(event);
            eventContainer.appendChild(chip);
        });
        
        if (hiddenCount > 0) {
            const moreChip = document.createElement('div');
            moreChip.className = 'event-chip more';
            moreChip.textContent = `+${hiddenCount}개 더보기`;
            eventContainer.appendChild(moreChip);
        }
        
        cell.appendChild(eventContainer);
    }
    
    calendarGrid.appendChild(cell);
}

function getEventsForDay(day, month, year) {
    return events.filter(event => {
        const eventDate = new Date(event.startDate);
        return (eventDate.getDate() === day && 
                eventDate.getMonth() === month && 
                eventDate.getFullYear() === year);
    });
}

function createEventChip(event) {
    const chip = document.createElement('div');
    chip.className = `event-chip ${event.category}`;
    
    if (event.allDay) {
        chip.textContent = event.title;
    } else {
        chip.innerHTML = `
            <span>${formatTime(event.startTime)}</span>
            <span>${event.title}</span>
        `;
    }
    
    // Add click handler to open event detail
    chip.addEventListener('click', () => {
        if (event.category) {
            openEditEventModal(event.id);
        }
    });
    
    return chip;
}

function renderEventList() {
    const filter = document.querySelector('.filter-btn.active').dataset.filter;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    // Filter events
    let filteredEvents = events;
    
    if (filter !== 'all') {
        filteredEvents = events.filter(event => event.category === filter);
    }
    
    if (searchTerm) {
        filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(searchTerm) || 
            event.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort by date
    filteredEvents.sort((a, b) => {
        const aDate = new Date(a.startDate);
        const bDate = new Date(b.startDate);
        return aDate - bDate;
    });
    
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = '';
    
    if (filteredEvents.length === 0) {
        eventList.innerHTML = `
            <div class="empty-state">
                <div>▢</div>
                <p>표시할 일정이 없습니다.</p>
                <button class="btn btn-primary" id="empty-add-btn">새 일정 등록</button>
            </div>
        `;
        
        document.getElementById('empty-add-btn').addEventListener('click', openAddEventModal);
        return;
    }
    
    filteredEvents.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        
        // Determine category color
        const category = categories.find(c => c.id === event.category);
        const categoryColor = category ? category.color : '#94A3B8';
        
        eventCard.innerHTML = `
            <div class="event-color-bar" style="background-color: ${categoryColor}"></div>
            <div class="event-details">
                <div class="event-title">${event.title}</div>
                <div class="event-date">
                    ${formatEventDate(event)}
                </div>
                ${event.location ? `<div class="event-location">📌 ${event.location}</div>` : ''}
            </div>
            <div class="event-actions">
                <button onclick="openEditEventModal('${event.id}')">✏️</button>
                <button onclick="openDeleteConfirmation('${event.id}')">🗑️</button>
            </div>
        `;
        
        eventList.appendChild(eventCard);
    });
}

function formatEventDate(event) {
    if (!event.startDate) return '';
    
    const date = new Date(event.startDate);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    
    if (event.allDay) {
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 종일`;
    } else {
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${dayNames[date.getDay()]}) ${formatTime(event.startTime)}-${formatTime(event.endTime)}`;
    }
}

function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// IndexedDB functions
async function loadDataFromDB() {
    try {
        // In a real application, this would load from IndexedDB
        // For now, using mock data as a placeholder
        events = [
            {
                id: '1',
                title: '팀 미팅',
                startDate: '2026-07-09',
                startTime: '14:00',
                endDate: '2026-07-09',
                endTime: '16:00',
                allDay: false,
                location: '회의실 A',
                description: '주간 프로젝트 회의',
                category: 'work'
            },
            {
                id: '2',
                title: '프로젝트 점검',
                startDate: '2026-07-09',
                startTime: '18:00',
                endDate: '2026-07-09',
                endTime: '19:00',
                allDay: false,
                location: '집',
                description: '주간 점검 작업',
                category: 'personal'
            },
            {
                id: '3',
                title: '생일',
                startDate: '2026-07-10',
                startTime: '',
                endDate: '2026-07-10',
                endTime: '',
                allDay: true,
                location: '',
                description: '친구 생일 축하',
                category: 'personal'
            }
        ];
        
        renderCalendar();
        renderEventList();
    } catch (error) {
        console.error('Failed to load data:', error);
        showToast('데이터를 불러오지 못했습니다.');
    }
}

async function saveDataToDB() {
    try {
        // In a real application, this would save to IndexedDB
        // For now we just show success message
        console.log('Saving events to DB:', events);
    } catch (error) {
        console.error('Failed to save data:', error);
        showToast('저장에 실패했습니다.');
    }
}

function updateCategoriesList() {
    const categoriesList = document.getElementById('categories-list');
    categoriesList.innerHTML = '';
    
    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <div>
                <span class="category-color" style="background-color: ${category.color}"></span>
                ${category.name}
                <span class="category-count">(${getCategoryEventCount(category.id)})</span>
            </div>
            <div>
                <button onclick="editCategory('${category.id}')">✏️</button>
                <button onclick="deleteCategory('${category.id}')">🗑️</button>
            </div>
        `;
        categoriesList.appendChild(categoryItem);
    });
}

function getCategoryEventCount(categoryId) {
    return events.filter(event => event.category === categoryId).length;
}

function enableDarkMode() {
    isDarkMode = true;
    document.body.classList.add('dark-mode');
    // Apply dark mode CSS variables
    document.documentElement.style.setProperty('--bg-primary', '#171A20');
    document.documentElement.style.setProperty('--text-primary', '#FFFFFF');
    document.documentElement.style.setProperty('--card-bg', '#2D3038');
    document.documentElement.style.setProperty('--border-color', '#3E4149');
}

function disableDarkMode() {
    isDarkMode = false;
    document.body.classList.remove('dark-mode');
    // Reset to default values
    document.documentElement.style.removeProperty('--bg-primary');
    document.documentElement.style.removeProperty('--text-primary');
    document.documentElement.style.removeProperty('--card-bg');
    document.documentElement.style.removeProperty('--border-color');
}

// Utility functions
function formatDateForDisplay(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}