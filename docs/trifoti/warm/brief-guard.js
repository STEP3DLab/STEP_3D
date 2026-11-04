// Independent of optional ES modules: never fall back to URL/form submission.
const guardedBrief=document.getElementById('brief-form');
if(guardedBrief)guardedBrief.addEventListener('submit',event=>event.preventDefault());
