// Workflow API Functions
if (typeof window.makeJsonpRequest === 'undefined') {
    console.error('api-core.js must be loaded before api-workflow.js');
} else {
    const workflowAPI = {
        getStageForRole: function(role) {
            return makeJsonpRequest('getStageForRole', { role: role });
        },
        
        getNextStageAndStatus: function(currentStage, action) {
            return makeJsonpRequest('getNextStageAndStatus', {
                currentStage: currentStage,
                action: action
            });
        },
        
        canUserActOnApplication: function(userName, stage) {
            return makeJsonpRequest('canUserActOnApplication', {
                userName: userName,
                stage: stage
            });
        },
        
        updateStageTracking: function(appNumber, stage, userName) {
            return makeJsonpRequest('updateStageTracking', {
                appNumber: appNumber,
                stage: stage,
                userName: userName
            });
        },
        
        findActionByForNextStage: function(nextStage, currentUser) {
            return makeJsonpRequest('findActionByForNextStage', {
                nextStage: nextStage,
                currentUser: currentUser
            });
        },
        
        // Helper method to get available actions for current user/stage
        getAvailableActions: async function(userName, currentStage) {
            try {
                const [canActResult, stageResult] = await Promise.all([
                    this.canUserActOnApplication(userName, currentStage),
                    this.getStageForRole(window.APP_STATE.user?.role)
                ]);
                
                if (canActResult.success && stageResult.success) {
                    return {
                        canAct: canActResult.canAct,
                        currentStage: currentStage,
                        userRole: window.APP_STATE.user.role,
                        stageInfo: stageResult.data
                    };
                }
                
                return { canAct: false, message: 'Unable to determine available actions' };
            } catch (error) {
                return { canAct: false, message: error.message };
            }
        }
    };
    
    // Make available globally
    window.workflowAPI = workflowAPI;
    console.log('Workflow API module loaded');
}
