function getContainer() {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    c.style.zIndex = 9999;
    document.body.appendChild(c);
  }
  return c;
}

function toast(message, type = 'secondary') {
  const container = getContainer();

  const el = document.createElement('div');
  el.id = 'toast-' + Date.now();
  el.className = 'toast border-0 shadow';
  el.style.setProperty('border-top', `3px solid var(--bs-${type})`, 'important');
  el.style.minWidth = '280px';
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'assertive');
  el.setAttribute('aria-atomic', 'true');

  const body = document.createElement('div');
  body.className = 'toast-body d-flex align-items-center gap-2';

  const text = document.createElement('span');
  text.className = 'flex-grow-1 text-body';
  text.textContent = message;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-close ms-2 flex-shrink-0';
  btn.setAttribute('data-bs-dismiss', 'toast');
  btn.setAttribute('aria-label', 'Close');

  body.appendChild(text);
  body.appendChild(btn);
  el.appendChild(body);
  container.appendChild(el);

  bootstrap.Toast.getOrCreateInstance(el, { delay: 4000 }).show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}