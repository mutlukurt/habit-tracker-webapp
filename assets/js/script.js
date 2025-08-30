// Habit Tracker Application
class HabitTracker {
    constructor() {
        this.habits = this.loadHabits();
        this.currentView = 'daily';
        this.editingHabitId = null;
        
        this.initializeEventListeners();
        this.renderHabits();
        this.updateStats();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Form submissions
        document.getElementById('habit-form').addEventListener('submit', (e) => this.handleAddHabit(e));
        document.getElementById('edit-habit-form').addEventListener('submit', (e) => this.handleEditHabit(e));
        
        // View toggle
        document.getElementById('daily-view').addEventListener('click', () => this.switchView('daily'));
        document.getElementById('weekly-view').addEventListener('click', () => this.switchView('weekly'));
        
        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-edit').addEventListener('click', () => this.closeModal());
        
        // Close modal when clicking outside
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Category select change listeners
        document.getElementById('habit-category').addEventListener('change', (e) => this.updateCategoryIcon(e.target.value, 'selected-category-icon'));
        document.getElementById('edit-habit-category').addEventListener('change', (e) => this.updateCategoryIcon(e.target.value, 'edit-selected-category-icon'));
    }

    // Update category icon in select dropdown
    updateCategoryIcon(category, iconElementId) {
        const iconPaths = {
            health: 'assets/icons/health.svg',
            productivity: 'assets/icons/productivity.svg',
            learning: 'assets/icons/learning.svg',
            mindfulness: 'assets/icons/mindfulness.svg',
            social: 'assets/icons/social.svg',
            creative: 'assets/icons/creative.svg',
            other: 'assets/icons/other.svg'
        };

        const iconElement = document.getElementById(iconElementId);
        if (iconElement && iconPaths[category]) {
            iconElement.src = iconPaths[category];
            iconElement.alt = `${category} icon`;
        }
    }

    // Handle adding a new habit
    handleAddHabit(e) {
        e.preventDefault();
        
        const name = document.getElementById('habit-name').value.trim();
        const category = document.getElementById('habit-category').value;
        const frequency = document.getElementById('habit-frequency').value;
        
        if (!name) return;
        
        const habit = {
            id: Date.now().toString(),
            name,
            category,
            frequency,
            createdAt: new Date().toISOString(),
            completions: {},
            streak: 0,
            bestStreak: 0
        };
        
        this.habits.push(habit);
        this.saveHabits();
        this.renderHabits();
        this.updateStats();
        
        // Reset form with animation
        document.getElementById('habit-form').reset();
        this.showSuccessMessage('Habit added successfully!');
    }

    // Handle editing a habit
    handleEditHabit(e) {
        e.preventDefault();
        
        const name = document.getElementById('edit-habit-name').value.trim();
        const category = document.getElementById('edit-habit-category').value;
        const frequency = document.getElementById('edit-habit-frequency').value;
        
        if (!name || !this.editingHabitId) return;
        
        const habitIndex = this.habits.findIndex(h => h.id === this.editingHabitId);
        if (habitIndex !== -1) {
            this.habits[habitIndex] = {
                ...this.habits[habitIndex],
                name,
                category,
                frequency
            };
            
            this.saveHabits();
            this.renderHabits();
            this.closeModal();
            this.showSuccessMessage('Habit updated successfully!');
        }
    }

    // Delete a habit
    deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.saveHabits();
            this.renderHabits();
            this.updateStats();
            this.showSuccessMessage('Habit deleted successfully!');
        }
    }

    // Open edit modal
    openEditModal(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;
        
        this.editingHabitId = habitId;
        
        document.getElementById('edit-habit-name').value = habit.name;
        document.getElementById('edit-habit-category').value = habit.category;
        document.getElementById('edit-habit-frequency').value = habit.frequency;
        
        // Update the icon to match the selected category
        this.updateCategoryIcon(habit.category, 'edit-selected-category-icon');
        
        document.getElementById('edit-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus on the name input
        setTimeout(() => {
            document.getElementById('edit-habit-name').focus();
        }, 100);
    }

    // Close modal
    closeModal() {
        document.getElementById('edit-modal').classList.remove('show');
        document.body.style.overflow = '';
        this.editingHabitId = null;
    }

    // Toggle habit completion
    toggleHabitCompletion(habitId, date = null) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;
        
        const targetDate = date || this.getCurrentDate();
        
        if (habit.completions[targetDate]) {
            delete habit.completions[targetDate];
        } else {
            habit.completions[targetDate] = true;
        }
        
        this.updateHabitStreak(habit);
        this.saveHabits();
        this.renderHabits();
        this.updateStats();
    }

    // Update habit streak
    updateHabitStreak(habit) {
        const dates = Object.keys(habit.completions).sort().reverse();
        let currentStreak = 0;
        let maxStreak = 0;
        let tempStreak = 0;
        
        const today = this.getCurrentDate();
        const yesterday = this.getDateOffset(-1);
        
        // Check if completed today or yesterday for current streak
        if (habit.completions[today]) {
            currentStreak = 1;
            let checkDate = yesterday;
            
            while (habit.completions[checkDate]) {
                currentStreak++;
                checkDate = this.getDateOffset(-currentStreak);
            }
        } else if (habit.completions[yesterday]) {
            currentStreak = 1;
            let checkDate = this.getDateOffset(-2);
            
            while (habit.completions[checkDate]) {
                currentStreak++;
                checkDate = this.getDateOffset(-currentStreak - 1);
            }
        }
        
        // Calculate max streak
        for (const date of dates) {
            if (habit.completions[date]) {
                tempStreak++;
                maxStreak = Math.max(maxStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }
        
        habit.streak = currentStreak;
        habit.bestStreak = Math.max(habit.bestStreak, maxStreak);
    }

    // Switch between daily and weekly view
    switchView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${view}-view`).classList.add('active');
        
        this.renderHabits();
    }

    // Render all habits
    renderHabits() {
        const container = document.getElementById('habits-container');
        
        if (this.habits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-seedling"></i>
                    </div>
                    <h3>No habits yet</h3>
                    <p>Start building better habits by adding your first one above!</p>
                </div>
            `;
            return;
        }
        
        const habitsHTML = this.habits
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(habit => this.renderHabitCard(habit))
            .join('');
        
        container.innerHTML = habitsHTML;
        
        // Add event listeners to dynamically created elements
        this.addHabitEventListeners();
    }

    // Render individual habit card
    renderHabitCard(habit) {
        const categoryIcons = {
            health: 'icon-health',
            productivity: 'icon-productivity',
            learning: 'icon-learning',
            mindfulness: 'icon-mindfulness',
            social: 'icon-social',
            creative: 'icon-creative',
            other: 'icon-other'
        };

        const categoryIconPaths = {
            health: 'assets/icons/health.svg',
            productivity: 'assets/icons/productivity.svg',
            learning: 'assets/icons/learning.svg',
            mindfulness: 'assets/icons/mindfulness.svg',
            social: 'assets/icons/social.svg',
            creative: 'assets/icons/creative.svg',
            other: 'assets/icons/other.svg'
        };
        
        const progress = this.calculateProgress(habit);
        const isCompletedToday = habit.completions[this.getCurrentDate()];
        
        return `
            <div class="habit-card" data-habit-id="${habit.id}">
                <div class="habit-header">
                    <div class="habit-info">
                        <div class="habit-title">${habit.name}</div>
                        <div class="habit-meta">
                            <span class="habit-category">
                                <span class="category-icon ${categoryIcons[habit.category]}">
                                    <img src="${categoryIconPaths[habit.category]}" alt="${habit.category} icon" />
                                </span>
                                ${this.getCategoryName(habit.category)}
                            </span>
                            <span class="habit-frequency">${habit.frequency}</span>
                        </div>
                    </div>
                    <div class="habit-actions">
                        <button class="action-btn edit-btn" onclick="habitTracker.openEditModal('${habit.id}')" title="Edit habit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="habitTracker.deleteHabit('${habit.id}')" title="Delete habit">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="habit-progress">
                    <div class="progress-header">
                        <div class="streak-info">
                            <i class="fas fa-fire streak-icon"></i>
                            <span class="streak-number">${habit.streak}</span>
                            <span>day streak</span>
                        </div>
                        <div class="best-streak">
                            Best: ${habit.bestStreak} days
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                ${this.currentView === 'daily' ? this.renderDailyView(habit, isCompletedToday) : this.renderWeeklyView(habit)}
            </div>
        `;
    }

    // Render daily view for habit
    renderDailyView(habit, isCompletedToday) {
        return `
            <div class="daily-completion">
                <button class="completion-btn ${isCompletedToday ? 'completed' : ''}" 
                        onclick="habitTracker.toggleHabitCompletion('${habit.id}')"
                        title="${isCompletedToday ? 'Mark as incomplete' : 'Mark as complete'}">
                    <i class="fas ${isCompletedToday ? 'fa-check' : 'fa-circle'}"></i>
                </button>
                <div class="completion-text ${isCompletedToday ? 'completed' : ''}">
                    ${isCompletedToday ? 'Completed today! 🎉' : 'Mark as complete'}
                </div>
            </div>
        `;
    }

    // Render weekly view for habit
    renderWeeklyView(habit) {
        const weekDays = this.getWeekDays();
        const today = this.getCurrentDate();
        
        const weeklyGrid = weekDays.map(day => {
            const isCompleted = habit.completions[day.date];
            const isToday = day.date === today;
            
            return `
                <div class="day-cell ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}"
                     onclick="habitTracker.toggleHabitCompletion('${habit.id}', '${day.date}')"
                     title="${day.label} - ${isCompleted ? 'Completed' : 'Not completed'}">
                    <div class="day-label">${day.short}</div>
                    <div class="day-number">${day.number}</div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="weekly-grid">
                ${weeklyGrid}
            </div>
        `;
    }

    // Add event listeners to habit cards
    addHabitEventListeners() {
        // Event listeners are handled by onclick attributes in the HTML
        // This method is kept for potential future enhancements
    }

    // Calculate habit progress percentage
    calculateProgress(habit) {
        if (habit.frequency === 'daily') {
            const last7Days = Array.from({length: 7}, (_, i) => this.getDateOffset(-i));
            const completedDays = last7Days.filter(date => habit.completions[date]).length;
            return Math.round((completedDays / 7) * 100);
        } else {
            // Weekly habits
            const last4Weeks = Array.from({length: 4}, (_, i) => this.getWeekOffset(-i));
            const completedWeeks = last4Weeks.filter(week => {
                const weekDays = this.getWeekDays(week);
                return weekDays.some(day => habit.completions[day.date]);
            }).length;
            return Math.round((completedWeeks / 4) * 100);
        }
    }

    // Update statistics
    updateStats() {
        const totalHabits = this.habits.length;
        const today = this.getCurrentDate();
        const completedToday = this.habits.filter(habit => habit.completions[today]).length;
        const bestStreak = Math.max(...this.habits.map(h => h.bestStreak), 0);
        
        document.getElementById('total-habits').textContent = totalHabits;
        document.getElementById('completed-today').textContent = completedToday;
        document.getElementById('best-streak').textContent = bestStreak;
        
        // Add animation to updated stats
        this.animateStatUpdate();
    }

    // Animate stat updates
    animateStatUpdate() {
        document.querySelectorAll('.stat-number').forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; // Trigger reflow
            el.style.animation = 'pulse 0.6s ease-in-out';
        });
    }

    // Show success message
    showSuccessMessage(message) {
        // Create and show a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-md);
            box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            font-weight: 500;
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => successDiv.remove(), 300);
        }, 2000);
    }

    // Get current date in YYYY-MM-DD format
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    // Get date with offset
    getDateOffset(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    // Get week with offset
    getWeekOffset(weeks) {
        const date = new Date();
        date.setDate(date.getDate() + (weeks * 7));
        return date;
    }

    // Get days of current week
    getWeekDays(startDate = null) {
        const start = startDate || new Date();
        const startOfWeek = new Date(start);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day;
        startOfWeek.setDate(diff);
        
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            
            days.push({
                date: date.toISOString().split('T')[0],
                short: dayNames[i],
                label: fullDayNames[i],
                number: date.getDate()
            });
        }
        
        return days;
    }

    // Get category display name
    getCategoryName(category) {
        const names = {
            health: 'Health & Fitness',
            productivity: 'Productivity',
            learning: 'Learning',
            mindfulness: 'Mindfulness',
            social: 'Social',
            creative: 'Creative',
            other: 'Other'
        };
        return names[category] || category;
    }

    // Load habits from localStorage
    loadHabits() {
        try {
            const saved = localStorage.getItem('habitTracker_habits');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading habits:', error);
            return [];
        }
    }

    // Save habits to localStorage
    saveHabits() {
        try {
            localStorage.setItem('habitTracker_habits', JSON.stringify(this.habits));
        } catch (error) {
            console.error('Error saving habits:', error);
        }
    }

    // Export habits data (for future enhancement)
    exportHabits() {
        const data = {
            habits: this.habits,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `habits-backup-${this.getCurrentDate()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import habits data (for future enhancement)
    importHabits(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.habits && Array.isArray(data.habits)) {
                    this.habits = data.habits;
                    this.saveHabits();
                    this.renderHabits();
                    this.updateStats();
                    this.showSuccessMessage('Habits imported successfully!');
                }
            } catch (error) {
                console.error('Error importing habits:', error);
                alert('Error importing habits. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.habitTracker = new HabitTracker();
});

// Service Worker registration (for future PWA enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
