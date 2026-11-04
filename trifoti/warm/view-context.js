import {projects} from './project-data.js?v=20261026-directions';
import {caseKeys,mediaId,mediaIndex,parseCaseRoute} from './exploration-data.js?v=20261026-directions';
export function viewContext(key,id){if(!caseKeys.includes(key))return null;return {key,id:mediaIndex(key,id)>=0?id:mediaId(projects[key].media[0])}}
export function modeLinks(key,id){const context=viewContext(key,id);if(!context)return {modal:'index.html#projects',light:'light.html',static:'catalog.html'};return {modal:`index.html#project/${context.key}/media/${context.id}`,light:`light.html#project/${context.key}/media/${context.id}`,static:`cases/${context.key}.html#media-${context.id}`}}
export function lightContext(hash){const parsed=parseCaseRoute(hash);if(parsed)return viewContext(parsed.key,parsed.media);return typeof hash==='string'?viewContext(hash.slice(1)):null}
export function staticContext(key,hash){return viewContext(key,typeof hash==='string'&&hash.startsWith('#media-')?hash.slice(7):null)}
