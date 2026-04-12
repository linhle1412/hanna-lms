// Role-based navigation and utilities
const Navigation = {
    currentRole: null,
    
    init: function() {
        this.currentRole = sessionStorage.getItem('userRole') || 'trainer';
        this.updateNavigation();
        this.setRoleAttributes();
        this.updateRoleSelector();
    },
    
    updateNavigation: function() {
        // Hide/show menu items based on role
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const requiredRoles = item.getAttribute('data-roles');
            if (requiredRoles) {
                const roles = requiredRoles.split(',');
                if (!roles.includes(this.currentRole)) {
                    item.style.display = 'none';
                } else {
                    item.style.display = 'flex';
                }
            }
        });
    },
    
    setRoleAttributes: function() {
        document.body.setAttribute('data-role', this.currentRole);
    },
    
    updateRoleSelector: function() {
        const roleSelector = document.getElementById('roleSelector');
        if (roleSelector) {
            roleSelector.value = this.currentRole;
        }
    },
    
    navigate: function(page) {
        window.location.href = page;
    },
    
    showModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    },
    
    hideModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    getRoleName: function() {
        const roleNames = {
            'trainer': 'Trainer',
            'lead_region': 'Lead Region',
            'head_channel': 'Head Channel',
            'admin': 'Admin Channel',
            'root_admin': 'Root Admin',
            'dms_admin': 'DMS Admin',
            'master_role': 'Master Role'
        };
        return roleNames[this.currentRole] || 'User';
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    Navigation.init();
    
    // Role selector change handler
    const roleSelector = document.getElementById('roleSelector');
    if (roleSelector) {
        roleSelector.addEventListener('change', function(e) {
            sessionStorage.setItem('userRole', e.target.value);
            Navigation.currentRole = e.target.value;
            Navigation.updateNavigation();
            Navigation.setRoleAttributes();
            location.reload();
        });
    }
});

// Export for use in other scripts
window.Navigation = Navigation;

