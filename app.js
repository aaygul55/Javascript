// Kitapları localStorage'dan al
function getBooks() {
    try {
        const data = localStorage.getItem('books');
        if (!data) return [];
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        console.warn('Veri okuma hatası');
        return [];
    }
}

// Kitapları localStorage'a kaydet
function saveBooks(books) {
    try {
        localStorage.setItem('books', JSON.stringify(books));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('Depolama alanı dolu! Lütfen eski kitapları silin.');
        } else {
            console.error('Kaydetme hatası:', e);
            alert('Kitap kaydedilirken bir hata oluştu!');
        }
    }
}

// Kategoriye göre renk döndür
function getCategoryClass(category) {
    const colors = {
        'roman': 'bg-purple',
        'bilim-kurgu': 'bg-cyan',
        'fantastik': 'bg-red',
        'bilim': 'bg-green',
        'tarih': 'bg-amber',
        'felsefe': 'bg-indigo',
        'psikoloji': 'bg-pink',
        'kisisel-gelisim': 'bg-teal',
        'biyografi': 'bg-gray',
        'siir': 'bg-yellow',
        'diger': 'bg-orange'
    };
    return colors[category] || 'bg-purple';
}

// XSS koruması için HTML özel karakterleri kaçış karakterlerine çevir
function escapeHTML(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#039;');
}

// Arama yaparken gecikmeli çalıştır (performans için)
let searchTimeout = null;

function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterBooks, 300);
}

// Kitapları filtrele ve sırala
function filterBooks() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;
    const rating = document.getElementById('ratingFilter').value;
    const sort = document.getElementById('sortFilter').value;

    let books = getBooks();

    if (search) {
        books = books.filter(b => 
            b.title.toLowerCase().includes(search) || 
            b.author.toLowerCase().includes(search)
        );
    }

    if (category !== 'tum') {
        books = books.filter(b => b.category === category);
    }

    if (status !== 'tum') {
        books = books.filter(b => b.status === status);
    }

    if (rating !== 'tum') {
        const min = parseInt(rating);
        books = books.filter(b => b.rating && b.rating >= min);
    }

    if (sort === 'en-yeni') {
        books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'en-eski') {
        books.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'alfabetik-a-z') {
        books.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'alfabetik-z-a') {
        books.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sort === 'puan-azalan') {
        books.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'puan-artan') {
        books.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sort === 'sayfa-azalan') {
        books.sort((a, b) => (b.pageCount || 0) - (a.pageCount || 0));
    } else if (sort === 'sayfa-artan') {
        books.sort((a, b) => (a.pageCount || 0) - (b.pageCount || 0));
    }

    renderBooks(books);
}

// Filtreleri sıfırla
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'tum';
    document.getElementById('statusFilter').value = 'tum';
    document.getElementById('ratingFilter').value = 'tum';
    document.getElementById('sortFilter').value = 'en-yeni';
    filterBooks();
}

// Modal'ı aç (ekleme veya düzenleme)
function addBooksModalOpen(editId = null) {
    const modal = new bootstrap.Modal(document.getElementById('addBookModal'));
    const title = document.getElementById('modalTitle');
    const btn = document.getElementById('saveBookBtn');
    const editField = document.getElementById('editId');

    if (editId) {
        title.innerHTML = '<i class="bi bi-pencil-square"></i> Kitap Düzenle';
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Güncelle';
        editField.value = editId;

        const book = getBooks().find(b => b.id === editId);
        if (book) {
            document.getElementById('bookTitle').value = book.title || '';
            document.getElementById('bookAuthor').value = book.author || '';
            document.getElementById('bookCategory').value = book.category || 'roman';
            document.getElementById('bookIsbn').value = book.isbn || '';
            document.getElementById('bookPages').value = book.pageCount || '';
            document.getElementById('bookStatus').value = book.status || 'Okunacak';
            document.getElementById('bookRating').value = book.rating || '';
            document.getElementById('bookNotes').value = book.notes || '';
        }
    } else {
        title.innerHTML = '<i class="bi bi-plus-circle"></i> Yeni Kitap Ekle';
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Kaydet';
        editField.value = '';
        document.getElementById('bookForm').reset();
        document.getElementById('bookCategory').value = 'roman';
        document.getElementById('bookStatus').value = 'Okunacak';
    }

    modal.show();
    setTimeout(toggleRatingAndNotes, 100);
}

// Modal'ı kapat
function addBooksClose() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
    if (modal) modal.hide();
}

// Duruma göre puan ve not alanlarını aç/kapa (Okundu ise aktif, değilse pasif ve temizle)
function toggleRatingAndNotes() {
    const status = document.getElementById('bookStatus').value;
    const isRead = status === 'Okundu';
    const rating = document.getElementById('bookRating');
    const notes = document.getElementById('bookNotes');
    
    rating.disabled = !isRead;
    rating.style.opacity = isRead ? '1' : '0.5';
    rating.style.cursor = isRead ? 'pointer' : 'not-allowed';
    
    notes.disabled = !isRead;
    notes.style.opacity = isRead ? '1' : '0.5';
    notes.style.cursor = isRead ? 'text' : 'not-allowed';
    notes.style.background = isRead ? '#ffffff' : '#f1f5f9';
    
    if (!isRead) {
        rating.value = '';
        notes.value = '';
    }
}

// Kitap kaydet (yeni ekle veya güncelle)
function saveBook() {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const category = document.getElementById('bookCategory').value;
    const isbn = document.getElementById('bookIsbn').value.trim();
    const pageCount = parseInt(document.getElementById('bookPages').value) || 0;
    const status = document.getElementById('bookStatus').value;
    const rating = parseInt(document.getElementById('bookRating').value) || 0;
    const notes = document.getElementById('bookNotes').value.trim();
    const editId = document.getElementById('editId').value;

    if (!title || !author) {
        alert('Kitap adı ve yazar alanları zorunludur!');
        document.getElementById('bookTitle').focus();
        return;
    }

    if (pageCount < 0) {
        alert('Sayfa sayısı 0\'dan küçük olamaz!');
        document.getElementById('bookPages').focus();
        return;
    }

    let books = getBooks();

    if (editId) {
        const idx = books.findIndex(b => b.id === editId);
        if (idx === -1) {
            alert('Kitap bulunamadı!');
            return;
        }
        
        let finalRating = rating;
        let finalNotes = notes;
        if (status !== 'Okundu') {
            finalRating = 0;
            finalNotes = '';
        }
        
        books[idx] = {
            ...books[idx],
            title,
            author,
            category,
            isbn,
            pageCount,
            status: status || 'Okunacak',
            rating: finalRating,
            notes: finalNotes,
            updatedAt: new Date().toISOString()
        };
    } else {
        books.unshift({
            id: Date.now().toString(),
            title,
            author,
            category,
            isbn,
            pageCount,
            status: status || 'Okunacak',
            rating: 0,
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    saveBooks(books);
    const modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
    if (modal) modal.hide();
    filterBooks();
}

// Kitap sil (onay iste)
function deleteBook(bookId) {
    if (!confirm('Bu kitabı silmek istediğinize emin misiniz?')) return;
    
    const allBooks = getBooks();
    const books = allBooks.filter(b => b.id !== bookId);
    saveBooks(books);
    filterBooks();
}

// Kitap düzenleme modal'ını aç
function editBook(bookId) {
    addBooksModalOpen(bookId);
}

// Kitapları ekrana bas
function renderBooks(books = null) {
    if (books === null || books === undefined) {
        books = getBooks();
    }

    const grid = document.getElementById('booksGrid');
    if (!grid) return;

    if (!books.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-book"></i>
                <h3>Henüz kitap eklemediniz</h3>
                <p>Yukarıdaki "Yeni Kitap Ekle" butonuna tıklayarak ilk kitabınızı ekleyin.</p>
            </div>
        `;
        updateStats(books);
        return;
    }

    const catNames = {
        'roman': 'Roman',
        'bilim-kurgu': 'Bilim Kurgu',
        'fantastik': 'Fantastik',
        'bilim': 'Bilim',
        'tarih': 'Tarih',
        'felsefe': 'Felsefe',
        'psikoloji': 'Psikoloji',
        'kisisel-gelisim': 'Kişisel Gelişim',
        'biyografi': 'Biyografi',
        'siir': 'Şiir',
        'diger': 'Diğer'
    };

    const statusIcons = {
        'Okunacak': 'bi-clock',
        'Okunuyor': 'bi-eye',
        'Okundu': 'bi-check-circle'
    };

    grid.innerHTML = books.map(book => {
        const color = getCategoryClass(book.category);
        const icon = statusIcons[book.status] || 'bi-clock';
        const catName = catNames[book.category] || book.category || 'Kategorisiz';
        
        const safe = {
            title: escapeHTML(book.title),
            author: escapeHTML(book.author),
            isbn: escapeHTML(book.isbn),
            status: escapeHTML(book.status),
            category: escapeHTML(catName),
            notes: escapeHTML(book.notes)
        };

        let meta = `
            <span class="book-meta-item"><i class="bi bi-tag"></i> ${safe.category}</span>
            <span class="book-meta-item"><i class="bi bi-file-text"></i> ${book.pageCount || 0} sayfa</span>
        `;
        if (book.isbn) {
            meta += `<span class="book-meta-item isbn"><i class="bi bi-upc"></i> ${safe.isbn}</span>`;
        }

        const stars = book.rating > 0 ? '⭐'.repeat(Math.min(book.rating, 5)) : '';
        const statusClass = book.status === 'Okunuyor' ? 'status-okunuyor' : 
                           book.status === 'Okundu' ? 'status-okundu' : 'status-okunacak';

        return `
        <div class="book-card">
            <div class="book-card-header">
                <div class="book-cover-icon ${color}"><i class="bi bi-book"></i></div>
                <span class="book-status-badge ${statusClass}">
                    <i class="bi ${icon}"></i> ${safe.status}
                </span>
            </div>
            <div class="book-card-body">
                <h3 class="book-title">${safe.title}</h3>
                <p class="book-author">✍️ ${safe.author}</p>
                <div class="book-meta">${meta}</div>
                ${stars ? `<div class="book-rating">${stars}</div>` : ''}
                ${book.notes ? `<div class="book-notes">💬 ${safe.notes}</div>` : ''}
            </div>
            <div class="book-card-footer">
                <button class="btn-action btn-edit-book" onclick="editBook('${book.id}')">
                    <i class="bi bi-pencil"></i> Düzenle
                </button>
                <button class="btn-action btn-delete-book" onclick="deleteBook('${book.id}')">
                    <i class="bi bi-trash"></i> Sil
                </button>
            </div>
        </div>`;
    }).join('');

    updateStats(books);
}

// İstatistikleri güncelle
function updateStats(books) {
    const total = books.length;
    const reading = books.filter(b => b.status === 'Okunuyor').length;
    const read = books.filter(b => b.status === 'Okundu').length;
    const unread = books.filter(b => b.status === 'Okunacak').length;
    
    const rated = books.filter(b => b.rating > 0);
    const avg = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : 0;

    document.getElementById('totalBooks').textContent = total;
    document.getElementById('readingBooks').textContent = reading;
    document.getElementById('readBooks').textContent = read;
    document.getElementById('unreadBooks').textContent = unread;
    document.getElementById('averageRating').textContent = avg;
}

// ISBN formatla (xxx-xxx-xxx-xxx)
function formatISBN(value) {
    let digits = value.replace(/\D/g, '').slice(0, 13);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
        if (i === 3 || i === 6 || i === 9) formatted += '-';
        formatted += digits[i];
    }
    return formatted;
}

// Sayfa yüklendiğinde çalışacaklar
document.addEventListener('DOMContentLoaded', function() {
    filterBooks();

    const saveBtn = document.getElementById('saveBookBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveBook);
    }

    const form = document.getElementById('bookForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveBook();
        });
    }

    const isbnInput = document.getElementById('bookIsbn');
    if (isbnInput) {
        isbnInput.addEventListener('input', function() {
            this.value = formatISBN(this.value);
        });
        isbnInput.addEventListener('paste', function() {
            setTimeout(() => {
                this.value = formatISBN(this.value);
            }, 50);
        });
    }

    const pagesInput = document.getElementById('bookPages');
    if (pagesInput) {
        pagesInput.addEventListener('blur', function() {
            if (parseInt(this.value) < 0) this.value = 0;
        });
    }

    const statusSelect = document.getElementById('bookStatus');
    if (statusSelect) {
        statusSelect.addEventListener('change', toggleRatingAndNotes);
    }

    const addBookModal = document.getElementById('addBookModal');
    if (addBookModal) {
        addBookModal.addEventListener('shown.bs.modal', toggleRatingAndNotes);
    }
});

// Başka sekmede değişiklik olursa sayfayı yenile
window.addEventListener('storage', function(e) {
    if (e.key === 'books') {
        filterBooks();
    }
});

// Klavye kısayolları
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        addBooksModalOpen();
    }
    
    if (e.key === 'Escape') {
        const modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
        if (modal) modal.hide();
    }
});