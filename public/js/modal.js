// Modal and dialog interactions
(function () {
  // Open/close modal helpers
  window.openModal = function (id) {
    var dialog = document.getElementById(id);
    if (dialog && dialog.showModal) {
      dialog.showModal();
    }
  };

  window.closeModal = function (id) {
    var dialog = document.getElementById(id);
    if (dialog && dialog.close) {
      dialog.close();
    }
  };

  // Click backdrop to close
  document.addEventListener('click', function (e) {
    if (e.target.tagName === 'DIALOG') {
      var rect = e.target.getBoundingClientRect();
      var clickedInDialog =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      // If click is on the dialog element itself but outside its visible content area
      if (!clickedInDialog) {
        e.target.close();
      }
    }
  });

  // Delete confirmation
  document.addEventListener('DOMContentLoaded', function () {
    var deleteForms = document.querySelectorAll('.delete-form');
    deleteForms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var confirmed = confirm(
          'Are you sure you want to delete this? This action cannot be undone.'
        );
        if (confirmed) {
          form.submit();
        }
      });
    });
  });
})();
