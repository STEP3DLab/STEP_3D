if (new URLSearchParams(location.search).has('portfolio')) {
  import('./portfolio-brief.js?v=20261111-sales').then(({addPortfolioReference}) =>
    addPortfolioReference({form, selectReference, status:document.getElementById('brief-status')})
  ).catch(() => { document.getElementById('brief-status').textContent = 'Пример не удалось открыть. Обновите страницу, чтобы повторить.'; });
}
