document.addEventListener('DOMContentLoaded', function() {
    const photoGrid = document.getElementById('photoGrid');
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalImg');
    const closeBtn = document.querySelector('.close-modal');
    const prevBtn = document.querySelector('.modal-prev');
    const nextBtn = document.querySelector('.modal-next');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const searchInput = document.querySelector('.search-box input');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let currentPage = 1;
    let currentFilter = 'all';
    let currentPhotos = [];
    let currentPhotoIndex = 0;

    // 加载照片
    async function loadPhotos(page = 1, filter = 'all', search = '') {
        try {
            const response = await fetch(`/api/photos?page=${page}&filter=${filter}&search=${search}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('加载照片失败:', error);
            return [];
        }
    }

    // 渲染照片
    function renderPhotos(photos) {
        photos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${photo.filepath}" alt="照片" loading="lazy">
                <div class="photo-actions">
                    <button class="delete-btn" data-id="${photo.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // 添加删除事件监听
            const deleteBtn = photoItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                if (confirm('确定要删除这张照片吗？')) {
                    try {
                        const response = await fetch(`/api/photos/${photo.id}`, {
                            method: 'DELETE'
                        });

                        if (response.ok) {
                            photoItem.remove(); // 从DOM中移除
                        } else {
                            const error = await response.json();
                            alert('删除失败: ' + error.error);
                        }
                    } catch (error) {
                        console.error('删除错误:', error);
                        alert('删除失败');
                    }
                }
            });
            
            photoGrid.appendChild(photoItem);
        });
    }

    // 打开模态框
    function openModal(photo) {
        modal.style.display = 'block';
        modalImg.src = photo.filepath;
        currentPhotoIndex = currentPhotos.findIndex(p => p.id === photo.id);
    }

    // 关闭模态框
    function closeModal() {
        modal.style.display = 'none';
    }

    // 下一张照片
    function nextPhoto() {
        if (currentPhotoIndex < currentPhotos.length - 1) {
            currentPhotoIndex++;
            modalImg.src = currentPhotos[currentPhotoIndex].filepath;
        }
    }

    // 上一张照片
    function prevPhoto() {
        if (currentPhotoIndex > 0) {
            currentPhotoIndex--;
            modalImg.src = currentPhotos[currentPhotoIndex].filepath;
        }
    }

    // 加载更多
    loadMoreBtn.addEventListener('click', async () => {
        currentPage++;
        const newPhotos = await loadPhotos(currentPage, currentFilter, searchInput.value);
        if (newPhotos.length > 0) {
            currentPhotos = [...currentPhotos, ...newPhotos];
            renderPhotos(newPhotos);
        } else {
            loadMoreBtn.style.display = 'none';
        }
    });

    // 搜索功能
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            photoGrid.innerHTML = '';
            currentPage = 1;
            const photos = await loadPhotos(1, currentFilter, e.target.value);
            currentPhotos = photos;
            renderPhotos(photos);
            loadMoreBtn.style.display = photos.length > 0 ? 'block' : 'none';
        }, 300);
    });

    // 筛选功能
    filterBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            photoGrid.innerHTML = '';
            currentPage = 1;
            const photos = await loadPhotos(1, currentFilter, searchInput.value);
            currentPhotos = photos;
            renderPhotos(photos);
            loadMoreBtn.style.display = photos.length > 0 ? 'block' : 'none';
        });
    });

    // 事件监听器
    closeBtn.addEventListener('click', closeModal);
    prevBtn.addEventListener('click', prevPhoto);
    nextBtn.addEventListener('click', nextPhoto);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'block') {
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'ArrowLeft') prevPhoto();
            if (e.key === 'Escape') closeModal();
        }
    });

    // 初始加载
    loadPhotos().then(photos => {
        currentPhotos = photos;
        renderPhotos(photos);
    });
}); 