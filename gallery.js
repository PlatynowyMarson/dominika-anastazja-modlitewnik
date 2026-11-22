const dialog = document.querySelector('dialog');
const preview = dialog.querySelector('img');
const caption = dialog.querySelector('figcaption');
const close = dialog.querySelector('.close');

if (typeof dialog.showModal === 'function') {
  document.querySelectorAll('.tiles a').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      preview.src = link.href;
      preview.alt = link.querySelector('img').alt;
      caption.textContent = link.querySelector('figcaption').textContent;
      dialog.showModal();
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}
