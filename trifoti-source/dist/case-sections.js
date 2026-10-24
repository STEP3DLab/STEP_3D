// Optional verified editorial facts. Legacy cases create no extra markup.
export function mountCaseSections({project,host,document}){
 if(!project.sections?.length)return;
 const group=document.createElement('div');group.className='case-sections';
 for(const {title,text} of project.sections){
  const section=document.createElement('div');section.className='case-section';
  const heading=document.createElement('h3');heading.textContent=title;
  const paragraph=document.createElement('p');paragraph.textContent=text;
  section.append(heading,paragraph);group.append(section);
 }
 host.prepend(group);
}
