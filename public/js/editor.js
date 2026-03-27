// Editor page JavaScript
(function () {
  var editorTextarea = document.getElementById('editor');
  var previewDiv = document.getElementById('preview');
  var form = editorTextarea ? editorTextarea.closest('form') : null;
  var letterId = form ? form.getAttribute('data-letter-id') : null;

  if (!editorTextarea || !previewDiv) return;

  // --- Markdown preview ---
  var previewTimer = null;

  function updatePreview() {
    if (typeof marked !== 'undefined' && marked.parse) {
      previewDiv.innerHTML = marked.parse(editorTextarea.value);
    }
  }

  editorTextarea.addEventListener('input', function () {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 300);
  });

  // Initial render
  updatePreview();

  // --- Autosave ---
  var autosaveTimer = null;

  function autosave() {
    if (!letterId) return;

    var titleInput = document.getElementById('title');
    var authorsInput = document.getElementById('authors_json');

    var payload = {
      title: titleInput ? titleInput.value : '',
      content_md: editorTextarea.value,
      authors_json: authorsInput ? authorsInput.value : '[]',
    };

    fetch('/api/letters/' + letterId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (res.ok) {
          showToast('Saved', 'success');
        }
      })
      .catch(function () {
        // Silently fail autosave
      });
  }

  function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(autosave, 2000);
  }

  editorTextarea.addEventListener('input', scheduleAutosave);
  var titleInput = document.getElementById('title');
  if (titleInput) {
    titleInput.addEventListener('input', scheduleAutosave);
  }

  // --- Authors UI ---
  var authors = [];
  var authorsJsonInput = document.getElementById('authors_json');
  var authorsList = document.getElementById('authors-list');
  var addAuthorBtn = document.getElementById('add-author');
  var authorNameInput = document.getElementById('author-name');
  var authorOrgInput = document.getElementById('author-org');

  // Initialize from existing data
  if (authorsJsonInput && authorsJsonInput.value) {
    try {
      authors = JSON.parse(authorsJsonInput.value);
    } catch (e) {
      authors = [];
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderAuthors() {
    if (!authorsList) return;

    if (authors.length === 0) {
      authorsList.innerHTML = '<p class="text-muted">No authors added yet.</p>';
    } else {
      authorsList.innerHTML = authors
        .map(function (a, i) {
          var orgPart = a.org
            ? ' <span class="author-org">(' + escapeHtml(a.org) + ')</span>'
            : '';
          return (
            '<div class="author-item">' +
            '<span class="author-name">' +
            escapeHtml(a.name) +
            orgPart +
            '</span>' +
            '<button type="button" class="btn btn-sm btn-danger remove-author" data-index="' +
            i +
            '">Remove</button>' +
            '</div>'
          );
        })
        .join('');
    }

    if (authorsJsonInput) {
      authorsJsonInput.value = JSON.stringify(authors);
    }
  }

  if (addAuthorBtn) {
    addAuthorBtn.addEventListener('click', function () {
      var name = authorNameInput ? authorNameInput.value.trim() : '';
      if (!name) return;

      var org = authorOrgInput ? authorOrgInput.value.trim() : '';
      var author = { name: name };
      if (org) author.org = org;

      authors.push(author);
      renderAuthors();
      scheduleAutosave();

      if (authorNameInput) authorNameInput.value = '';
      if (authorOrgInput) authorOrgInput.value = '';
    });
  }

  if (authorsList) {
    authorsList.addEventListener('click', function (e) {
      var btn = e.target.closest('.remove-author');
      if (!btn) return;

      var index = parseInt(btn.getAttribute('data-index'), 10);
      authors.splice(index, 1);
      renderAuthors();
      scheduleAutosave();
    });
  }
})();
