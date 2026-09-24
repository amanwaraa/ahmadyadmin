/* الأحمدي — local-first sync engine v13.9 */
(() => {
  'use strict';

  const cfg = window.AHMADI_TURSO_CONFIG || {};
  const dbUrl = String(cfg.databaseURL || '').trim();
  const token = String(cfg.authToken || '').trim();
  const tables = {
    companies: String(cfg.tables?.companies || 'ahmadi_companies').replace(/[^a-zA-Z0-9_]/g,''),
    state: String(cfg.tables?.state || 'ahmadi_state').replace(/[^a-zA-Z0-9_]/g,''),
    admins: String(cfg.tables?.admins || 'ahmadi_admins').replace(/[^a-zA-Z0-9_]/g,''),
    employees: String(cfg.tables?.employees || 'ahmadi_employees').replace(/[^a-zA-Z0-9_]/g,''),
    subscriptionUsers: String(cfg.tables?.subscriptionUsers || 'ahmadi_subscription_users').replace(/[^a-zA-Z0-9_]/g,'')
  };
  const syncCfg = {
    visiblePollMs: Math.max(2500, Number(cfg.sync?.visiblePollMs || 4000)),
    hiddenPollMs: Math.max(15000, Number(cfg.sync?.hiddenPollMs || 45000)),
    writeDebounceMs: Math.max(120, Number(cfg.sync?.writeDebounceMs || 450)),
    requestTimeoutMs: Math.max(5000, Number(cfg.sync?.requestTimeoutMs || 18000))
  };
  const pipelineUrl = dbUrl.replace(/^libsql:\/\//i,'https://').replace(/\/+$/,'') + '/v2/pipeline';
  const LICENSE_PREFIX = 'AHMADI_CLOUD_LICENSE_V1::';
  const AUTH_PREFIX = 'AHMADI_AUTH_CACHE_V2::';
  const EMPLOYEE_CACHE_PREFIX = 'AHMADI_EMPLOYEE_CACHE_V1::';
  const EMPLOYEE_QUEUE_PREFIX = 'AHMADI_EMPLOYEE_QUEUE_V1::';
  const QUEUE_PREFIX = 'AHMADI_SYNC_QUEUE_V1::';
  const META_PREFIX = 'AHMADI_SYNC_META_V1::';
  const DEFAULT_DATASETS = ['settings','subscribers','subscriptions','accounts','movements','logs','tasks','chats','backups'];

  let schemaPromise = null;
  let adapter = null;
  let activeCompanyId = '';
  let activeCompany = null;
  let pushTimer = 0;
  let pollTimer = 0;
  let inFlight = false;
  let status = {mode:'idle', pending:0, lastSyncAt:'', message:''};
  const listeners = new Set();

  function clone(v){ if(v==null||typeof v!=='object')return v; try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v));} }
  function safeJson(v,fallback=null){ try{return JSON.parse(v)}catch(_){return fallback} }
  function nowMs(){return Date.now();}
  function uid(prefix='id'){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;}
  function isOnline(){return navigator.onLine !== false;}
  function serverNowSql(){return "CAST(unixepoch('subsec') * 1000 AS INTEGER)";}

  // Small pure-JS SHA-256 implementation so hashing behaves the same on file://, WebView and HTTPS.
  function sha256(text) {
    let ascii = unescape(encodeURIComponent(String(text ?? '')));
    const maxWord = Math.pow(2, 32), lengthProperty = 'length';
    let i, j, result = '', words = [], asciiBitLength = ascii[lengthProperty] * 8;
    let hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [], primeCounter = k[lengthProperty];
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (Math.pow(candidate, 1/3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return '';
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength);
    for (j = 0; j < words[lengthProperty];) {
      const w = words.slice(j, j += 16), oldHash = hash.slice(0);
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        const temp1 = hash[7]
          + ((e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7))
          + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i]
          + (w[i] = (i < 16) ? w[i] : (w[i - 16]
            + ((w15 >>> 7 | w15 << 25) ^ (w15 >>> 18 | w15 << 14) ^ (w15 >>> 3))
            + w[i - 7]
            + ((w2 >>> 17 | w2 << 15) ^ (w2 >>> 19 | w2 << 13) ^ (w2 >>> 10))) | 0);
        const temp2 = ((a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
    return result;
  }

  function typedArg(value){
    if(value===null||value===undefined)return {type:'null'};
    if(typeof value==='number'&&Number.isInteger(value))return {type:'integer',value:String(value)};
    if(typeof value==='number')return {type:'float',value:String(value)};
    return {type:'text',value:String(value)};
  }
  function cellValue(cell){
    if(!cell||cell.type==='null')return null;
    if(cell.type==='integer'||cell.type==='float'){const n=Number(cell.value);return Number.isFinite(n)?n:cell.value;}
    return cell.value;
  }
  function rowsToObjects(result){
    const names=(result.cols||[]).map(c=>c.name);
    return (result.rows||[]).map(row=>{const o={};row.forEach((cell,i)=>o[names[i]]=cellValue(cell));return o;});
  }

  async function pipeline(statements, timeout=syncCfg.requestTimeoutMs){
    if(!dbUrl||!token) throw new Error('إعدادات المزامنة غير مكتملة.');
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), timeout);
    try{
      const response = await fetch(pipelineUrl,{
        method:'POST',
        headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json'},
        body:JSON.stringify({requests:[...statements.map(s=>({type:'execute',stmt:{sql:s.sql,args:(s.args||[]).map(typedArg)}})),{type:'close'}]}),
        signal:controller.signal,
        cache:'no-store'
      });
      const text = await response.text();
      if(!response.ok) throw new Error(`تعذر الوصول إلى خدمة البيانات (${response.status}).`);
      const data = safeJson(text, null);
      if(!data) throw new Error('استجابة خدمة البيانات غير صالحة.');
      return statements.map((_,index)=>{
        const item=data.results?.[index];
        if(!item||item.type!=='ok') throw new Error('تعذر تنفيذ عملية المزامنة.');
        return item.response?.result||{cols:[],rows:[],affected_row_count:0};
      });
    }catch(error){
      if(error?.name==='AbortError') throw new Error('انتهت مهلة الاتصال بالخادم.');
      throw error;
    }finally{clearTimeout(timer);}
  }

  async function ensureSchema(){
    if(schemaPromise)return schemaPromise;
    schemaPromise=(async()=>{
      const n=nowMs();
      await pipeline([
        {sql:`CREATE TABLE IF NOT EXISTS ${tables.companies} (id TEXT PRIMARY KEY, company_key TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, company_name TEXT NOT NULL DEFAULT '', owner_name TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'active', expires_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`},
        {sql:`CREATE INDEX IF NOT EXISTS idx_${tables.companies}_key ON ${tables.companies}(company_key)`},
        {sql:`CREATE TABLE IF NOT EXISTS ${tables.state} (company_id TEXT NOT NULL, dataset TEXT NOT NULL, payload TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(company_id,dataset))`},
        {sql:`CREATE INDEX IF NOT EXISTS idx_${tables.state}_changes ON ${tables.state}(company_id,updated_at)`},
        {sql:`CREATE TABLE IF NOT EXISTS ${tables.admins} (id TEXT PRIMARY KEY, admin_key TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`},
        {sql:`CREATE TABLE IF NOT EXISTS ${tables.employees} (id TEXT PRIMARY KEY, company_id TEXT NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', permissions TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`},
        {sql:`CREATE INDEX IF NOT EXISTS idx_${tables.employees}_company ON ${tables.employees}(company_id)`},
        {sql:`CREATE UNIQUE INDEX IF NOT EXISTS idx_${tables.employees}_auth ON ${tables.employees}(company_id,password_hash)`},
        {sql:`CREATE TRIGGER IF NOT EXISTS trg_${tables.employees}_owner_password_insert BEFORE INSERT ON ${tables.employees} WHEN EXISTS(SELECT 1 FROM ${tables.companies} c WHERE c.id=NEW.company_id AND c.password_hash=NEW.password_hash) BEGIN SELECT RAISE(ABORT,'employee_password_conflict'); END`},
        {sql:`CREATE TRIGGER IF NOT EXISTS trg_${tables.employees}_owner_password_update BEFORE UPDATE OF password_hash ON ${tables.employees} WHEN EXISTS(SELECT 1 FROM ${tables.companies} c WHERE c.id=NEW.company_id AND c.password_hash=NEW.password_hash) BEGIN SELECT RAISE(ABORT,'employee_password_conflict'); END`},
        {sql:`CREATE TABLE IF NOT EXISTS ${tables.subscriptionUsers} (id TEXT PRIMARY KEY, company_id TEXT NOT NULL, subscription_id TEXT NOT NULL, subscriber_id TEXT NOT NULL DEFAULT '', username TEXT NOT NULL COLLATE NOCASE, password_hash TEXT NOT NULL, network_name TEXT NOT NULL DEFAULT '', manager_name TEXT NOT NULL DEFAULT '', subscription_type TEXT NOT NULL DEFAULT '', end_date TEXT, frozen INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)`},
        {sql:`CREATE INDEX IF NOT EXISTS idx_${tables.subscriptionUsers}_auth ON ${tables.subscriptionUsers}(username COLLATE NOCASE,password_hash)`},
        {sql:`CREATE INDEX IF NOT EXISTS idx_${tables.subscriptionUsers}_company ON ${tables.subscriptionUsers}(company_id,updated_at)`}
      ]);
      // No development company is seeded. Company keys are created only from the admin console.
      // Remove only the untouched legacy demo key. If it already owns synced data or employees, keep it to avoid data loss.
      await pipeline([{sql:`DELETE FROM ${tables.companies} WHERE company_key='12345' AND owner_name='م. احمد معمر' AND NOT EXISTS (SELECT 1 FROM ${tables.state} s WHERE s.company_id=${tables.companies}.id) AND NOT EXISTS (SELECT 1 FROM ${tables.employees} e WHERE e.company_id=${tables.companies}.id)`}]);
      return true;
    })().catch(err=>{schemaPromise=null;throw err;});
    return schemaPromise;
  }

  function licenseKey(companyKey){return LICENSE_PREFIX+String(companyKey||'').trim().toUpperCase();}
  function authKey(companyKey,hash){return AUTH_PREFIX+String(companyKey||'').trim().toUpperCase()+'::'+String(hash||'');}
  function employeeCacheKey(companyId){return EMPLOYEE_CACHE_PREFIX+String(companyId||'');}
  function employeeQueueKey(companyId){return EMPLOYEE_QUEUE_PREFIX+String(companyId||'');}
  function readEmployeeCache(companyId){return safeJson(localStorage.getItem(employeeCacheKey(companyId)),[])||[];}
  function writeEmployeeCache(companyId,rows){localStorage.setItem(employeeCacheKey(companyId),JSON.stringify(Array.isArray(rows)?rows:[]));}
  function readEmployeeQueue(companyId){return safeJson(localStorage.getItem(employeeQueueKey(companyId)),[])||[];}
  function writeEmployeeQueue(companyId,ops){localStorage.setItem(employeeQueueKey(companyId),JSON.stringify(Array.isArray(ops)?ops:[]));}
  function cacheAuth(session){
    if(!session?.companyKey||!session?.authHash)return;
    localStorage.setItem(authKey(session.companyKey,session.authHash),JSON.stringify({...session,cachedAt:nowMs()}));
    if(session.actorType==='owner')localStorage.setItem(licenseKey(session.companyKey),JSON.stringify({...session,passwordHash:session.authHash,cachedAt:nowMs()}));
  }
  function clearEmployeeAuth(employeeId){
    for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(!k||!k.startsWith(AUTH_PREFIX))continue;const v=safeJson(localStorage.getItem(k),null);if(v?.employeeId===employeeId)localStorage.removeItem(k);}
  }
  function clearCompanyAuth(companyId,employeeId=''){
    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i);if(!k)continue;
      if(k.startsWith(AUTH_PREFIX)){const v=safeJson(localStorage.getItem(k),null);if(v?.companyId===companyId&&(!employeeId||v?.employeeId===employeeId))localStorage.removeItem(k);}
      if(!employeeId&&k.startsWith(LICENSE_PREFIX)){const v=safeJson(localStorage.getItem(k),null);if(v?.companyId===companyId)localStorage.removeItem(k);}
    }
  }
  function migrateCompanyAuthKey(companyId,newKey){
    const rows=[];
    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i);if(!k)continue;
      if(k.startsWith(AUTH_PREFIX)){const v=safeJson(localStorage.getItem(k),null);if(v?.companyId===companyId&&v?.authHash){rows.push(v);localStorage.removeItem(k);}}
      if(k.startsWith(LICENSE_PREFIX)){const v=safeJson(localStorage.getItem(k),null);if(v?.companyId===companyId)localStorage.removeItem(k);}
    }
    rows.forEach(v=>cacheAuth({...v,companyKey:newKey}));
  }
  function queueKey(companyId){return QUEUE_PREFIX+companyId;}
  function metaKey(companyId){return META_PREFIX+companyId;}
  function readQueue(companyId=activeCompanyId){return safeJson(localStorage.getItem(queueKey(companyId)),{})||{};}
  function writeQueue(queue,companyId=activeCompanyId){localStorage.setItem(queueKey(companyId),JSON.stringify(queue||{}));updateStatus({pending:Object.keys(queue||{}).length});}
  function readMeta(companyId=activeCompanyId){return safeJson(localStorage.getItem(metaKey(companyId)),{})||{};}
  function writeMeta(meta,companyId=activeCompanyId){localStorage.setItem(metaKey(companyId),JSON.stringify(meta||{}));}

  function updateStatus(patch={}){
    status={...status,...patch};
    listeners.forEach(fn=>{try{fn({...status})}catch(_){}});
  }
  function onStatus(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);try{fn({...status})}catch(_){}return()=>listeners.delete(fn);}

  async function loginCompany(companyKey,password){
    const key=String(companyKey||'').trim();
    const hash=sha256(password||'');
    if(!key||!password)throw new Error('مفتاح الشركة وكلمة المرور مطلوبان.');
    if(!isOnline()){
      const cached=safeJson(localStorage.getItem(authKey(key,hash)),null) || (()=>{const legacy=safeJson(localStorage.getItem(licenseKey(key)),null);return legacy?.passwordHash===hash?{...legacy,authHash:hash,actorType:'owner',actorName:legacy.ownerName||'',permissions:['*']}:null;})();
      if(!cached)throw new Error('أول تسجيل دخول بهذه البيانات يحتاج إنترنت.');
      if(cached.status!=='active')throw new Error('هذا الحساب موقوف.');
      if(cached.expiresAt&&nowMs()>Number(cached.expiresAt))throw new Error('انتهت صلاحية مفتاح الشركة.');
      return {...cached,offline:true};
    }
    await ensureSchema();
    const sql=`SELECT c.id AS company_id,c.company_key,c.company_name,c.owner_name,c.status,c.expires_at,c.updated_at,${serverNowSql()} AS server_now, CASE WHEN c.password_hash=? THEN 1 ELSE 0 END AS owner_match, e.id AS employee_id,e.name AS employee_name,e.status AS employee_status,e.permissions AS employee_permissions,e.updated_at AS employee_updated_at FROM ${tables.companies} c LEFT JOIN ${tables.employees} e ON e.company_id=c.id AND e.password_hash=? WHERE c.company_key=? AND (c.password_hash=? OR e.id IS NOT NULL) LIMIT 1`;
    const [result]=await pipeline([{sql,args:[hash,hash,key,hash]}]);
    const row=rowsToObjects(result)[0];
    if(!row)throw new Error('مفتاح الشركة أو كلمة المرور غير صحيحة.');
    if(row.status!=='active')throw new Error('مفتاح الشركة موقوف من لوحة الإدارة.');
    if(row.expires_at&&Number(row.server_now||nowMs())>Number(row.expires_at))throw new Error('انتهت مدة صلاحية مفتاح الشركة.');
    const isOwner=Number(row.owner_match||0)===1;
    if(!isOwner&&row.employee_status!=='active')throw new Error('حساب الموظف موقوف.');
    const permissions=isOwner?['*']:(safeJson(row.employee_permissions,[])||[]);
    const license={companyId:row.company_id,companyKey:row.company_key,companyName:row.company_name||'',ownerName:row.owner_name||'',status:row.status,expiresAt:row.expires_at||null,updatedAt:row.updated_at||0,authHash:hash,actorType:isOwner?'owner':'employee',actorId:isOwner?'':row.employee_id||'',employeeId:isOwner?'':row.employee_id||'',actorName:isOwner?(row.owner_name||'صاحب الحساب'):(row.employee_name||'موظف'),permissions,employeeUpdatedAt:isOwner?0:Number(row.employee_updated_at||0),cachedAt:nowMs()};
    cacheAuth(license);
    return license;
  }

  async function validateCompany(session){
    if(!session?.companyId)return false;
    if(!isOnline())return !(session.expiresAt&&nowMs()>Number(session.expiresAt));
    await ensureSchema();
    const employeeId=session.actorType==='employee'?(session.employeeId||session.actorId||''):'';
    const sql=employeeId?`SELECT c.id,c.company_key,c.company_name,c.owner_name,c.password_hash AS company_password_hash,c.status,c.expires_at,c.updated_at,${serverNowSql()} AS server_now,e.id AS employee_id,e.name AS employee_name,e.password_hash AS employee_password_hash,e.status AS employee_status,e.permissions AS employee_permissions,e.updated_at AS employee_updated_at FROM ${tables.companies} c LEFT JOIN ${tables.employees} e ON e.company_id=c.id AND e.id=? WHERE c.id=? LIMIT 1`:`SELECT id,company_key,company_name,owner_name,password_hash AS company_password_hash,status,expires_at,updated_at,${serverNowSql()} AS server_now FROM ${tables.companies} WHERE id=? LIMIT 1`;
    const args=employeeId?[employeeId,session.companyId]:[session.companyId];
    const [result]=await pipeline([{sql,args}]);
    const row=rowsToObjects(result)[0];
    if(!row||row.status!=='active'||(row.expires_at&&Number(row.server_now||nowMs())>Number(row.expires_at))){clearCompanyAuth(session.companyId);return false;}
    if(employeeId&&(!row.employee_id||row.employee_status!=='active')){clearCompanyAuth(session.companyId,employeeId);return false;}
    // Password edits from the admin panel take effect on already-open sessions at the next access refresh.
    if(employeeId&&session.authHash&&row.employee_password_hash&&row.employee_password_hash!==session.authHash){clearCompanyAuth(session.companyId,employeeId);return false;}
    if(!employeeId&&session.authHash&&row.company_password_hash&&row.company_password_hash!==session.authHash){clearCompanyAuth(session.companyId);return false;}
    const previousKey=session.companyKey||'';
    const next={...session,companyId:row.id,companyKey:row.company_key,companyName:row.company_name||'',ownerName:row.owner_name||'',status:row.status,expiresAt:row.expires_at||null,updatedAt:row.updated_at||0};
    if(employeeId){next.actorType='employee';next.actorId=row.employee_id;next.employeeId=row.employee_id;next.actorName=row.employee_name||'موظف';next.permissions=safeJson(row.employee_permissions,[])||[];next.employeeUpdatedAt=Number(row.employee_updated_at||0);}
    else {next.actorType='owner';next.actorName=row.owner_name||'صاحب الحساب';next.permissions=['*'];}
    activeCompany={...next};if(previousKey&&previousKey!==next.companyKey)migrateCompanyAuthKey(next.companyId,next.companyKey);cacheAuth(next);
    return next;
  }

  async function changeCompanyPassword(companyId,newPassword){
    if(!isOnline())throw new Error('تغيير كلمة المرور يحتاج اتصالاً بالإنترنت.');
    await ensureSchema();
    const hash=sha256(newPassword||'');
    if(String(newPassword||'').length<4)throw new Error('كلمة المرور يجب ألا تقل عن 4 خانات.');
    await pipeline([{sql:`UPDATE ${tables.companies} SET password_hash=?, updated_at=${serverNowSql()} WHERE id=?`,args:[hash,companyId]}]);
    if(activeCompany?.companyId===companyId){
      for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(!k||!k.startsWith(AUTH_PREFIX))continue;const v=safeJson(localStorage.getItem(k),null);if(v?.companyId===companyId&&v?.actorType!=='employee')localStorage.removeItem(k);}
      activeCompany.authHash=hash;activeCompany.passwordHash=hash;cacheAuth(activeCompany);
    }
    return true;
  }

  function attach(nextAdapter, company){
    adapter=nextAdapter||null;
    activeCompanyId=String(company?.companyId||'');
    activeCompany=company?{...company}:null;
    const q=activeCompanyId?readQueue(activeCompanyId):{};
    updateStatus({mode:isOnline()?'idle':'offline',pending:Object.keys(q).length,message:isOnline()?'':'يعمل محلياً — ستتم المزامنة عند عودة الإنترنت'});
    if(isOnline())flushEmployeeOps(activeCompanyId).catch(()=>{});
    restartPolling();
  }

  function detach(){adapter=null;activeCompanyId='';activeCompany=null;clearTimeout(pushTimer);clearTimeout(pollTimer);pushTimer=0;pollTimer=0;updateStatus({mode:'idle',pending:0,message:''});}

  async function syncSubscriptionUsersIndex(){
    if(!adapter||!activeCompanyId||!isOnline())return false;
    const plansRaw=adapter.getDataset('subscriptions');
    const plans=Array.isArray(plansRaw)?plansRaw:(plansRaw&&typeof plansRaw==='object'?Object.values(plansRaw):[]);
    const rows=plans.filter(x=>x&&x.id&&String(x.username||'').trim()&&String(x.loginPassword||'').trim()).map(x=>({
      id:`${activeCompanyId}::${String(x.id)}`,companyId:activeCompanyId,subscriptionId:String(x.id),subscriberId:String(x.subscriberId||''),
      username:String(x.username||'').trim(),passwordHash:sha256(String(x.loginPassword||'').trim()),networkName:String(x.networkName||''),managerName:String(x.managerName||''),
      subscriptionType:String(x.type||''),endDate:x.endDate||null,frozen:(x.frozen===true||Number(x.frozen)===1||String(x.frozen).toLowerCase()==='true')?1:0,updatedAt:nowMs()
    }));
    const payload=JSON.stringify(rows);
    await pipeline([
      {sql:`DELETE FROM ${tables.subscriptionUsers} WHERE company_id=?`,args:[activeCompanyId]},
      {sql:`INSERT INTO ${tables.subscriptionUsers}(id,company_id,subscription_id,subscriber_id,username,password_hash,network_name,manager_name,subscription_type,end_date,frozen,updated_at) SELECT json_extract(j.value,'$.id'),json_extract(j.value,'$.companyId'),json_extract(j.value,'$.subscriptionId'),COALESCE(json_extract(j.value,'$.subscriberId'),''),json_extract(j.value,'$.username'),json_extract(j.value,'$.passwordHash'),COALESCE(json_extract(j.value,'$.networkName'),''),COALESCE(json_extract(j.value,'$.managerName'),''),COALESCE(json_extract(j.value,'$.subscriptionType'),''),json_extract(j.value,'$.endDate'),COALESCE(json_extract(j.value,'$.frozen'),0),${serverNowSql()} FROM json_each(?) j`,args:[payload]}
    ]);
    return true;
  }

  function markChanged(dataset){
    if(!adapter||!activeCompanyId||!DEFAULT_DATASETS.includes(dataset))return;
    const q=readQueue();q[dataset]=nowMs();writeQueue(q);
    updateStatus({mode:isOnline()?'pending':'offline',message:isOnline()?'توجد تغييرات قيد المزامنة':'محفوظ محلياً — بانتظار الإنترنت'});
    schedulePush();
  }

  function schedulePush(){clearTimeout(pushTimer);pushTimer=setTimeout(()=>{pushPending().catch(()=>{});},syncCfg.writeDebounceMs);}

  async function pushPending(){
    if(inFlight||!adapter||!activeCompanyId)return false;
    const q=readQueue();const names=Object.keys(q).filter(n=>DEFAULT_DATASETS.includes(n));
    if(!names.length){updateStatus({mode:isOnline()?'synced':'offline',pending:0,message:isOnline()?'تمت المزامنة':'يعمل بدون إنترنت'});return true;}
    if(!isOnline()){updateStatus({mode:'offline',pending:names.length,message:'محفوظ محلياً — ستتم المزامنة عند عودة الإنترنت'});return false;}
    inFlight=true;updateStatus({mode:'syncing',pending:names.length,message:'جارٍ رفع التغييرات...'});
    try{
      await ensureSchema();
      const statements=names.map(name=>({sql:`INSERT INTO ${tables.state}(company_id,dataset,payload,updated_at) VALUES(?,?,?,${serverNowSql()}) ON CONFLICT(company_id,dataset) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at RETURNING updated_at`,args:[activeCompanyId,name,JSON.stringify(adapter.getDataset(name))]}));
      const results=await pipeline(statements);
      const meta=readMeta();let maxSeen=Number(meta.lastPullAt||0);
      results.forEach(r=>{const row=rowsToObjects(r)[0];if(row?.updated_at)maxSeen=Math.max(maxSeen,Number(row.updated_at));});
      names.forEach(name=>delete q[name]);writeQueue(q);writeMeta({...meta,lastPullAt:maxSeen,lastPushAt:nowMs()});
      if(names.includes('subscriptions')){try{await syncSubscriptionUsersIndex();}catch(indexError){console.warn('Subscription credential index deferred',indexError);}}
      updateStatus({mode:'synced',pending:Object.keys(q).length,lastSyncAt:new Date().toISOString(),message:'تمت المزامنة'});
      return true;
    }catch(error){
      updateStatus({mode:isOnline()?'error':'offline',pending:names.length,message:error.message||'تعذر رفع التغييرات'});
      throw error;
    }finally{inFlight=false;restartPolling();}
  }

  async function pullChanges(forceAll=false){
    if(inFlight||!adapter||!activeCompanyId||!isOnline())return false;
    inFlight=true;updateStatus({mode:'syncing',message:'جارٍ جلب آخر التغييرات...'});
    try{
      await ensureSchema();
      const q=readQueue();
      const meta=readMeta();
      const since=forceAll?0:Number(meta.lastPullAt||0);
      const [result]=await pipeline([{sql:`SELECT dataset,payload,updated_at FROM ${tables.state} WHERE company_id=? AND updated_at>? ORDER BY updated_at ASC`,args:[activeCompanyId,since]}]);
      const rows=rowsToObjects(result);let maxSeen=since;let applied=0;
      rows.forEach(row=>{
        maxSeen=Math.max(maxSeen,Number(row.updated_at||0));
        if(!DEFAULT_DATASETS.includes(row.dataset)||q[row.dataset])return; // pending local copy wins until it is pushed.
        const value=safeJson(row.payload,null);
        if(value===null&&row.payload!=='null')return;
        adapter.setDataset(row.dataset,clone(value),Number(row.updated_at||0));applied++;
      });
      writeMeta({...meta,lastPullAt:maxSeen,lastPullLocalAt:nowMs()});
      if(applied)adapter.onRemoteApplied?.(applied);
      updateStatus({mode:'synced',pending:Object.keys(q).length,lastSyncAt:new Date().toISOString(),message:applied?`تم استلام ${applied} تحديث`:'البيانات محدثة'});
      return true;
    }catch(error){
      updateStatus({mode:'error',message:error.message||'تعذر جلب التغييرات'});throw error;
    }finally{inFlight=false;restartPolling();}
  }

  async function initialSync(){
    if(!adapter||!activeCompanyId)return false;
    if(!isOnline()){updateStatus({mode:'offline',message:'يعمل محلياً — ستتم المزامنة عند عودة الإنترنت'});return false;}
    await ensureSchema();
    const [countResult]=await pipeline([{sql:`SELECT COUNT(*) AS count FROM ${tables.state} WHERE company_id=?`,args:[activeCompanyId]}]);
    const count=Number(rowsToObjects(countResult)[0]?.count||0);
    if(count===0){
      // First cloud seed for this company: send the complete local snapshot in one batched pipeline.
      const queue=readQueue();DEFAULT_DATASETS.forEach(n=>queue[n]=nowMs());writeQueue(queue);await pushPending();
      try{await syncSubscriptionUsersIndex();}catch(indexError){console.warn('Subscription credential index deferred',indexError);}
      return true;
    }
    // Existing cloud company: receive remote state first, then push only genuinely pending local edits.
    // Pending datasets remain protected during the pull and are uploaded immediately afterwards.
    await pullChanges(true);
    if(Object.keys(readQueue()).length)await pushPending();
    try{await syncSubscriptionUsersIndex();}catch(indexError){console.warn('Subscription credential index deferred',indexError);}
    return true;
  }

  async function syncNow(){
    if(!isOnline()){updateStatus({mode:'offline',message:'لا يوجد إنترنت — التغييرات محفوظة محلياً'});return false;}
    if(Object.keys(readQueue()).length)await pushPending();
    return pullChanges(false);
  }

  function restartPolling(){
    clearTimeout(pollTimer);pollTimer=0;
    if(!adapter||!activeCompanyId)return;
    const delay=document.hidden?syncCfg.hiddenPollMs:syncCfg.visiblePollMs;
    pollTimer=setTimeout(async()=>{try{if(isOnline()){if(Object.keys(readQueue()).length)await pushPending();else await pullChanges(false);}}catch(_){}finally{restartPolling();}},delay);
  }

  async function flushEmployeeOps(companyId=activeCompanyId){
    if(!companyId||!isOnline())return false;
    const ops=readEmployeeQueue(companyId);if(!ops.length)return true;
    await ensureSchema();
    for(const op of [...ops]){
      if(op.type==='create'){await pipeline([{sql:`INSERT INTO ${tables.employees}(id,company_id,name,password_hash,status,permissions,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,password_hash=excluded.password_hash,status=excluded.status,permissions=excluded.permissions,updated_at=excluded.updated_at`,args:[op.id,companyId,op.name,op.passwordHash,op.status||'active',JSON.stringify(op.permissions||[]),op.createdAt||nowMs(),nowMs()]}]);}
      if(op.type==='update'){const patch=op.patch||{},sets=[],args=[];if('name'in patch){sets.push('name=?');args.push(String(patch.name||''));}if('passwordHash'in patch&&patch.passwordHash){sets.push('password_hash=?');args.push(patch.passwordHash);}if('status'in patch){sets.push('status=?');args.push(patch.status==='inactive'?'inactive':'active');}if('permissions'in patch){sets.push('permissions=?');args.push(JSON.stringify(patch.permissions||[]));}if(sets.length){sets.push(`updated_at=${serverNowSql()}`);args.push(op.id,companyId);await pipeline([{sql:`UPDATE ${tables.employees} SET ${sets.join(',')} WHERE id=? AND company_id=?`,args}]);}}
      if(op.type==='delete'){await pipeline([{sql:`DELETE FROM ${tables.employees} WHERE id=? AND company_id=?`,args:[op.id,companyId]}]);}
      const current=readEmployeeQueue(companyId);const idx=current.findIndex(x=>x.queueId===op.queueId);if(idx>=0){current.splice(idx,1);writeEmployeeQueue(companyId,current);}
    }
    return true;
  }
  async function listEmployees(companyId=activeCompanyId){
    if(!companyId)return [];
    if(!isOnline())return readEmployeeCache(companyId);
    await flushEmployeeOps(companyId);await ensureSchema();
    const [r]=await pipeline([{sql:`SELECT id,company_id,name,status,permissions,created_at,updated_at FROM ${tables.employees} WHERE company_id=? ORDER BY created_at DESC`,args:[companyId]}]);
    const rows=rowsToObjects(r).map(x=>({...x,permissions:safeJson(x.permissions,[])||[]}));writeEmployeeCache(companyId,rows);return rows;
  }
  function queueEmployeeOp(companyId,op){const q=readEmployeeQueue(companyId);q.push({queueId:uid('eq'),...op});writeEmployeeQueue(companyId,q);}
  async function createEmployee(companyId,data){
    if(!companyId)throw new Error('تعذر تحديد الشركة.');
    const name=String(data.name||'').trim(),password=String(data.password||'');
    if(name.length<2)throw new Error('اكتب اسم الموظف.');
    if(password.length<4)throw new Error('كلمة مرور الموظف يجب ألا تقل عن 4 خانات.');
    const id=uid('emp'),passwordHash=sha256(password),row={id,company_id:companyId,name,status:'active',permissions:Array.isArray(data.permissions)?data.permissions:[],created_at:nowMs(),updated_at:nowMs()};
    if(activeCompany?.actorType==='owner'&&activeCompany?.authHash===passwordHash)throw new Error('اختر كلمة مرور مختلفة عن كلمة مرور صاحب المفتاح.');
    if(isOnline()){
      await ensureSchema();
      const [check]=await pipeline([{sql:`SELECT CASE WHEN password_hash=? THEN 1 ELSE 0 END AS clash FROM ${tables.companies} WHERE id=? LIMIT 1`,args:[passwordHash,companyId]}]);
      if(Number(rowsToObjects(check)[0]?.clash||0))throw new Error('اختر كلمة مرور مختلفة عن كلمة مرور صاحب المفتاح.');
      try{await pipeline([{sql:`INSERT INTO ${tables.employees}(id,company_id,name,password_hash,status,permissions,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)`,args:[id,companyId,name,passwordHash,'active',JSON.stringify(row.permissions),row.created_at,row.updated_at]}]);}
      catch(error){if(/unique|constraint/i.test(error.message||''))throw new Error('كلمة المرور مستخدمة لموظف آخر داخل نفس الشركة.');throw error;}
    }else queueEmployeeOp(companyId,{type:'create',id,name,passwordHash,status:'active',permissions:row.permissions,createdAt:row.created_at});
    const cache=readEmployeeCache(companyId);cache.unshift(row);writeEmployeeCache(companyId,cache);
    cacheAuth({companyId,companyKey:activeCompany?.companyKey||'',companyName:activeCompany?.companyName||'',ownerName:activeCompany?.ownerName||'',status:activeCompany?.status||'active',expiresAt:activeCompany?.expiresAt||null,authHash:passwordHash,actorType:'employee',actorId:id,employeeId:id,actorName:name,permissions:row.permissions});
    return row;
  }

  async function updateEmployee(companyId,id,patch={}){
    if(!companyId||!id)throw new Error('بيانات الموظف غير مكتملة.');
    const cache=readEmployeeCache(companyId),row=cache.find(x=>x.id===id);if(!row)throw new Error('الموظف غير موجود.');
    const localPatch={};
    if('name'in patch)localPatch.name=String(patch.name||'').trim();
    if(patch.password){if(String(patch.password).length<4)throw new Error('كلمة المرور يجب ألا تقل عن 4 خانات.');localPatch.passwordHash=sha256(patch.password);if(activeCompany?.actorType==='owner'&&activeCompany?.authHash===localPatch.passwordHash)throw new Error('اختر كلمة مرور مختلفة عن كلمة مرور صاحب المفتاح.');}
    if('status'in patch)localPatch.status=patch.status==='inactive'?'inactive':'active';
    if('permissions'in patch)localPatch.permissions=Array.isArray(patch.permissions)?patch.permissions:[];
    if(isOnline()&&localPatch.passwordHash){await ensureSchema();const [check]=await pipeline([{sql:`SELECT CASE WHEN password_hash=? THEN 1 ELSE 0 END AS clash FROM ${tables.companies} WHERE id=? LIMIT 1`,args:[localPatch.passwordHash,companyId]}]);if(Number(rowsToObjects(check)[0]?.clash||0))throw new Error('اختر كلمة مرور مختلفة عن كلمة مرور صاحب المفتاح.');}
    const previous={...row,permissions:[...(row.permissions||[])]};
    Object.assign(row,{...(localPatch.name!==undefined?{name:localPatch.name}:{}),...(localPatch.status?{status:localPatch.status}:{}),...(localPatch.permissions?{permissions:localPatch.permissions}:{}),updated_at:nowMs()});writeEmployeeCache(companyId,cache);
    if(localPatch.passwordHash){clearEmployeeAuth(id);cacheAuth({companyId,companyKey:activeCompany?.companyKey||'',companyName:activeCompany?.companyName||'',ownerName:activeCompany?.ownerName||'',status:activeCompany?.status||'active',expiresAt:activeCompany?.expiresAt||null,authHash:localPatch.passwordHash,actorType:'employee',actorId:id,employeeId:id,actorName:row.name||'موظف',permissions:row.permissions||[]});}
    const op={type:'update',id,patch:localPatch};
    if(!isOnline()){queueEmployeeOp(companyId,op);return row;}
    await ensureSchema();const sets=[],args=[];
    if(localPatch.name!==undefined){sets.push('name=?');args.push(localPatch.name);}if(localPatch.passwordHash){sets.push('password_hash=?');args.push(localPatch.passwordHash);}if(localPatch.status){sets.push('status=?');args.push(localPatch.status);}if(localPatch.permissions){sets.push('permissions=?');args.push(JSON.stringify(localPatch.permissions));}sets.push(`updated_at=${serverNowSql()}`);args.push(id,companyId);
    try{await pipeline([{sql:`UPDATE ${tables.employees} SET ${sets.join(',')} WHERE id=? AND company_id=?`,args}]);}
    catch(error){Object.assign(row,previous);writeEmployeeCache(companyId,cache);if(/unique|constraint/i.test(error.message||''))throw new Error('كلمة المرور مستخدمة لموظف آخر داخل نفس الشركة.');throw error;}
    return row;
  }

  async function deleteEmployee(companyId,id){
    const cache=readEmployeeCache(companyId).filter(x=>x.id!==id);writeEmployeeCache(companyId,cache);clearEmployeeAuth(id);if(!isOnline()){queueEmployeeOp(companyId,{type:'delete',id});return true;}await ensureSchema();await pipeline([{sql:`DELETE FROM ${tables.employees} WHERE id=? AND company_id=?`,args:[id,companyId]}]);return true;
  }

  async function adminState(){
    if(!isOnline())throw new Error('لوحة الإدارة تحتاج إنترنت.');
    await ensureSchema();
    const [result]=await pipeline([{sql:`SELECT COUNT(*) AS count FROM ${tables.admins}`}]);
    return {hasAdmin:Number(rowsToObjects(result)[0]?.count||0)>0};
  }
  async function bootstrapAdmin(adminKey,password){
    await ensureSchema();
    const state=await adminState();if(state.hasAdmin)throw new Error('تم إعداد مدير مسبقاً.');
    const key=String(adminKey||'').trim();if(key.length<4||String(password||'').length<6)throw new Error('استخدم مفتاح مدير 4 أحرف على الأقل وكلمة مرور 6 خانات على الأقل.');
    const n=nowMs();await pipeline([{sql:`INSERT INTO ${tables.admins}(id,admin_key,password_hash,created_at,updated_at) VALUES(?,?,?,?,?)`,args:[uid('admin'),key,sha256(password),n,n]}]);return true;
  }
  async function adminLogin(adminKey,password){
    await ensureSchema();const key=String(adminKey||'').trim(),hash=sha256(password||'');
    const [result]=await pipeline([{sql:`SELECT id,admin_key,created_at,updated_at FROM ${tables.admins} WHERE admin_key=? AND password_hash=? LIMIT 1`,args:[key,hash]}]);
    const row=rowsToObjects(result)[0];if(!row)throw new Error('بيانات دخول المدير غير صحيحة.');return row;
  }
  async function listCompanies(search=''){
    await ensureSchema();const q=String(search||'').trim();
    const sql=q?`SELECT c.*, (SELECT COUNT(*) FROM ${tables.state} s WHERE s.company_id=c.id) AS dataset_count FROM ${tables.companies} c WHERE c.company_key LIKE ? OR c.company_name LIKE ? OR c.owner_name LIKE ? ORDER BY c.created_at DESC`:`SELECT c.*, (SELECT COUNT(*) FROM ${tables.state} s WHERE s.company_id=c.id) AS dataset_count FROM ${tables.companies} c ORDER BY c.created_at DESC`;
    const args=q?[`%${q}%`,`%${q}%`,`%${q}%`]:[];const [result]=await pipeline([{sql,args}]);return rowsToObjects(result);
  }
  async function createCompany(data){
    await ensureSchema();const key=String(data.companyKey||'').trim();const password=String(data.password||'');
    if(key.length<3)throw new Error('مفتاح الشركة قصير جداً.');if(password.length<4)throw new Error('كلمة المرور يجب ألا تقل عن 4 خانات.');
    const n=nowMs(),id=uid('co');
    try{await pipeline([{sql:`INSERT INTO ${tables.companies}(id,company_key,password_hash,company_name,owner_name,status,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,'active',?,?,?)`,args:[id,key,sha256(password),String(data.companyName||''),String(data.ownerName||''),data.expiresAt||null,n,n]}]);}
    catch(error){if(/unique|constraint/i.test(error.message||''))throw new Error('مفتاح الشركة مستخدم مسبقاً.');throw error;}
    return id;
  }
  async function updateCompany(id,patch={}){
    await ensureSchema();const sets=[],args=[];
    if(Object.prototype.hasOwnProperty.call(patch,'companyName')){sets.push('company_name=?');args.push(String(patch.companyName||''));}
    if(Object.prototype.hasOwnProperty.call(patch,'ownerName')){sets.push('owner_name=?');args.push(String(patch.ownerName||''));}
    if(Object.prototype.hasOwnProperty.call(patch,'companyKey')){sets.push('company_key=?');args.push(String(patch.companyKey||'').trim());}
    if(Object.prototype.hasOwnProperty.call(patch,'status')){sets.push('status=?');args.push(patch.status==='inactive'?'inactive':'active');}
    if(Object.prototype.hasOwnProperty.call(patch,'expiresAt')){sets.push('expires_at=?');args.push(patch.expiresAt||null);}
    if(patch.password){sets.push('password_hash=?');args.push(sha256(patch.password));}
    if(!sets.length)return false;sets.push(`updated_at=${serverNowSql()}`);args.push(id);
    await pipeline([{sql:`UPDATE ${tables.companies} SET ${sets.join(',')} WHERE id=?`,args}]);return true;
  }
  async function deleteCompany(id){await ensureSchema();await pipeline([{sql:`DELETE FROM ${tables.employees} WHERE company_id=?`,args:[id]},{sql:`DELETE FROM ${tables.state} WHERE company_id=?`,args:[id]},{sql:`DELETE FROM ${tables.companies} WHERE id=?`,args:[id]}]);return true;}
  async function companyStats(){
    await ensureSchema();const [r]=await pipeline([{sql:`SELECT COUNT(*) AS total, SUM(CASE WHEN status='active' AND (expires_at IS NULL OR expires_at>=${serverNowSql()}) THEN 1 ELSE 0 END) AS active, SUM(CASE WHEN expires_at IS NOT NULL AND expires_at<${serverNowSql()} THEN 1 ELSE 0 END) AS expired FROM ${tables.companies}`}]);return rowsToObjects(r)[0]||{total:0,active:0,expired:0};
  }

  window.addEventListener('online',()=>{updateStatus({mode:'pending',message:'عاد الإنترنت — جارٍ مزامنة البيانات'});flushEmployeeOps().catch(()=>{}).finally(()=>syncNow().catch(()=>{}));restartPolling();});
  window.addEventListener('offline',()=>{updateStatus({mode:'offline',message:'يعمل بدون إنترنت — التغييرات محفوظة محلياً'});restartPolling();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isOnline())syncNow().catch(()=>{});restartPolling();});
  window.addEventListener('focus',()=>{if(isOnline())syncNow().catch(()=>{});});

  window.AhmadiCloud={
    ready:()=>ensureSchema(), pipeline, rowsToObjects, sha256,
    loginCompany,validateCompany,changeCompanyPassword,
    attach,detach,markChanged,syncNow,initialSync,pushPending,pullChanges,onStatus,
    getStatus:()=>({...status}),getActiveCompany:()=>activeCompany?{...activeCompany}:null,
    adminState,bootstrapAdmin,adminLogin,listCompanies,createCompany,updateCompany,deleteCompany,companyStats,
    listEmployees,createEmployee,updateEmployee,deleteEmployee,flushEmployeeOps,
    isOnline
  };
})();
