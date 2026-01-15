// Workflow and Access Control Logic

const WORKFLOW_MATRIX = {
    "New": {
        SUBMIT: { stage: "Assessment", status: "PENDING" },
        DRAFT: { stage: "New", status: "NEW" }
    },
    "Assessment": {
        SUBMIT: { stage: "Compliance", status: "PENDING" },
        DRAFT: { stage: "Assessment", status: "PENDING" }
    },
    "Compliance": {
        SUBMIT: { stage: "Ist Review", status: "PENDING" },
        DRAFT: { stage: "Compliance", status: "PENDING" }
    },
    "Ist Review": {
        SUBMIT: { stage: "2nd Review", status: "PENDING" },
        DRAFT: { stage: "Ist Review", status: "PENDING" }
    },
    "2nd Review": {
        SUBMIT: { stage: "Approval", status: "PENDING APPROVAL" },
        DRAFT: { stage: "2nd Review", status: "PENDING" }
    },
    "Approval": {
        SUBMIT: { stage: "Approval", status: "APPROVED" },
        DRAFT: { stage: "Approval", status: "PENDING APPROVAL" }
    }
};

const ROLE_STAGE_MAP = {
    "Credit Sales Officer": ["New", "Assessment"],
    "Credit Analyst": ["Assessment"],
    "AMLRO": ["Compliance"],
    "Head of Credit": ["Ist Review"],
    "Branch Manager/Approver": ["2nd Review"],
    "Approver": ["Approval"],
    "Admin": ["ALL"]
};

// Get next stage and status based on current stage and action
function getNextStageAndStatus(currentStage, action) {
    const stageObj = WORKFLOW_MATRIX[currentStage];
    if (stageObj && stageObj[action]) {
        return stageObj[action];
    }
    return { stage: currentStage, status: "UNKNOWN" };
}

// Get stages allowed for a role
function getStageForRole(role) {
    if (!role) return null;
    return ROLE_STAGE_MAP[role] || null;
}

// Check if user can act on application at current stage
function canUserActOnApplication(userName, userRole, stage) {
    if (!userName || !userRole || !stage) return false;
    
    // Admin has full access
    if (userRole.toLowerCase() === "admin") return true;
    
    const allowedStages = getStageForRole(userRole);
    if (!allowedStages) return false;
    
    // Check if "ALL" or array contains stage
    if (allowedStages === "ALL") return true;
    if (Array.isArray(allowedStages)) {
        return allowedStages.includes(stage);
    }
    
    return allowedStages === stage;
}

// Get user permissions
function getUserPermissions(userName, userRole) {
    return {
        role: userRole,
        stage: getStageForRole(userRole),
        canCreate: userRole === "Credit Sales Officer" || userRole === "Admin",
        canReview: ["Credit Analyst", "AMLRO", "Head of Credit", "Branch Manager/Approver", "Approver", "Admin"].includes(userRole),
        canApprove: ["Approver", "Admin"].includes(userRole),
        canManageUsers: userRole === "Admin"
    };
}

// Format stage for display
function formatStage(stage) {
    const stageMap = {
        "New": { label: "New", color: "#3b82f6", icon: "fa-file-alt" },
        "Assessment": { label: "Assessment", color: "#f59e0b", icon: "fa-search" },
        "Compliance": { label: "Compliance", color: "#8b5cf6", icon: "fa-shield-alt" },
        "Ist Review": { label: "1st Review", color: "#10b981", icon: "fa-eye" },
        "2nd Review": { label: "2nd Review", color: "#f97316", icon: "fa-check-double" },
        "Approval": { label: "Approval", color: "#ec4899", icon: "fa-gavel" }
    };
    
    return stageMap[stage] || { label: stage, color: "#6b7280", icon: "fa-question" };
}

// Get action by for next stage
function findActionByForNextStage(nextStage, currentUser, usersList = []) {
    if (!nextStage) return currentUser;
    
    // Find role that maps to the target stage
    const roleForNextStage = Object.keys(ROLE_STAGE_MAP).find(role => {
        const mapped = ROLE_STAGE_MAP[role];
        if (Array.isArray(mapped)) return mapped.includes(nextStage);
        return mapped === nextStage;
    });
    
    if (roleForNextStage && usersList.length > 0) {
        const userForRole = usersList.find(u => u.role === roleForNextStage);
        if (userForRole) {
            return userForRole.name;
        }
    }
    
    return currentUser;
}

// Export functions
window.WORKFLOW_MATRIX = WORKFLOW_MATRIX;
window.ROLE_STAGE_MAP = ROLE_STAGE_MAP;
window.getNextStageAndStatus = getNextStageAndStatus;
window.getStageForRole = getStageForRole;
window.canUserActOnApplication = canUserActOnApplication;
window.getUserPermissions = getUserPermissions;
window.formatStage = formatStage;
window.findActionByForNextStage = findActionByForNextStage;
