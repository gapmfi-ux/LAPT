// API Loader - Dynamically loads all API modules
class ApiLoader {
    constructor() {
        this.loadedModules = new Set();
        this.loadingPromises = {};
    }

    // Load a specific module
    async loadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            return Promise.resolve();
        }

        if (this.loadingPromises[moduleName]) {
            return this.loadingPromises[moduleName];
        }

        const loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `api/${moduleName}.js`;
            script.onload = () => {
                this.loadedModules.add(moduleName);
                delete this.loadingPromises[moduleName];
                resolve();
            };
            script.onerror = () => {
                delete this.loadingPromises[moduleName];
                reject(new Error(`Failed to load module: ${moduleName}`));
            };
            document.head.appendChild(script);
            this.loadingPromises[moduleName] = loadPromise;
        });

        return loadPromise;
    }

    // Load all modules
    async loadAll() {
        const modules = [
            'api-core',
            'api-auth',
            'api-applications',
            'api-users',
            'api-files',
            'api-workflow',
            'api-utils',
            'main-api'
        ];

        try {
            for (const module of modules) {
                await this.loadModule(module);
            }
            console.log('All API modules loaded successfully');
        } catch (error) {
            console.error('Failed to load API modules:', error);
            throw error;
        }
    }

    // Load with dependencies
    async loadWithDependencies(moduleNames) {
        const dependencies = {
            'api-auth': ['api-core'],
            'api-applications': ['api-core'],
            'api-users': ['api-core'],
            'api-files': ['api-core'],
            'api-workflow': ['api-core'],
            'api-utils': ['api-core'],
            'main-api': ['api-core', 'api-auth', 'api-applications', 'api-users', 'api-files', 'api-workflow', 'api-utils']
        };

        const loadQueue = [];
        const visited = new Set();

        function addToQueue(module) {
            if (visited.has(module)) return;
            visited.add(module);

            // Add dependencies first
            if (dependencies[module]) {
                dependencies[module].forEach(dep => addToQueue(dep));
            }

            // Add the module itself
            if (!loadQueue.includes(module)) {
                loadQueue.push(module);
            }
        }

        // Build load queue
        moduleNames.forEach(module => addToQueue(module));

        // Load in order
        for (const module of loadQueue) {
            await this.loadModule(module);
        }
    }
}

// Create global loader instance
window.ApiLoader = new ApiLoader();

// Auto-load main API when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.ApiLoader.loadModule('main-api');
        console.log('Main API loaded');
    } catch (error) {
        console.error('Failed to auto-load API:', error);
    }
});
