// Concept images are not completed projects or interactive 3D models.
export const concepts = Object.freeze({
 atlas: {title:'Атлас с ажурным глобусом',caption:'Концепт подставки под колонку · не изготовленное изделие',direction:'Промышленный дизайн'},
 wolves: {title:'Медаль «Волки»',caption:'Концепт хоккейной медали · не изготовленное изделие',direction:'Корпоративные заказы'}
});
export const conceptURL = key => 'https://step3dlab.github.io/STEP_3D/trifoti/warm/concepts/' + key + '.html';
export const conceptBlock = key => [concepts[key].title,concepts[key].caption,conceptURL(key)].join('\n');
export function appendConcept(current,key) {
 if(!Object.hasOwn(concepts,key))return {value:current,added:false,invalid:true};
 if(current.includes(conceptURL(key)))return {value:current,added:false};
 const value=[current,conceptBlock(key)].filter(Boolean).join('\n\n');
 return value.length>6000?{value:current,added:false,tooLong:true}:{value,added:true};
}
