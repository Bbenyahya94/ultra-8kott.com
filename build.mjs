import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('src','dist',{recursive:true});
const routes={subscription:'subscriptions.html',reseller:'resellers.html',setup:'setup.html',faq:'faq.html'};
for(const [route,file] of Object.entries(routes)){await mkdir(`dist/${route}`,{recursive:true});await cp(`src/pages/${file}`,`dist/${route}/index.html`)}
console.log('Built clean Ultra 8K OTT routes in dist/.');
