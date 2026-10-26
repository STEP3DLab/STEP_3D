// One attempt per mount, including rejected imports and synchronous initializer errors.
export function optionalModule({load,mount,onError}){
 let pending;
 return ()=>pending??=(Promise.resolve().then(load).then(mount).catch(error=>{onError(error);return null}));
}
export function optionalFallback({host,document,message}){
 host.replaceChildren();const note=document.createElement('p');note.className='form-note';note.setAttribute('role','status');note.textContent=message;const link=document.createElement('a');link.href='catalog.html';link.textContent='Открыть статический каталог всех кейсов';host.append(note,link);
}
