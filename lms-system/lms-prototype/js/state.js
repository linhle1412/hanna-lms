// LMS State Management System
const LMSState = {
    // Initialize state from localStorage or default data
    init: function() {
        // Check if data exists in localStorage
        if (localStorage.getItem('lms_courses')) {
            this.courses = JSON.parse(localStorage.getItem('lms_courses'));
        } else {
            this.courses = [];
            this.loadMockData();
        }
        
        if (localStorage.getItem('lms_participants')) {
            this.participants = JSON.parse(localStorage.getItem('lms_participants'));
        } else {
            this.participants = [];
            this.loadMockParticipants();
        }
        
        if (localStorage.getItem('lms_trainers')) {
            this.trainers = JSON.parse(localStorage.getItem('lms_trainers'));
        } else {
            this.trainers = [];
            this.loadMockTrainers();
        }
        
        if (localStorage.getItem('lms_users')) {
            this.users = JSON.parse(localStorage.getItem('lms_users'));
        } else {
            this.users = [];
            this.loadMockUsers();
        }
        
        this.saveAll();
    },
    
    // Load mock data from JSON files
    loadMockData: function() {
        fetch('data/courses.json')
            .then(response => response.json())
            .then(data => {
                this.courses = data;
                this.save('courses');
            })
            .catch(() => {
                // If JSON file doesn't exist, use default data
                this.courses = this.getDefaultCourses();
                this.save('courses');
            });
    },
    
    loadMockParticipants: function() {
        fetch('data/participants.json')
            .then(response => response.json())
            .then(data => {
                this.participants = data;
                this.save('participants');
            })
            .catch(() => {
                this.participants = this.getDefaultParticipants();
                this.save('participants');
            });
    },
    
    loadMockTrainers: function() {
        fetch('data/trainers.json')
            .then(response => response.json())
            .then(data => {
                this.trainers = data;
                this.save('trainers');
            })
            .catch(() => {
                this.trainers = this.getDefaultTrainers();
                this.save('trainers');
            });
    },
    
    loadMockUsers: function() {
        fetch('data/users.json')
            .then(response => response.json())
            .then(data => {
                this.users = data;
                this.save('users');
            })
            .catch(() => {
                this.users = this.getDefaultUsers();
                this.save('users');
            });
    },
    
    // Default mock data
    getDefaultCourses: function() {
        return [
            {
                id: 1,
                code: '4-TPCTIFA_M... Shine',
                name: 'Shine: New course',
                program: 'SHINE Program',
                trainer: 'Trainer1 cloudair',
                channel: 'IFA',
                region: 'IFA Central',
                status: 'Creating',
                startDate: '2025-10-01',
                endDate: '2025-10-16',
                venue: 'NA',
                section: 3,
                createdBy: 'LMS Admin Cloudair',
                participantIds: [1, 2]
            },
            {
                id: 2,
                code: '3-KGNF_SOU... Product',
                name: '2-TPCTAG_SOUTH-Shine',
                program: 'Product Program',
                trainer: 'trainer 2 cloudair',
                channel: 'Banca',
                region: 'Banca South',
                status: 'Creating',
                startDate: '2025-10-01',
                endDate: '2025-10-16',
                venue: 'NA',
                section: 4,
                createdBy: 'LMS Admin Cloudair',
                participantIds: []
            }
        ];
    },
    
    getDefaultParticipants: function() {
        return [
            {
                id: 1,
                name: 'John Doe',
                agentCode: 'AGT001',
                email: 'john@mail.com',
                phone: '123-456-7890',
                region: 'IFA Central',
                channel: 'IFA',
                status: 'Active'
            },
            {
                id: 2,
                name: 'Jane Smith',
                agentCode: 'AGT002',
                email: 'jane@mail.com',
                phone: '234-567-8901',
                region: 'Banca South',
                channel: 'Banca',
                status: 'Active'
            },
            {
                id: 3,
                name: 'Bob Wilson',
                agentCode: 'AGT003',
                email: 'bob@mail.com',
                phone: '345-678-9012',
                region: 'Agency South',
                channel: 'Agency',
                status: 'Active'
            }
        ];
    },
    
    getDefaultTrainers: function() {
        return [
            {
                id: 1,
                name: 'Trainer1 cloudair',
                email: 'trainer1@mail.com',
                type: 'FWD',
                region: 'IFA Central',
                rate: '$50/hr',
                status: 'Active'
            },
            {
                id: 2,
                name: 'Trainer2 cloudair',
                email: 'trainer2@mail.com',
                type: 'FWD',
                region: 'Banca South',
                rate: '$55/hr',
                status: 'Active'
            }
        ];
    },
    
    getDefaultUsers: function() {
        return [
            {
                id: 1,
                username: 'Head_agency',
                email: 'head.agency@fwd.com',
                roles: ['HEAD_CHANNEL', 'LEAD_REGION'],
                team: 'Admin',
                createdDate: '2025-09-01'
            }
        ];
    },
    
    // Save to localStorage
    save: function(type) {
        localStorage.setItem(`lms_${type}`, JSON.stringify(this[type]));
        this.dispatchEvent(`${type}_updated`);
    },
    
    saveAll: function() {
        this.save('courses');
        this.save('participants');
        this.save('trainers');
        this.save('users');
    },
    
    // Event system for reactivity
    listeners: {},
    
    on: function(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    dispatchEvent: function(event) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback());
        }
    },
    
    // Course CRUD operations
    getCourse: function(id) {
        return this.courses.find(c => c.id === id);
    },
    
    getCourses: function(filters = {}) {
        let filtered = [...this.courses];
        
        if (filters.channel) {
            filtered = filtered.filter(c => c.channel === filters.channel);
        }
        if (filters.region) {
            filtered = filtered.filter(c => c.region === filters.region);
        }
        if (filters.status) {
            filtered = filtered.filter(c => c.status === filters.status);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(c => 
                c.code.toLowerCase().includes(search) ||
                c.name.toLowerCase().includes(search)
            );
        }
        
        return filtered;
    },
    
    createCourse: function(courseData) {
        const newCourse = {
            id: Date.now(),
            ...courseData,
            status: courseData.status || 'Creating',
            createdBy: sessionStorage.getItem('currentUser') || 'LMS Admin Cloudair',
            participantIds: []
        };
        this.courses.push(newCourse);
        this.save('courses');
        return newCourse;
    },
    
    updateCourse: function(id, updates) {
        const index = this.courses.findIndex(c => c.id === id);
        if (index !== -1) {
            this.courses[index] = { ...this.courses[index], ...updates };
            this.save('courses');
            return this.courses[index];
        }
        return null;
    },
    
    deleteCourse: function(id) {
        const index = this.courses.findIndex(c => c.id === id);
        if (index !== -1) {
            this.courses.splice(index, 1);
            this.save('courses');
            return true;
        }
        return false;
    },
    
    // Participant CRUD operations
    getParticipant: function(id) {
        return this.participants.find(p => p.id === id);
    },
    
    getParticipants: function(filters = {}) {
        let filtered = [...this.participants];
        
        if (filters.region) {
            filtered = filtered.filter(p => p.region === filters.region);
        }
        if (filters.channel) {
            filtered = filtered.filter(p => p.channel === filters.channel);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(search) ||
                p.agentCode.toLowerCase().includes(search) ||
                p.email.toLowerCase().includes(search) ||
                p.phone.includes(search)
            );
        }
        
        return filtered;
    },
    
    createParticipant: function(participantData) {
        const newParticipant = {
            id: Date.now(),
            ...participantData,
            status: participantData.status || 'Active'
        };
        this.participants.push(newParticipant);
        this.save('participants');
        return newParticipant;
    },
    
    updateParticipant: function(id, updates) {
        const index = this.participants.findIndex(p => p.id === id);
        if (index !== -1) {
            this.participants[index] = { ...this.participants[index], ...updates };
            this.save('participants');
            return this.participants[index];
        }
        return null;
    },
    
    deleteParticipant: function(id) {
        const index = this.participants.findIndex(p => p.id === id);
        if (index !== -1) {
            this.participants.splice(index, 1);
            this.save('participants');
            return true;
        }
        return false;
    },
    
    // Course-Participant relationship operations
    addParticipantToCourse: function(courseId, participantId) {
        const course = this.getCourse(courseId);
        if (course && !course.participantIds.includes(participantId)) {
            course.participantIds.push(participantId);
            this.save('courses');
            return true;
        }
        return false;
    },
    
    removeParticipantFromCourse: function(courseId, participantId) {
        const course = this.getCourse(courseId);
        if (course) {
            course.participantIds = course.participantIds.filter(id => id !== participantId);
            this.save('courses');
            return true;
        }
        return false;
    },
    
    getCourseParticipants: function(courseId) {
        const course = this.getCourse(courseId);
        if (course && course.participantIds) {
            return course.participantIds.map(id => this.getParticipant(id)).filter(p => p);
        }
        return [];
    },
    
    // Trainer CRUD operations
    getTrainer: function(id) {
        return this.trainers.find(t => t.id === id);
    },
    
    getTrainers: function(filters = {}) {
        let filtered = [...this.trainers];
        
        if (filters.region) {
            filtered = filtered.filter(t => t.region === filters.region);
        }
        if (filters.channel) {
            filtered = filtered.filter(t => t.channel === filters.channel);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(t => 
                t.name.toLowerCase().includes(search) ||
                t.email.toLowerCase().includes(search)
            );
        }
        
        return filtered;
    },
    
    createTrainer: function(trainerData) {
        const newTrainer = {
            id: Date.now(),
            ...trainerData,
            status: trainerData.status || 'Active'
        };
        this.trainers.push(newTrainer);
        this.save('trainers');
        return newTrainer;
    },
    
    updateTrainer: function(id, updates) {
        const index = this.trainers.findIndex(t => t.id === id);
        if (index !== -1) {
            this.trainers[index] = { ...this.trainers[index], ...updates };
            this.save('trainers');
            return this.trainers[index];
        }
        return null;
    },
    
    deleteTrainer: function(id) {
        const index = this.trainers.findIndex(t => t.id === id);
        if (index !== -1) {
            this.trainers.splice(index, 1);
            this.save('trainers');
            return true;
        }
        return false;
    },
    
    // User CRUD operations (Root Admin only)
    getUser: function(id) {
        return this.users.find(u => u.id === id);
    },
    
    getUsers: function(filters = {}) {
        let filtered = [...this.users];
        
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(u => 
                u.username.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search)
            );
        }
        
        return filtered;
    },
    
    createUser: function(userData) {
        const newUser = {
            id: Date.now(),
            ...userData,
            createdDate: new Date().toISOString().split('T')[0]
        };
        this.users.push(newUser);
        this.save('users');
        return newUser;
    },
    
    updateUser: function(id, updates) {
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
            this.users[index] = { ...this.users[index], ...updates };
            this.save('users');
            return this.users[index];
        }
        return null;
    },
    
    deleteUser: function(id) {
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
            this.users.splice(index, 1);
            this.save('users');
            return true;
        }
        return false;
    },
    
    // Reset to default data
    reset: function() {
        localStorage.removeItem('lms_courses');
        localStorage.removeItem('lms_participants');
        localStorage.removeItem('lms_trainers');
        localStorage.removeItem('lms_users');
        this.init();
    }
};

// Initialize state when script loads
if (typeof window !== 'undefined') {
    window.LMSState = LMSState;
    document.addEventListener('DOMContentLoaded', function() {
        LMSState.init();
    });
}

