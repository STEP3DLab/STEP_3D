import {parseStoryRoute,firstStoryRoute,storyRoute} from './category-stories-data.js?v=20261026-directions';
const marker='trifotiStories';
export function createStoryNavigation({location,history,onOpen,onClose}){
 let active=null,activeHash='';
 const clean=()=>{const state=history.state&&typeof history.state==='object'?{...history.state}:{};delete state[marker];delete state.trifotiCase;return state};
 function sync(){const route=parseStoryRoute(location.hash);if(activeHash===location.hash&&!!active===!!route)return;activeHash=location.hash;active=route;if(route)onOpen(route);else onClose()}
 function open(category){const hash=firstStoryRoute(category);if(!hash)return false;if(location.hash!==hash){const method=active&&parseStoryRoute(location.hash)?'replaceState':'pushState';history[method]({...clean(),[marker]:true},'',hash);}sync();return true}
 function frame(category,key,id){const hash=storyRoute(category,key,id);if(!active||!hash)return false;history.replaceState(history.state,'',hash);sync();return true}
 function closed(){const was=active;active=null;activeHash='';if(!was||!parseStoryRoute(location.hash))return 'route';if(history.state?.[marker]){history.back();return 'back'}history.replaceState(clean(),'','#projects');return 'fallback'}
 function fullCase(){if(!active?.key)return null;const route={...active},owned=history.state?.[marker];history.replaceState({...clean(),...(owned?{trifotiCase:route.key}:{})},'',`#project/${route.key}/media/${route.id}`);sync();return route}
 function visit(hash){history.replaceState(clean(),'',hash);sync()}
 return {sync,open,frame,closed,fullCase,visit};
}
