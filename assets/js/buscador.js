document.getElementById('search-all').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const items = document.querySelectorAll('.item'); // Ajusta este selector según tu estructura HTML

    items.forEach(item => {
        const name = item.getAttribute('data-name').toLowerCase();
        const email = item.getAttribute('data-email').toLowerCase();
        const company = item.getAttribute('data-company').toLowerCase();

        if (name.includes(searchTerm) || email.includes(searchTerm) || company.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});