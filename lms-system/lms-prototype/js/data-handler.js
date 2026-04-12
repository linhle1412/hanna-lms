// Data Handler - Utility functions for interacting with state
const DataHandler = {
    // Course operations
    loadCourses: function(filters = {}) {
        return LMSState.getCourses(filters);
    },
    
    createCourse: function(formData) {
        const courseData = {
            code: formData.code || `COURSE-${Date.now()}`,
            name: formData.name,
            program: formData.program,
            trainer: formData.trainer,
            channel: formData.channel,
            region: formData.region,
            startDate: formData.startDate,
            endDate: formData.endDate,
            venue: formData.venue || 'NA',
            section: formData.section || 1,
            status: 'Creating'
        };
        
        const newCourse = LMSState.createCourse(courseData);
        this.refreshCourseList();
        return newCourse;
    },
    
    updateCourse: function(id, formData) {
        const course = LMSState.updateCourse(id, formData);
        this.refreshCourseList();
        this.refreshCourseDetails(id);
        return course;
    },
    
    deleteCourse: function(id) {
        const result = LMSState.deleteCourse(id);
        this.refreshCourseList();
        return result;
    },
    
    // Participant operations
    loadParticipants: function(filters = {}) {
        return LMSState.getParticipants(filters);
    },
    
    createParticipant: function(formData) {
        const participantData = {
            name: formData.name,
            agentCode: formData.agentCode,
            email: formData.email,
            phone: formData.phone,
            region: formData.region,
            channel: formData.channel,
            status: 'Active'
        };
        
        const newParticipant = LMSState.createParticipant(participantData);
        this.refreshParticipantList();
        return newParticipant;
    },
    
    updateParticipant: function(id, formData) {
        const participant = LMSState.updateParticipant(id, formData);
        this.refreshParticipantList();
        this.refreshParticipantDetails(id);
        return participant;
    },
    
    deleteParticipant: function(id) {
        const result = LMSState.deleteParticipant(id);
        this.refreshParticipantList();
        return result;
    },
    
    // Course-Participant relationships
    addParticipantsToCourse: function(courseId, participantIds) {
        participantIds.forEach(pid => {
            LMSState.addParticipantToCourse(courseId, pid);
        });
        this.refreshCourseDetails(courseId);
        return true;
    },
    
    removeParticipantFromCourse: function(courseId, participantId) {
        const result = LMSState.removeParticipantFromCourse(courseId, participantId);
        this.refreshCourseDetails(courseId);
        return result;
    },
    
    // Trainer operations
    loadTrainers: function(filters = {}) {
        return LMSState.getTrainers(filters);
    },
    
    createTrainer: function(formData) {
        const trainerData = {
            name: formData.name,
            email: formData.email,
            type: formData.type,
            region: formData.region,
            rate: formData.rate,
            status: 'Active'
        };
        
        const newTrainer = LMSState.createTrainer(trainerData);
        this.refreshTrainerList();
        return newTrainer;
    },
    
    updateTrainer: function(id, formData) {
        const trainer = LMSState.updateTrainer(id, formData);
        this.refreshTrainerList();
        this.refreshTrainerDetails(id);
        return trainer;
    },
    
    deleteTrainer: function(id) {
        const result = LMSState.deleteTrainer(id);
        this.refreshTrainerList();
        return result;
    },
    
    // User operations
    loadUsers: function(filters = {}) {
        return LMSState.getUsers(filters);
    },
    
    createUser: function(formData) {
        const userData = {
            username: formData.username,
            email: formData.email,
            roles: formData.roles || [],
            team: formData.team
        };
        
        const newUser = LMSState.createUser(userData);
        this.refreshUserList();
        return newUser;
    },
    
    updateUser: function(id, formData) {
        const user = LMSState.updateUser(id, formData);
        this.refreshUserList();
        return user;
    },
    
    deleteUser: function(id) {
        const result = LMSState.deleteUser(id);
        this.refreshUserList();
        return result;
    },
    
    // Refresh functions (can be overridden by pages)
    refreshCourseList: function() {
        if (window.refreshCourseList) {
            window.refreshCourseList();
        }
        LMSState.dispatchEvent('courses_updated');
    },
    
    refreshCourseDetails: function(courseId) {
        if (window.refreshCourseDetails) {
            window.refreshCourseDetails(courseId);
        }
    },
    
    refreshParticipantList: function() {
        if (window.refreshParticipantList) {
            window.refreshParticipantList();
        }
        LMSState.dispatchEvent('participants_updated');
    },
    
    refreshParticipantDetails: function(participantId) {
        if (window.refreshParticipantDetails) {
            window.refreshParticipantDetails(participantId);
        }
    },
    
    refreshTrainerList: function() {
        if (window.refreshTrainerList) {
            window.refreshTrainerList();
        }
        LMSState.dispatchEvent('trainers_updated');
    },
    
    refreshTrainerDetails: function(trainerId) {
        if (window.refreshTrainerDetails) {
            window.refreshTrainerDetails(trainerId);
        }
    },
    
    refreshUserList: function() {
        if (window.refreshUserList) {
            window.refreshUserList();
        }
        LMSState.dispatchEvent('users_updated');
    },
    
    // Helper: Get form data from a form element
    getFormData: function(form) {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            // Handle checkboxes (multiple selections)
            if (formData.getAll(key).length > 1) {
                data[key] = formData.getAll(key);
            } else {
                data[key] = value;
            }
        }
        return data;
    },
    
    // Helper: Show success/error messages
    showMessage: function(message, type = 'success') {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background-color: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Add CSS animation for toast
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

if (typeof window !== 'undefined') {
    window.DataHandler = DataHandler;
}

