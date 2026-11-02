for (const section of document.querySelectorAll('[data-plan]')) {
  const offers = JSON.parse(section.dataset.offers);
  section.addEventListener('change', event => {
    if (!(event.target instanceof HTMLInputElement) || event.target.name !== 'screen-count') return;
    const count = event.target.value;
    const name = count === '1' ? section.dataset.singular : section.dataset.plural;
    const selection = section.querySelector('[data-selection]');
    if (selection) selection.textContent = section.dataset.selectionLabel + ': ' + count + ' ' + name;
    section.querySelectorAll('[data-stream-note]').forEach(note => { note.textContent = count + ' ' + name; });
    section.querySelectorAll('[data-term]').forEach(link => {
      const href = offers[link.dataset.term]?.[count];
      if (href) {
        link.href = href;
        link.setAttribute('aria-label', link.dataset.labelPrefix + ', ' + count + ' ' + name);
      }
    });
  });
}

for (const form of document.querySelectorAll('[data-calc]')) {
  form.querySelector('button').disabled = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const total = Number(values.get('price')) + Number(values.get('extra'));
    const months = Number(values.get('months'));
    const screens = Number(values.get('screens'));
    if (!Number.isFinite(total) || total <= 0 || months < 1 || screens < 1) return;
    const format = new Intl.NumberFormat(form.dataset.locale, { style: 'currency', currency: 'CHF' });
    const month = total / months;
    form.querySelector('output').textContent = format.format(month) + ' ' + form.dataset.monthLabel + ' · ' + format.format(month / screens) + ' ' + form.dataset.streamLabel;
  });
}

const dialog = document.querySelector('#trial-dialog');
if (dialog && typeof dialog.showModal === 'function') {
  const iframe = dialog.querySelector('[data-frame]');
  const status = dialog.querySelector('[data-widget-status]');
  const direct = dialog.querySelector('[data-direct]');
  const serviceOrigin = new URL(dialog.dataset.widget).origin;
  let trigger;
  document.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const clicked = event.target.closest?.('[data-open-trial]');
    if (!clicked || dialog.open) return;
    event.preventDefault();
    trigger = clicked;
    const service = new URL(dialog.dataset.widget);
    service.hash = new URLSearchParams({ page: location.origin + location.pathname }).toString();
    direct.href = service.href;
    status.hidden = false;
    iframe.src = service.href;
    dialog.showModal();
    document.body.classList.add('dialog-open');
    dialog.querySelector('[data-close]').focus();
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    iframe.removeAttribute('src');
    document.body.classList.remove('dialog-open');
    trigger?.focus();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  window.addEventListener('message', event => {
    if (!dialog.open || event.origin !== serviceOrigin || event.source !== iframe.contentWindow) return;
    if (event.data?.type === 'emerald-trial-ready') status.hidden = true;
    if (event.data?.type === 'emerald-trial-close') dialog.close();
  });
}
