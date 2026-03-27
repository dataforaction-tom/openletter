// Global utilities

function showToast(message, type) {
  if (type === undefined) type = 'info';
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = '0';
    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 3000);
}

// Auto-dismiss flash messages
document.addEventListener('DOMContentLoaded', function () {
  var flashes = document.querySelectorAll('.flash');
  flashes.forEach(function (flash) {
    setTimeout(function () {
      flash.style.opacity = '0';
      setTimeout(function () {
        flash.remove();
      }, 300);
    }, 5000);
  });
});
