import {parseCaseRoute,exactLink,mediaIndex} from './exploration-data.js';
const prefix = '#project/';
const marker = 'trifotiCase';

export function projectKey(hash, keys) {
  const key = parseCaseRoute(hash)?.key || '';
  return keys.includes(key) ? key : null;
}
export function projectLink(href, key, media) {
  return exactLink(key, media);
}
export async function copyProjectLink(url, clipboard) {
  try {
    if (typeof clipboard?.writeText !== 'function') return false;
    await clipboard.writeText(url);
    return true;
  } catch { return false; }
}

// One history entry per opened case. No storage, network or global event hooks.
export function createProjectNavigation({keys, location, history, onOpen, onClose}) {
  let active = null, activeRoute = '';
  const cleanState = () => {
    const state = history.state && typeof history.state === 'object' ? {...history.state} : {};
    delete state[marker];
    return state;
  };
  function sync() {
    const key = projectKey(location.hash, keys);
    if (key === active && location.hash === activeRoute) return;
    activeRoute = location.hash;
    active = key;
    if (key) onOpen(key,parseCaseRoute(location.hash)?.media);
    else onClose();
  }
  function open(key,media) {
    if (!keys.includes(key)) return false;
    const route = prefix + key + (media && mediaIndex(key,media)>=0 ? '/media/'+media : '');
    if (location.hash !== route) {
      history.pushState({...cleanState(), [marker]:key}, '', route);
    }
    sync();
    return true;
  }
  // Keep the original return destination while browsing adjacent cases.
  function switchCase(key) {
    if (!keys.includes(key) || !active) return false;
    const owned = history.state?.[marker] === active;
    history.replaceState(owned ? {...cleanState(), [marker]:key} : cleanState(), '', prefix + key);
    sync();
    return true;
  }
  function closed() {
    // A Back/Forward/hash navigation already reconciled the dialog.
    const key = active;
    active = null;
    if (!key || projectKey(location.hash, keys) !== key) return 'route';
    if (history.state?.[marker] === key) {
      history.back();
      return 'back';
    }
    // A newly opened shared link must not take the visitor off the website.
    history.replaceState(cleanState(), '', '#projects');
    return 'fallback';
  }
  function visit(hash) {
    if (location.hash !== hash) history.pushState(cleanState(), '', hash);
    sync();
  }
  function frame(key,media) {
    if(active!==key || mediaIndex(key,media)<0)return false;
    const route=prefix+key+'/media/'+media;
    if(location.hash!==route)history.replaceState(history.state,'',route);
    activeRoute=route;return true;
  }
  return {open, switchCase, closed, sync, visit, frame};
}
