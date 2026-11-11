// Enhance the local brief only after its normal validation and save actions are ready.
if (new URLSearchParams(location.search).has('case')) {
  import('./case-enquiry.js?v=20261111-brief-links').then(({addCaseReference}) => {
    addCaseReference({form, selectReference, status: document.getElementById('brief-status')});
  }).catch(() => {
    document.getElementById('brief-status').textContent = 'Не удалось добавить проект. Обновите страницу, чтобы повторить.';
  });
}
