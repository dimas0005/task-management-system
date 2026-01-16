/**
 * Task Controller - Mengatur alur kerja task management
 * 
 * Handles:
 * - Task creation, update, deletion
 * - Task assignment dan filtering
 * - Task statistics dan reporting
 */
class TaskController {
    constructor(taskRepository, userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.currentUser = null;
    }
    
    /**
     * Set current user untuk operasi task
     * @param {string} userId - User ID
     */
    setCurrentUser(userId) {
        this.currentUser = this.userRepository.findById(userId);
    }
    
    /**
     * Create new task
     * @param {Object} taskData - Task data
     * @returns {Object} - Response dengan task yang dibuat atau error
     */
    createTask(taskData) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'User harus login untuk membuat task'
                };
            }
            
            if (!taskData.title || taskData.title.trim() === '') {
                return {
                    success: false,
                    error: 'Judul task wajib diisi'
                };
            }
            
            // Set owner ID dari current user
            taskData.ownerId = this.currentUser.id;
            
            // Handle assignee
            if (taskData.assigneeId === 'self') {
                taskData.assigneeId = this.currentUser.id;
            } else if (taskData.assigneeId) {
                // Validasi assignee exists
                const assignee = this.userRepository.findById(taskData.assigneeId);
                if (!assignee) {
                    return {
                        success: false,
                        error: 'Assignee tidak ditemukan'
                    };
                }
            }
            
            // Buat task
            const task = this.taskRepository.create(taskData);
            
            return {
                success: true,
                data: task,
                message: 'Task berhasil dibuat'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get all tasks for current user
     * @param {Object} options - Filter dan sort options
     * @returns {Object} - Response dengan list task
     */
    getTasks(options = {}) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'User harus login untuk melihat task'
                };
            }
            
            // Filter berdasarkan current user
            const filters = {
                ownerId: this.currentUser.id
            };
            
            // Apply additional filters
            if (options.status && options.status !== 'all') {
                filters.status = options.status;
            }
            
            let tasks = this.taskRepository.filter(filters);
            
            // Apply search if provided
            if (options.searchQuery && options.searchQuery.trim() !== '') {
                const searchResults = this.taskRepository.search(options.searchQuery);
                // Filter search results untuk current user
                tasks = searchResults.filter(task => task.ownerId === this.currentUser.id);
            }
            
            // Apply sorting
            if (options.sortBy) {
                tasks = this.taskRepository.sort(tasks, options.sortBy, options.sortOrder || 'desc');
            }
            
            return {
                success: true,
                data: tasks,
                count: tasks.length
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get single task by ID
     * @param {string} taskId - Task ID
     * @returns {Object} - Response dengan task atau error
     */
    getTask(taskId) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'User harus login untuk melihat task'
                };
            }
            
            const task = this.taskRepository.findById(taskId);
            
            if (!task) {
                return {
                    success: false,
                    error: 'Task tidak ditemukan'
                };
            }
            
            // Cek permission (hanya owner yang bisa lihat)
            if (task.ownerId !== this.currentUser.id) {
                return {
                    success: false,
                    error: 'Tidak memiliki akses ke task ini'
                };
            }
            
            return {
                success: true,
                data: task
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Update task
     * @param {string} taskId - Task ID
     * @param {Object} updates - Data yang akan diupdate
     * @returns {Object} - Response dengan task yang diupdate atau error
     */
    updateTask(taskId, updates) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'User harus login untuk mengupdate task'
                };
            }
            
            // Cek task exists dan permission
            const task = this.taskRepository.findById(taskId);
            if (!task) {
                return {
                    success: false,
                    error: 'Task tidak ditemukan'
                };
            }
            
            if (task.ownerId !== this.currentUser.id) {
                return {
                    success: false,
                    error: 'Tidak memiliki akses untuk mengupdate task ini'
                };
            }
            
            // Update task
            const updatedTask = this.taskRepository.update(taskId, updates);
            
            if (!updatedTask) {
                return {
                    success: false,
                    error: 'Gagal mengupdate task'
                };
            }
            
            return {
                success: true,
                data: updatedTask,
                message: 'Task berhasil diupdate'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Delete task
     * @param {string} taskId - Task ID
     * @returns {Object} - Response success atau error
     */
    deleteTask(taskId) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'User harus login untuk menghapus task'
                };
            }
            
            // Cek task exists dan permission
            const task = this.taskRepository.findById(taskId);
            if (!task) {
                return {
                    success: false,
                    error: 'Task tidak ditemukan'
                };
            }
            
            if (task.ownerId !== this.currentUser.id) {
                return {
                    success: false,
                    error: 'Tidak memiliki akses untuk menghapus task ini'
                };
            }
            
            // Delete task
            const success = this.taskRepository.delete(taskId);
            
            return {
                success: success,
                message: success ? 'Task berhasil dihapus' : 'Gagal menghapus task'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Search tasks
     * @param {string} query - Search query
     * @returns {Object} - Response dengan hasil search
     */
    searchTasks(query) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'User harus login untuk mencari task'
                };
            }
            
            if (!query || query.trim() === '') {
                return {
                    success: false,
                    error: 'Query pencarian tidak boleh kosong'
                };
            }
            
            const tasks = this.taskRepository.search(query);
            
            // Filter hanya task milik current user
            const userTasks = tasks.filter(task => task.ownerId === this.currentUser.id);
            
            return {
                success: true,
                data: userTasks,
                count: userTasks.length,
                query: query
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get overdue tasks
     * @returns {Object} - Response dengan overdue tasks
     */
    getOverdueTasks() {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'User harus login untuk melihat task'
                };
            }
            
            const overdueTasks = this.taskRepository.findOverdue();
            // Filter hanya task milik current user
            const userOverdueTasks = overdueTasks.filter(task => task.ownerId === this.currentUser.id);
            
            return {
                success: true,
                data: userOverdueTasks,
                count: userOverdueTasks.length
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get tasks due soon
     * @param {number} days - Number of days
     * @returns {Object} - Response dengan tasks due soon
     */
    getTasksDueSoon(days = 3) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'User harus login untuk melihat task'
                };
            }
            
            const dueSoonTasks = this.taskRepository.findDueSoon(days);
            // Filter hanya task milik current user
            const userDueSoonTasks = dueSoonTasks.filter(task => task.ownerId === this.currentUser.id);
            
            return {
                success: true,
                data: userDueSoonTasks,
                count: userDueSoonTasks.length
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get task statistics
     * @returns {Object} - Response dengan task statistics
     */
    getTaskStats() {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'User harus login untuk melihat statistik'
                };
            }
            
            const stats = this.taskRepository.getStats(this.currentUser.id);
            
            return {
                success: true,
                data: stats
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Toggle task status
     * @param {string} taskId - Task ID
     * @param {string} status - Status baru (optional)
     * @returns {Object} - Response dengan task yang diupdate
     */
    toggleTaskStatus(taskId, status = null) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'User harus login untuk mengupdate status task'
                };
            }
            
            const taskResponse = this.getTask(taskId);
            if (!taskResponse.success) {
                return taskResponse;
            }
            
            const task = taskResponse.data;
            
            // Determine new status
            let newStatus = status;
            if (!newStatus) {
                // Cycle through statuses
                switch (task.status) {
                    case 'pending':
                        newStatus = 'in-progress';
                        break;
                    case 'in-progress':
                        newStatus = 'completed';
                        break;
                    case 'completed':
                        newStatus = 'pending';
                        break;
                    case 'blocked':
                        newStatus = 'pending';
                        break;
                    default:
                        newStatus = 'pending';
                }
            }
            
            return this.updateTask(taskId, { status: newStatus });
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Filter tasks
     * @param {Object} filters - Filter criteria
     * @returns {Object} - Response dengan filtered tasks
     */
    filterTasks(filters) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'User harus login untuk filter task'
                };
            }
            
            // Tambahkan filter owner ID
            filters.ownerId = this.currentUser.id;
            
            const tasks = this.taskRepository.filter(filters);
            
            return {
                success: true,
                data: tasks,
                count: tasks.length
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskController;
} else {
    window.TaskController = TaskController;
}
