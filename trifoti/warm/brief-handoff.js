const channels = {
  chat: {base: 'https://t.me/step_3d_mngr', limit: 6500},
  mail: {base: 'mailto:info@step3d.tech?subject=' + encodeURIComponent('ТРИФОТИ — обсуждение проекта'), limit: 1900}
};

// Some mail clients accept only short URLs. Keep a large brief intact for copying or attachment.
export function handoffLink(channel, text) {
  const {base, limit} = channels[channel];
  const url = new URL(base);
  url.searchParams.set(channel === 'chat' ? 'text' : 'body', text);
  const href = url.href.replaceAll('+', '%20');
  return href.length <= limit ? {href, full: true} : {href: base, full: false};
}

export function mountBriefHandoff({form, validate, formatBrief, document, window}) {
  const panel = document.getElementById('enquiry-handoff');
  const notice = document.getElementById('handoff-notice');
  const plain = document.getElementById('handoff-plain');

  function resetHandoff() {
    notice.textContent = '';
    plain.hidden = true;
  }

  function openDraft(channel) {
    resetHandoff();
    if (!validate()) return;
    const text = formatBrief(Object.fromEntries(new FormData(form)));
    const link = handoffLink(channel, text);
    if (!link.full) {
      notice.textContent = 'Бриф слишком длинный для ссылки. Скопируйте полный текст кнопкой ниже или скачайте файл и приложите его к сообщению.';
      plain.textContent = channel === 'chat' ? 'Открыть чат для вставки текста' : 'Открыть письмо для вставки текста';
      plain.href = link.href;
      plain.hidden = false;
      return;
    }
    notice.textContent = channel === 'chat'
      ? 'Если черновик не появился в Telegram, скопируйте текст ниже и вставьте его в чат @step_3d_mngr.'
      : 'Если почтовая программа не открылась, скопируйте бриф и напишите на info@step3d.tech.';
    if (channel === 'chat') window.open(link.href, '_blank', 'noopener,noreferrer');
    else window.location.assign(link.href);
  }

  document.getElementById('brief-to-chat').addEventListener('click', () => openDraft('chat'));
  document.getElementById('brief-to-mail').addEventListener('click', () => openDraft('mail'));
  form.addEventListener('input', resetHandoff);
  form.addEventListener('change', resetHandoff);
  document.getElementById('brief-reset-yes').addEventListener('click', resetHandoff);
  panel.hidden = false;
}
