/* --- PRODUCT DETAIL MODAL --- */
window.openProductDetail = function (id, title, category, description, imageUrl) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('product-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'product-detail-modal';
        modal.className = 'product-modal';
        modal.innerHTML = `
            <div class="product-modal-content">
                <span class="product-modal-close">&times;</span>
                <img id="product-modal-image" src="" alt="">
                <div class="product-modal-info">
                    <h2 id="product-modal-title"></h2>
                    <p id="product-modal-category"></p>
                    <p id="product-modal-description"></p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close button
        modal.querySelector('.product-modal-close').onclick = () => {
            modal.style.display = 'none';
        };

        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    // Set content
    document.getElementById('product-modal-image').src = imageUrl;
    document.getElementById('product-modal-title').textContent = title;
    document.getElementById('product-modal-category').textContent = category;
    document.getElementById('product-modal-description').textContent = description || '';

    // Show modal
    modal.style.display = 'flex';
};
