document.addEventListener('DOMContentLoaded', function() {
    // Get course ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    if (!courseId) {
        showCourseSelectionView();
    } else {
        // Si hay ID de curso, cargar los detalles del curso
        loadCourseDetails(courseId);
        loadModules(courseId);
        setupEventListeners(courseId);
    }
});

// Error display function
function showError(message) {
    const container = document.querySelector('.dashboard-content');
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <a href="courses.html" class="btn-primary">Volver a Cursos</a>
        </div>
    `;
}

// Load course details
async function loadCourseDetails(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) {
            throw new Error('No se pudo cargar la información del curso');
        }
        
        const course = await response.json();
        
        // Update course information
        document.getElementById('course-title').textContent = course.title;
        document.getElementById('course-description').textContent = course.description;
        
        if (course.image_url) {
            document.getElementById('course-image').src = course.image_url;
        }
        
        document.getElementById('enrolled-count').textContent = course.enrolled_count || 0;
        document.getElementById('module-count').textContent = course.module_count || 0;
        document.getElementById('course-duration').textContent = course.duration || 0;
        
        // Update page title
        document.title = `${course.title} - Módulos | Whirlpool Learning Platform`;
        
    } catch (error) {
        console.error('Error loading course details:', error);
        showError('Error al cargar los detalles del curso');
    }
}

// Load modules for the course
async function loadModules(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/modules`);
        if (!response.ok) {
            throw new Error('No se pudieron cargar los módulos');
        }
        
        const modules = await response.json();
        const modulesContainer = document.getElementById('modules-container');
        
        // Clear container
        modulesContainer.innerHTML = '';
        
        if (modules.length === 0) {
            // Show empty state
            modulesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>No hay módulos disponibles para este curso</p>
                    <button class="btn-primary" id="create-first-module">
                        Crear primer módulo
                    </button>
                </div>
            `;
            
            document.getElementById('create-first-module').addEventListener('click', function() {
                openModuleModal(courseId);
            });
            
            return;
        }
        
        // Sort modules by position
        modules.sort((a, b) => a.position - b.position);
        
        // Create module cards
        modules.forEach(module => {
            const moduleCard = createModuleCard(module, courseId);
            modulesContainer.appendChild(moduleCard);
        });
        
    } catch (error) {
        console.error('Error loading modules:', error);
        const modulesContainer = document.getElementById('modules-container');
        modulesContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar los módulos</p>
                <button class="btn-primary" id="retry-load-modules">
                    Reintentar
                </button>
            </div>
        `;
        
        document.getElementById('retry-load-modules').addEventListener('click', function() {
            loadModules(courseId);
        });
    }
}

// Create a module card element
function createModuleCard(module, courseId) {
    const moduleCard = document.createElement('div');
    moduleCard.className = 'module-card';
    moduleCard.dataset.moduleId = module.module_id;
    
    // Create module header
    const moduleHeader = document.createElement('div');
    moduleHeader.className = 'module-header';
    
    // Module title and expand button
    const titleContainer = document.createElement('div');
    titleContainer.className = 'module-title-container';
    titleContainer.innerHTML = `
        <span class="module-position">${module.position}</span>
        <h3 class="module-title">${module.title}</h3>
        <button class="btn-icon toggle-module">
            <i class="fas fa-chevron-down"></i>
        </button>
    `;
    
    // Module actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'module-actions';
    actionsContainer.innerHTML = `
        <button class="btn-icon edit-module" title="Editar módulo">
            <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon add-content" title="Añadir contenido">
            <i class="fas fa-plus"></i>
        </button>
        <button class="btn-icon delete-module" title="Eliminar módulo">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;
    
    moduleHeader.appendChild(titleContainer);
    moduleHeader.appendChild(actionsContainer);
    moduleCard.appendChild(moduleHeader);
    
    // Create module content container
    const moduleContent = document.createElement('div');
    moduleContent.className = 'module-content';
    
    // Module description
    if (module.description) {
        const description = document.createElement('p');
        description.className = 'module-description';
        description.textContent = module.description;
        moduleContent.appendChild(description);
    }
    
    // Content list
    const contentList = document.createElement('div');
    contentList.className = 'content-list';
    
    // If module has contents
    if (module.contents && module.contents.length > 0) {
        module.contents.forEach(content => {
            const contentItem = createContentItem(content);
            contentList.appendChild(contentItem);
        });
    } else {
        contentList.innerHTML = `
            <div class="empty-content">
                <p>No hay contenido en este módulo</p>
                <button class="btn-text add-first-content" data-module-id="${module.module_id}">
                    <i class="fas fa-plus-circle"></i> Añadir contenido
                </button>
            </div>
        `;
    }
    
    moduleContent.appendChild(contentList);
    moduleCard.appendChild(moduleContent);
    
    // Add event listeners
    moduleCard.querySelector('.toggle-module').addEventListener('click', function() {
        moduleContent.classList.toggle('expanded');
        this.querySelector('i').classList.toggle('fa-chevron-down');
        this.querySelector('i').classList.toggle('fa-chevron-up');
    });
    
    moduleCard.querySelector('.edit-module').addEventListener('click', function() {
        openModuleModal(courseId, module);
    });
    
    moduleCard.querySelector('.add-content').addEventListener('click', function() {
        openContentModal(module.module_id);
    });
    
    if (moduleCard.querySelector('.add-first-content')) {
        moduleCard.querySelector('.add-first-content').addEventListener('click', function() {
            openContentModal(module.module_id);
        });
    }
    
    moduleCard.querySelector('.delete-module').addEventListener('click', function() {
        if (confirm(`¿Estás seguro de que deseas eliminar el módulo "${module.title}"?`)) {
            deleteModule(module.module_id, courseId);
        }
    });
    
    return moduleCard;
}

// Create a content item element
function createContentItem(content) {
    const contentItem = document.createElement('div');
    contentItem.className = 'content-item';
    contentItem.dataset.contentId = content.content_id;
    
    // Get content type icon
    let typeIcon = 'fa-file-alt'; // Default
    switch (content.content_type_id) {
        case 1: typeIcon = 'fa-video'; break;
        case 2: typeIcon = 'fa-file-alt'; break;
        case 3: typeIcon = 'fa-file-pdf'; break;
        case 4: typeIcon = 'fa-image'; break;
        case 5: typeIcon = 'fa-puzzle-piece'; break;
    }
    
    contentItem.innerHTML = `
        <div class="content-info">
            <i class="fas ${typeIcon} content-type-icon"></i>
            <span class="content-title">${content.title}</span>
        </div>
        <div class="content-actions">
            <button class="btn-icon edit-content" title="Editar contenido">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon delete-content" title="Eliminar contenido">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Add event listeners
    contentItem.querySelector('.edit-content').addEventListener('click', function() {
        openContentModal(content.module_id, content);
    });
    
    contentItem.querySelector('.delete-content').addEventListener('click', function() {
        if (confirm(`¿Estás seguro de que deseas eliminar el contenido "${content.title}"?`)) {
            deleteContent(content.content_id, content.module_id);
        }
    });
    
    return contentItem;
}

// Setup event listeners
function setupEventListeners(courseId) {
    // Add module button
    document.getElementById('add-module-btn').addEventListener('click', function() {
        openModuleModal(courseId);
    });
    
    // Edit course button
    document.getElementById('edit-course-btn').addEventListener('click', function() {
        window.location.href = `edit-course.html?id=${courseId}`;
    });
    
    // Preview course button
    document.getElementById('preview-course-btn').addEventListener('click', function() {
        window.open(`../course-preview.html?id=${courseId}`, '_blank');
    });
    
    // Close modals
    document.querySelectorAll('.close-modal, #cancel-module, #cancel-content').forEach(element => {
        element.addEventListener('click', function() {
            document.getElementById('module-modal').style.display = 'none';
            document.getElementById('content-modal').style.display = 'none';
        });
    });
    
    // Module form submission
    document.getElementById('module-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveModule(courseId);
    });
    
    // Content form submission
    document.getElementById('content-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveContent();
    });
    
    // Content type change
    document.getElementById('content-type').addEventListener('change', function() {
        updateContentDataField(this.value);
    });
}

// Open module modal for adding or editing
function openModuleModal(courseId, module = null) {
    const modal = document.getElementById('module-modal');
    const modalTitle = document.getElementById('module-modal-title');
    const form = document.getElementById('module-form');
    
    // Reset form
    form.reset();
    
    if (module) {
        // Edit existing module
        modalTitle.textContent = 'Editar Módulo';
        document.getElementById('module-title').value = module.title;
        document.getElementById('module-description').value = module.description || '';
        document.getElementById('module-position').value = module.position;
        form.dataset.moduleId = module.module_id;
    } else {
        // Add new module
        modalTitle.textContent = 'Añadir Nuevo Módulo';
        delete form.dataset.moduleId;
        
        // Set next position
        const moduleCount = parseInt(document.getElementById('module-count').textContent) || 0;
        document.getElementById('module-position').value = moduleCount + 1;
    }
    
    form.dataset.courseId = courseId;
    modal.style.display = 'block';
}

// Open content modal for adding or editing
function openContentModal(moduleId, content = null) {
    const modal = document.getElementById('content-modal');
    const modalTitle = document.getElementById('content-modal-title');
    const form = document.getElementById('content-form');
    
    // Reset form
    form.reset();
    
    if (content) {
        // Edit existing content
        modalTitle.textContent = 'Editar Contenido';
        document.getElementById('content-title').value = content.title;
        document.getElementById('content-type').value = content.content_type_id;
        document.getElementById('content-data').value = content.content_data || '';
        document.getElementById('content-position').value = content.position;
        form.dataset.contentId = content.content_id;
        
        // Update content data field based on type
        updateContentDataField(content.content_type_id);
    } else {
        // Add new content
        modalTitle.textContent = 'Añadir Nuevo Contenido';
        delete form.dataset.contentId;
        
        // Get module card to count existing contents
        const moduleCard = document.querySelector(`.module-card[data-module-id="${moduleId}"]`);
        const contentCount = moduleCard.querySelectorAll('.content-item').length;
        document.getElementById('content-position').value = contentCount + 1;
        
        // Default to text content
        document.getElementById('content-type').value = '2';
        updateContentDataField('2');
    }
    
    form.dataset.moduleId = moduleId;
    modal.style.display = 'block';
}

// Update content data field based on content type
function updateContentDataField(contentTypeId) {
    const container = document.getElementById('content-data-container');
    
    // Clear previous content
    container.innerHTML = '';
    
    let label, input;
    
    switch (contentTypeId) {
        case '1': // Video
            label = document.createElement('label');
            label.setAttribute('for', 'content-data');
            label.textContent = 'URL del Video';
            
            input = document.createElement('input');
            input.setAttribute('type', 'text');
            input.setAttribute('id', 'content-data');
            input.setAttribute('name', 'content_data');
            input.setAttribute('placeholder', 'https://www.youtube.com/watch?v=...');
            input.required = true;
            break;
            
        case '2': // Text
            label = document.createElement('label');
            label.setAttribute('for', 'content-data');
            label.textContent = 'Contenido de Texto';
            
            input = document.createElement('textarea');
            input.setAttribute('id', 'content-data');
            input.setAttribute('name', 'content_data');
            input.setAttribute('rows', '10');
            input.required = true;
            break;
            
        case '3': // PDF
            label = document.createElement('label');
            label.setAttribute('for', 'content-data');
            label.textContent = 'Archivo PDF';
            
            input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('id', 'content-data');
            input.setAttribute('name', 'content_data');
            input.setAttribute('accept', '.pdf');
            break;
            
        case '4': // Image
            label = document.createElement('label');
            label.setAttribute('for', 'content-data');
            label.textContent = 'Imagen';
            
            input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('id', 'content-data');
            input.setAttribute('name', 'content_data');
            input.setAttribute('accept', 'image/*');
            break;
            
        case '5': // Interactive
            label = document.createElement('label');
            label.setAttribute('for', 'content-data');
            label.textContent = 'Contenido Interactivo (HTML)';
            
            input = document.createElement('textarea');
            input.setAttribute('id', 'content-data');
            input.setAttribute('name', 'content_data');
            input.setAttribute('rows', '15');
            input.required = true;
            break;
            
        default:
            label = document.createElement('label');
            label.setAttribute('for', 'content-data');
            label.textContent = 'Contenido';
            
            input = document.createElement('textarea');
            input.setAttribute('id', 'content-data');
            input.setAttribute('name', 'content_data');
            input.setAttribute('rows', '5');
            input.required = true;
    }
    
    container.appendChild(label);
    container.appendChild(input);
}

// Save module (create or update)
async function saveModule(courseId) {
    const form = document.getElementById('module-form');
    const moduleId = form.dataset.moduleId;
    const isEdit = !!moduleId;
    
    const moduleData = {
        title: document.getElementById('module-title').value,
        description: document.getElementById('module-description').value,
        position: parseInt(document.getElementById('module-position').value),
        course_id: parseInt(courseId)
    };
    
    try {
        const url = isEdit ? `/api/modules/${moduleId}` : '/api/modules';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(moduleData)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar el módulo');
        }
        
        // Close modal and reload modules
        document.getElementById('module-modal').style.display = 'none';
        loadCourseDetails(courseId);
        loadModules(courseId);
        
    } catch (error) {
        console.error('Error saving module:', error);
        alert('Error al guardar el módulo. Por favor, inténtalo de nuevo.');
    }
}

// Save content (create or update)
async function saveContent() {
    const form = document.getElementById('content-form');
    const moduleId = form.dataset.moduleId;
    const contentId = form.dataset.contentId;
    const isEdit = !!contentId;
    
    // Get form data
    const contentData = {
        title: document.getElementById('content-title').value,
        content_type_id: parseInt(document.getElementById('content-type').value),
        position: parseInt(document.getElementById('content-position').value),
        module_id: parseInt(moduleId)
    };
    
    // Handle different content types
    const contentType = document.getElementById('content-type').value;
    const contentDataElement = document.getElementById('content-data');
    
    if (contentType === '3' || contentType === '4') {
        // File upload (PDF or Image)
        if (contentDataElement.files && contentDataElement.files[0]) {
            // Use FormData for file uploads
            const formData = new FormData();
            formData.append('file', contentDataElement.files[0]);
            formData.append('data', JSON.stringify(contentData));
            
            try {
                const url = isEdit ? `/api/contents/${contentId}` : '/api/contents';
                const response = await fetch(url, {
                    method: isEdit ? 'PUT' : 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Error al guardar el contenido');
                }
                
                // Close modal and reload modules
                document.getElementById('content-modal').style.display = 'none';
                loadModules(document.getElementById('module-form').dataset.courseId);
                
            } catch (error) {
                console.error('Error saving content:', error);
                alert('Error al guardar el contenido. Por favor, inténtalo de nuevo.');
            }
        } else {
            alert('Por favor, selecciona un archivo.');
        }
    } else {
        // Text-based content
        contentData.content_data = contentDataElement.value;
        
        try {
            const url = isEdit ? `/api/contents/${contentId}` : '/api/contents';
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contentData)
            });
            
            if (!response.ok) {
                throw new Error('Error al guardar el contenido');
            }
            
            // Close modal and reload modules
            document.getElementById('content-modal').style.display = 'none';
            loadModules(document.getElementById('module-form').dataset.courseId);
            
        } catch (error) {
            console.error('Error saving content:', error);
            alert('Error al guardar el contenido. Por favor, inténtalo de nuevo.');
        }
    }
}

// Delete module
async function deleteModule(moduleId, courseId) {
    try {
        const response = await fetch(`/api/modules/${moduleId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el módulo');
        }
        
        // Reload course details and modules
        loadCourseDetails(courseId);
        loadModules(courseId);
        
    } catch (error) {
        console.error('Error deleting module:', error);
        alert('Error al eliminar el módulo. Por favor, inténtalo de nuevo.');
    }
}

// Delete content
async function deleteContent(contentId, moduleId) {
    try {
        const response = await fetch(`/api/contents/${contentId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el contenido');
        }
        
        // Get course ID from the module form
        const courseId = document.getElementById('module-form').dataset.courseId;
        
        // Reload modules
        loadModules(courseId);
        
    } catch (error) {
        console.error('Error deleting content:', error);
        alert('Error al eliminar el contenido. Por favor, inténtalo de nuevo.');
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const moduleModal = document.getElementById('module-modal');
    const contentModal = document.getElementById('content-modal');
    
    if (event.target === moduleModal) {
        moduleModal.style.display = 'none';
    }
    
    if (event.target === contentModal) {
        contentModal.style.display = 'none';
    }
});

// Add CSS for the module management interface
document.head.insertAdjacentHTML('beforeend', `
<style>
    .module-card {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 16px;
        overflow: hidden;
    }
    
    .module-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
    }
    
    .module-title-container {
        display: flex;
        align-items: center;
        flex: 1;
    }
    
    .module-position {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        background-color: var(--primary-color);
        color: white;
        border-radius: 50%;
        margin-right: 12px;
        font-weight: bold;
    }
    
    .module-title {
        margin: 0;
        font-size: 16px;
        flex: 1;
    }
    
    .module-actions {
        display: flex;
        gap: 8px;
    }
    
    .module-content {
        padding: 0;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease, padding 0.3s ease;
    }
    
    .module-content.expanded {
        padding: 16px;
        max-height: 1000px;
    }
    
    .module-description {
        margin-top: 0;
        margin-bottom: 16px;
        color: #6c757d;
    }
    
    .content-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .content-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background-color: #f8f9fa;
        border-radius: 4px;
        border-left: 3px solid var(--primary-color);
    }
    
    .content-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .content-type-icon {
        color: var(--primary-color);
    }
    
    .content-actions {
        display: flex;
        gap: 8px;
    }
    
    .empty-content {
        text-align: center;
        padding: 16px;
        color: #6c757d;
    }
    
    .btn-text {
        background: none;
        border: none;
        color: var(--primary-color);
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    .btn-text:hover {
        text-decoration: underline;
    }
    
    .course-modules-container {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 24px;
    }
    
    .course-info-card {
        height: fit-content;
    }
    
    .course-header {
        margin-bottom: 16px;
    }
    
    .course-thumbnail {
        width: 100%;
        height: 180px;
        overflow: hidden;
        border-radius: 8px;
        margin-bottom: 16px;
    }
    
    .course-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .course-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
    }
    
    .meta-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #6c757d;
    }
    
    .course-actions {
        display: flex;
        gap: 8px;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    
    .empty-state {
        text-align: center;
        padding: 48px 0;
        color: #6c757d;
    }
    
    .empty-state i {
        font-size: 48px;
        margin-bottom: 16px;
        color: #dee2e6;
    }
    
    .error-state {
        text-align: center;
        padding: 48px 0;
        color: #dc3545;
    }
    
    .error-state i {
        font-size: 48px;
        margin-bottom: 16px;
    }
    
    @media (max-width: 992px) {
        .course-modules-container {
            grid-template-columns: 1fr;
        }
    }
</style>
`);


// Al principio del archivo, después de las declaraciones iniciales

document.addEventListener('DOMContentLoaded', function() {
    // Obtener el ID del curso de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    if (!courseId) {
        // Si no hay ID de curso, mostrar la selección de cursos
        showCourseSelectionView();
    } else {
        // Si hay ID de curso, cargar los detalles del curso
        loadCourseDetails(courseId);
        loadModules(courseId);
        setupEventListeners(courseId);
    }
});

// Añadir esta nueva función para mostrar la vista de selección de cursos
function showCourseSelectionView() {
    // Ocultar la vista de módulos
    document.querySelector('.course-modules-container').style.display = 'none';
    
    // Actualizar el título y descripción
    document.querySelector('.page-header h1').textContent = 'Seleccionar Curso';
    document.querySelector('.page-header p').textContent = 'Selecciona un curso para administrar sus módulos';
    
    // Crear contenedor para la selección de cursos
    const mainContent = document.querySelector('.dashboard-content');
    
    // Crear el elemento de selección de cursos si no existe
    if (!document.getElementById('course-selection-container')) {
        const courseSelectionContainer = document.createElement('div');
        courseSelectionContainer.id = 'course-selection-container';
        courseSelectionContainer.className = 'card';
        courseSelectionContainer.innerHTML = `
            <div class="card-header">
                <h3>Cursos Disponibles</h3>
                <p>Selecciona un curso para administrar sus módulos</p>
            </div>
            <div class="card-body">
                <div class="course-grid" id="courses-grid">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
        
        mainContent.appendChild(courseSelectionContainer);
        
        // Cargar los cursos disponibles
        loadAvailableCourses();
    }
}

// Función para cargar los cursos disponibles
function loadAvailableCourses() {
    fetch('/api/courses')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los cursos');
            }
            return response.json();
        })
        .then(courses => {
            const coursesGrid = document.getElementById('courses-grid');
            coursesGrid.innerHTML = '';
            
            if (courses.length === 0) {
                coursesGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book"></i>
                        <p>No hay cursos disponibles</p>
                        <a href="courses.html" class="btn-primary">
                            <i class="fas fa-plus"></i> Crear Curso
                        </a>
                    </div>
                `;
                return;
            }
            
            // Crear tarjetas para cada curso
            courses.forEach(course => {
                const courseCard = document.createElement('div');
                courseCard.className = 'course-card';
                courseCard.innerHTML = `
                    <div class="course-thumbnail">
                        <img src="../images/courses/${course.thumbnail || 'default-course.jpg'}" alt="${course.title}">
                    </div>
                    <div class="course-info">
                        <h4>${course.title}</h4>
                        <p>${course.description || 'Sin descripción'}</p>
                        <div class="course-meta">
                            <span><i class="fas fa-book"></i> ${course.module_count || 0} módulos</span>
                            <span><i class="fas fa-users"></i> ${course.student_count || 0} estudiantes</span>
                        </div>
                    </div>
                    <div class="course-actions">
                        <a href="course-modules.html?id=${course.course_id}" class="btn-primary">
                            <i class="fas fa-cog"></i> Administrar Módulos
                        </a>
                    </div>
                `;
                coursesGrid.appendChild(courseCard);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            const coursesGrid = document.getElementById('courses-grid');
            coursesGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error al cargar los cursos: ${error.message}</p>
                    <button class="btn-primary" onclick="loadAvailableCourses()">
                        <i class="fas fa-sync"></i> Reintentar
                    </button>
                </div>
            `;
        });
}