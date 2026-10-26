const fallback='Можно начать с пары предложений: что хотите создать, для кого и где это будет использоваться. Остальное уточните позже.';
const hints=Object.freeze({
 'Дизайн интерьеров':'Если уже знаете, укажите тип помещения, примерные размеры и что хотите изменить в интерьере.',
 'Скульптура':'Если уже знаете, опишите образ, примерный размер и место установки: в помещении или на улице.',
 'Макетирование':'Если уже знаете, укажите, что нужно показать в макете, желаемый масштаб и степень детализации.',
 'Сувениры и призы':'Если уже знаете, укажите повод, кому предназначены изделия, примерный тираж и пожелания к символике.'
});
export function briefGuidance(direction){return Object.hasOwn(hints,direction)?hints[direction]:fallback}
export function updateBriefGuidance({direction,helper}){
 const text=briefGuidance(direction);
 if(helper.textContent!==text)helper.textContent=text;
}
