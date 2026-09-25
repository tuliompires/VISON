import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createStaticServer } from '../server.mjs';

test('HTTP serves modules with MIME and confines public root', async () => {
  const server=createStaticServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const request=(path,method='GET')=>new Promise((resolve,reject)=>{
    http.request({host:'127.0.0.1',port:server.address().port,path,method},res=>{
      let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));
    }).on('error',reject).end();
  });
  try {
    assert.equal(server.address().address,'127.0.0.1');
    for (const [path,mime] of [['/','text/html'],['/css/style.css','text/css'],['/js/app.js','text/javascript'],['/js/models/schema-model.js?v=1','text/javascript']]) {
      const response=await request(path);assert.equal(response.status,200,path);assert.ok(response.headers['content-type'].startsWith(mime));assert.ok(response.body.length>0);assertSecurityHeaders(response.headers);
    }
    assert.equal((await request('/js/app.js','HEAD')).body,'');
    for (const path of ['/missing','/package.json','/server.mjs','/tests/run-tests.mjs','/js/','/../package.json','/%2e%2e/package.json','/js/%2e%2e/server.mjs','/js/%5c..%5cserver.mjs','/js/app.js%00','/js/app.js:secret']) assert.equal((await request(path)).status,404,path);
    assert.equal((await request('/%zz')).status,400);
    const methodResponse=await request('/','POST');assert.equal(methodResponse.status,405);assertSecurityHeaders(methodResponse.headers);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});

function assertSecurityHeaders(headers) {
  assert.equal(headers['x-content-type-options'],'nosniff');
  assert.equal(headers['content-security-policy'],"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
  assert.equal(headers['x-frame-options'],'DENY');
  assert.equal(headers['referrer-policy'],'no-referrer');
  assert.equal(headers['permissions-policy'],'geolocation=(), camera=(), microphone=()');
  assert.equal(headers['cross-origin-resource-policy'],'same-origin');
}
