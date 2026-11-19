const printButton=document.getElementById('catalog-print');
if(printButton){printButton.addEventListener('click',()=>window.print());printButton.hidden=false;}
// Only the screen stylesheet collapses this list. Print and no-JS keep all links.
const contents=document.querySelector('.catalog-cover ol');
if(contents){
  contents.id='catalog-contents';
  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.className='catalog-contents-toggle';
  toggle.setAttribute('aria-controls',contents.id);
  toggle.setAttribute('aria-expanded',String(location.hash.startsWith('#catalog-')));
  toggle.textContent='Выбрать работу · '+contents.querySelectorAll('a').length+' проектов';
  toggle.addEventListener('click',()=>{
    toggle.setAttribute('aria-expanded',String(toggle.getAttribute('aria-expanded')!=='true'));
  });
  contents.before(toggle);
}
