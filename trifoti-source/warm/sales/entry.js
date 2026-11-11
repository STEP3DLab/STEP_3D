// Enhance the local brief only after its normal validation and save actions are ready.
import('./brief-handoff.js?v=20261111-sales').then(({mountBriefHandoff}) => {
  mountBriefHandoff({form, document, window, formatBrief, validate: () => briefTools.validate()});
}).catch(() => { /* The static manager contacts and local export remain accessible. */ });

if (new URLSearchParams(location.search).has('case')) {
  import('./case-enquiry.js?v=20261111-sales').then(({addCaseReference}) => {
    addCaseReference({form, selectReference, status: document.getElementById('brief-status')});
  }).catch(() => {
    document.getElementById('brief-status').textContent = 'Не удалось добавить проект. Обновите страницу, чтобы повторить.';
  });
}
