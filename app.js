/* الأحمدي لإدارة عدادات الكهرباء - local-first sync v13.10 */
(() => {
  'use strict';

  const LEGACY_DB_KEY = 'AHMADI_ELECTRIC_DB_V12';
  const SESSION_KEY = 'AHMADI_ELECTRIC_SESSION_V13_CLOUD';
  const LAST_KEY = 'AHMADI_LAST_COMPANY_KEY';
  const SYNC_DATASETS = ['settings','subscribers','subscriptions','accounts','movements','logs','tasks','chats','backups'];
  const PERMISSION_GROUPS = [
    ['الرئيسية',[['home.view','عرض الصفحة الرئيسية']]],
    ['المشتركون',[['subscribers.view','عرض المشتركين'],['subscribers.add','إضافة مشترك'],['subscribers.edit','تعديل بيانات المشترك'],['subscribers.delete','حذف مشترك']]],
    ['الاشتراكات',[['subscriptions.view','عرض الاشتراكات'],['subscriptions.add','إضافة اشتراك'],['subscriptions.edit','تعديل الاشتراكات'],['subscriptions.freeze','تجميد / تفعيل الاشتراكات']]],
    ['التدفقات المالية',[['flows.view','عرض التدفقات'],['flows.collect','تحصيل دفعة'],['flows.send','إرسال دفعة'],['flows.transfer','تحويل بين الحسابات'],['flows.expense','إضافة مصروف'],['flows.edit','تعديل الحركات المالية']]],
    ['الحسابات المالية',[['accounts.view','عرض الحسابات'],['accounts.add','إضافة حساب'],['accounts.edit','تعديل الحساب'],['accounts.transfer','التحويل بين الحسابات']]],
    ['التقارير',[['reports.view','عرض التقارير']]],
    ['الدعم الفني',[['support.view','عرض المحادثات'],['support.send','إرسال رسائل وصور وصوت']]],
    ['المهام',[['tasks.view','عرض المهام'],['tasks.manage','إضافة وتحديث المهام']]],
    ['السجل الزمني',[['timeline.view','عرض السجل الزمني']]],
    ['الإعدادات',[['settings.view','عرض الإعدادات'],['settings.edit','تعديل الإعدادات الأساسية'],['settings.templates','تعديل قوالب الرسائل'],['settings.backups','النسخ الاحتياطي'],['settings.notifications','إعدادات الإشعارات']]],
    ['الموظفون',[['employees.view','عرض الموظفين'],['employees.manage','إضافة وتعديل وحذف الموظفين']]]
  ];
  const DAY = 86400000;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const ICONS = {
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    wallet:'<path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10H5a3 3 0 0 1-3-3V7"/><path d="M16 14h2"/>',
    bank:'<path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M2 20h20M12 3l9 5H3l9-5Z"/>',
    chart:'<path d="M3 3v18h18"/><path d="m7 16 4-4 3 3 5-7"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    settings:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
    logout:'<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/>',
    download:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z"/>',
    message:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 13h5"/>',
    send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    arrow:'<path d="m15 18-6-6 6-6"/>',
    receipt:'<path d="M6 2v20l3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2Z"/><path d="M9 9h6M9 13h6"/>',
    bolt:'<path d="m13 2-9 12h8l-1 8 9-12h-8Z"/>',
    dollar:'<circle cx="12" cy="12" r="9"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v12"/>',
    filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
    upload:'<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>',
    camera:'<path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2Z"/><circle cx="12" cy="13" r="4"/>',
    save:'<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V4M8 21v-7h8v7"/>',
    transfer:'<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
    inbox:'<path d="M4 4h16v16H4z"/><path d="M4 14h5l2 3h2l2-3h5"/>',
    eye:'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    eyeoff:'<path d="m3 3 18 18"/><path d="M10.6 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-2.4 3.2M6.6 6.6C3.6 8.6 2 12 2 12s3.5 6 10 6a10.7 10.7 0 0 0 4-.8"/><path d="M9.8 9.8a3 3 0 0 0 4.4 4.4"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v5M14 11v5"/>',
    key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l3 3"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    dots:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    file:'<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    alert:'<path d="M10.3 3.5 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    employee:'<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M18 8v6M15 11h6"/>',
    chat:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 13h5"/>',
    task:'<path d="M9 5h10M9 12h10M9 19h10"/><path d="m3 5 1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2"/>',
    mic:'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    template:'<path d="M6 2h12a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V4a2 2 0 0 1 2-2Z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    play:'<path d="m8 5 11 7-11 7Z"/>'
  };

  function icon(name, size = 22, stroke = 1.8) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
  }

  function defaultTemplates() {
    return {
      summary:`مرحبا {{name}}\nمنصة ادارة شبكات الكهرباء الأحمدي {{manager}}\nاليوم: {{today}}\n\nتفاصيل اشتراك تطبيق الاحمدي لادارة عدادات الكهرباء\nنوع الاشتراك: {{type}}\nفترة الاشتراك الاجمالية: {{period}}\nملاحظة: عند تجديد الاشتراك يتغير تاريخ النهاية.\nاجمالي عدد ايام الاشتراكات: {{totalDays}}\nالفترة المتبقية للانتهاء الاشتراكات: {{remainingDays}}\nاجمالي تكلفة الاشتراك المتفق عليها: {{totalCost}}\nاجمالي المبلغ المدفوع: {{totalPaid}}\nاجمالي المبلغ المتبقي: {{totalRemaining}}\nاسم المستخدم: {{username}}\nكلمة المرور: {{password}}`,
      subscription:`مرحبا {{name}}\nاليوم: {{today}}\nمنصة ادارة شبكات الكهرباء الأحمدي {{manager}}\n\nتفاصيل الاشتراك\nاسم الشبكة: {{network}}\nاسم مدير الشبكة: {{networkManager}}\nنوع الاشتراك: {{type}}\nفترة الاشتراك: {{period}}\nعدد ايام الاشتراك الاجمالي: {{days}}\nعدد ايام استهلاك الاشتراك: {{usedDays}}\nعدد الايام المتبقية لانتهاء الاشتراك: {{remainingDays}}\nتكلفة الاشتراك: {{cost}}\nالمبلغ المدفوع: {{paid}}\nالمبلغ المخصوم: {{discount}}\nالمبلغ المتبقي {{balanceSide}}: {{remaining}}\n\nالملخص\nفترة الاشتراك الاجمالية: {{summaryPeriod}}\nاجمالي عدد ايام الاشتراكات: {{summaryDays}}\nالفترة المتبقية: {{summaryRemainingDays}}\nاجمالي تكلفة الاشتراكات: {{summaryCost}}\nاجمالي المدفوع: {{summaryPaid}}\nاجمالي المتبقي: {{summaryRemaining}}\nاسم المستخدم: {{username}}\nكلمة المرور: {{password}}`,
      collect:`مرحبا {{name}}\nاليوم: {{today}}\nمنصة ادارة شبكات الكهرباء الأحمدي {{manager}}\n\nنود اعلامكم انه تم استلام دفعة من طرفكم.\nيوم الدفع والتاريخ: {{paymentDate}}\nالمبلغ: {{amount}}\nاودعت الدفعة في حساب: {{account}}\n\nالملخص\nاجمالي عدد ايام الاشتراكات: {{summaryDays}}\nالفترة المتبقية: {{summaryRemainingDays}}\nاجمالي تكلفة الاشتراكات: {{summaryCost}}\nاجمالي المدفوع: {{summaryPaid}}\nاجمالي المتبقي: {{summaryRemaining}}\nاسم المستخدم: {{username}}\nكلمة المرور: {{password}}`,
      send:`مرحبا {{name}}\nاليوم: {{today}}\nمنصة ادارة شبكات الكهرباء الأحمدي {{manager}}\n\nنود اعلامكم انه تم ارسال دفعة اليكم.\nيوم الدفع والتاريخ: {{paymentDate}}\nالمبلغ: {{amount}}\nتم الارسال من حساب: {{account}}\n\nالملخص\nاجمالي عدد ايام الاشتراكات: {{summaryDays}}\nالفترة المتبقية: {{summaryRemainingDays}}\nاجمالي تكلفة الاشتراكات: {{summaryCost}}\nاجمالي المدفوع: {{summaryPaid}}\nاجمالي المتبقي: {{summaryRemaining}}\nاسم المستخدم: {{username}}\nكلمة المرور: {{password}}`,
      transferFrom:`مرحبا {{name}}\nاليوم: {{today}}\nمنصة ادارة شبكات الكهرباء الأحمدي {{manager}}\n\nنود اعلامكم انه تم تحويل مبلغ مالي من حسابكم {{fromAccount}} الى الحساب {{toAccount}}.\nالمبلغ: {{amount}}\n\nالملخص\nاجمالي تكلفة الاشتراكات: {{summaryCost}}\nاجمالي المدفوع: {{summaryPaid}}\nاجمالي المتبقي: {{summaryRemaining}}`,
      transferTo:`مرحبا {{name}}\nاليوم: {{today}}\nمنصة ادارة شبكات الكهرباء الأحمدي {{manager}}\n\nنود اعلامكم انه تم تحويل مبلغ مالي الى حسابكم {{toAccount}} من الحساب {{fromAccount}}.\nالمبلغ: {{amount}}\n\nالملخص\nاجمالي تكلفة الاشتراكات: {{summaryCost}}\nاجمالي المدفوع: {{summaryPaid}}\nاجمالي المتبقي: {{summaryRemaining}}`,
      inquiry:`مرحبا {{name}}\nاليوم: {{today}}\nمنصة ادارة شبكات الكهرباء الأحمدي {{manager}}\n\nاكتب رسالتك الاستعلامية هنا...`
    };
  }

  const defaultDB = () => ({
    settings: {
      companyKey: '',
      password: '',
      appName: 'الأحمدي لإدارة عدادات الكهرباء',
      managerName: '',
      language: 'ar',
      permanentPrice: 0,
      permanentDiscount: 0,
      temporaryMonthlyPrice: 0,
      temporaryDiscount: 0,
      trialDays: 7,
      expiryWarningDays: 7,
      notificationsEnabled: false,
      dailyDebtorsNotifications: true,
      dailyExpiryNotifications: true,
      operationNotifications: true,
      taskNotificationsEnabled: true,
      taskReminderMinutes: 60,
      notificationState: {lastDebtorsAt:'', lastExpiryAt:''},
      templates: defaultTemplates(),
      customTemplates: []
    },
    subscribers: [],
    subscriptions: [],
    accounts: [],
    movements: [],
    logs: [],
    tasks: [],
    chats: [],
    backups: []
  });

  let activeSession = readSession();
  let db = loadDB();
  let syncBaseline = new Map();
  let ui = {
    currentSubscriberTab: 'overview',
    flowTab: 'debtors',
    accountTab: 'accounts',
    accountTypeFilter: 'all',
    dateFilter: 'all',
    customFrom: dateOnlyInput(),
    customTo: dateOnlyInput(),
    receiptData: '',
    deferredInstall: null,
    homeDateFilter: 'all',
    homeFrom: dateOnlyInput(),
    homeTo: dateOnlyInput(),
    reportDateFilter: 'all',
    reportFrom: dateOnlyInput(),
    reportTo: dateOnlyInput(),
    reportSubscriberId: '',
    chatSubscriberId: '',
    taskFilter: 'pending',
    voiceRecorder: null,
    voiceChunks: [],
    employeeRows: []
  };

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const value = raw ? JSON.parse(raw) : null;
      if (!value || !value.companyId || !value.companyKey) return null;
      // Retire the untouched legacy demo session from older builds.
      if (String(value.companyKey)==='12345' && String(value.ownerName||'')==='م. احمد معمر') { localStorage.removeItem(SESSION_KEY); return null; }
      if (value.expiresAt && Date.now() > Number(value.expiresAt)) return null;
      return value;
    } catch (_) { return null; }
  }

  function currentActorName() {
    if(activeSession) return activeSession.actorName || activeSession.ownerName || (activeSession.actorType==='employee'?'موظف':'صاحب الحساب');
    return 'صاحب الحساب';
  }

  function isOwnerSession() { return activeSession?.actorType !== 'employee'; }
  function can(permission) {
    if (!activeSession) return false;
    if (isOwnerSession()) return true;
    const list = Array.isArray(activeSession.permissions) ? activeSession.permissions : [];
    return list.includes('*') || list.includes(permission);
  }
  function requirePermission(permission, message='ليس لديك صلاحية لتنفيذ هذا الإجراء.') {
    if (can(permission)) return true;
    toast(message,'warning');
    return false;
  }
  function routePermission(route) {
    return ({home:'home.view',subscribers:'subscribers.view',subscriber:'subscribers.view',subscriptions:'subscriptions.view',flows:'flows.view',accounts:'accounts.view',reports:'reports.view',support:'support.view',tasks:'tasks.view',timeline:'timeline.view',settings:'settings.view',employees:'employees.view'})[route] || 'home.view';
  }

  function companyDbKey(companyId = activeSession?.companyId) {
    return companyId ? `${LEGACY_DB_KEY}::${companyId}` : LEGACY_DB_KEY;
  }

  function normalizeDB(parsed) {
    const toArray = value => Array.isArray(value) ? value : (value && typeof value === 'object' ? Object.values(value) : []);
    const fresh = defaultDB();
    return {
      ...fresh,
      ...(parsed || {}),
      settings: {...fresh.settings, ...((parsed || {}).settings || {}), notificationState:{...fresh.settings.notificationState,...((((parsed || {}).settings)||{}).notificationState||{})}, templates:{...fresh.settings.templates, ...((((parsed || {}).settings)||{}).templates||{})}, customTemplates:toArray((((parsed || {}).settings)||{}).customTemplates)},
      subscribers: toArray((parsed || {}).subscribers),
      subscriptions: toArray((parsed || {}).subscriptions),
      accounts: toArray((parsed || {}).accounts),
      movements: toArray((parsed || {}).movements),
      logs: toArray((parsed || {}).logs),
      tasks: toArray((parsed || {}).tasks),
      chats: toArray((parsed || {}).chats),
      backups: toArray((parsed || {}).backups)
    };
  }

  function loadDB() {
    try {
      const scopedKey = companyDbKey();
      let raw = localStorage.getItem(scopedKey);
      return raw ? normalizeDB(JSON.parse(raw)) : defaultDB();
    } catch (e) {
      console.warn('Local database reset after parse error', e);
      return defaultDB();
    }
  }

  function persistLocalOnly() {
    localStorage.setItem(companyDbKey(), JSON.stringify(db));
  }

  function refreshSyncBaseline() {
    syncBaseline = new Map(SYNC_DATASETS.map(name => [name, JSON.stringify(db[name])]));
  }

  function saveDB(options = {}) {
    persistLocalOnly();
    if (options.sync === false || !activeSession?.companyId || !window.AhmadiCloud) {
      if (!syncBaseline.size) refreshSyncBaseline();
      return;
    }
    SYNC_DATASETS.forEach(name => {
      const next = JSON.stringify(db[name]);
      if (syncBaseline.get(name) !== next) {
        syncBaseline.set(name, next);
        window.AhmadiCloud.markChanged(name);
      }
    });
  }

  function applyRemoteDataset(name, value) {
    if (!SYNC_DATASETS.includes(name)) return;
    if (name === 'settings') db.settings = normalizeDB({settings:value}).settings;
    else db[name] = Array.isArray(value) ? value : (value && typeof value === 'object' ? Object.values(value) : []);
    persistLocalOnly();
    syncBaseline.set(name, JSON.stringify(db[name]));
  }

  function attachCloudSession() {
    if (!activeSession?.companyId || !window.AhmadiCloud) return;
    refreshSyncBaseline();
    window.AhmadiCloud.attach({
      getDataset: name => db[name],
      setDataset: (name, value) => applyRemoteDataset(name, value),
      onRemoteApplied: () => {
        updateBranding();
        if (isLogged() && !$('#appView')?.classList.contains('hidden')) renderRoute();
      }
    }, activeSession);
  }

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function esc(value = '') {
    return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function num(v) {
    const n = Number(String(v ?? 0).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function money(v) {
    return `₪ ${num(v).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  }

  function nowLocalInput() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  }

  function dateOnlyInput() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,10);
  }

  function applyDateDefaults(root=document) {
    const today=dateOnlyInput(), now=nowLocalInput(), time=now.slice(11,16);
    root.querySelectorAll?.('input[type="date"]').forEach(input=>{if(!input.value)input.value=today;});
    root.querySelectorAll?.('input[type="datetime-local"]').forEach(input=>{if(!input.value)input.value=now;});
    root.querySelectorAll?.('input[type="time"]').forEach(input=>{if(!input.value)input.value=time;});
  }

  function fmtDate(value, withTime = false) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat(db.settings.language === 'en' ? 'en-GB' : 'ar', {
      year:'numeric', month:'short', day:'numeric', ...(withTime ? {hour:'2-digit', minute:'2-digit'} : {})
    }).format(d);
  }

  function logAction(type, title, detail = '', refId = '') {
    db.logs.unshift({id:uid('log'), type, title, detail, refId, actorName:currentActorName(), actorType:activeSession?.actorType||'owner', createdAt:new Date().toISOString()});
    if (db.logs.length > 1000) db.logs.length = 1000;
    saveDB();
    const operationTypes = new Set(['subscriber','subscription','money','account','transfer','task']);
    const isNewOperation = /^(إضافة|تحصيل|إرسال|ايداع|إيداع|مصروف|تحويل)/.test(String(title||''));
    if (operationTypes.has(type) && isNewOperation) notifyOperationAdded(title, detail);
  }

  const DAILY_NOTIFICATION_MS = 24 * 60 * 60 * 1000;

  async function showSystemNotification(title, body, tag='ahmadi-notification') {
    if (!db.settings.notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return false;
    const options = {body:String(body||''), icon:'icon-192.png', badge:'icon-192.png', tag, renotify:true, dir:'rtl', lang:'ar', data:{url:location.href}};
    try {
      if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        const reg = await navigator.serviceWorker.ready;
        if (reg?.showNotification) { await reg.showNotification(title, options); return true; }
      }
      new Notification(title, options);
      return true;
    } catch (e) { console.warn('Notification failed', e); return false; }
  }

  function notifyOperationAdded(title, detail='') {
    if (!db.settings.notificationsEnabled || !db.settings.operationNotifications || !isLogged()) return;
    showSystemNotification('عملية جديدة في منصة الأحمدي', `${title}${detail ? ' • ' + detail : ''}`, 'ahmadi-operation-' + Date.now());
  }

  function debtorsNotificationSummary() {
    const rows = db.subscribers.map(s=>({s,f:subscriberFinancial(s.id)})).filter(x=>x.f.dueToUs > .009);
    const total = rows.reduce((sum,x)=>sum+x.f.dueToUs,0);
    const names = rows.slice(0,4).map(x=>x.s.name).filter(Boolean).join('، ');
    return {count:rows.length,total,names};
  }

  function expiringNotificationSummary() {
    const days = Math.max(1, num(db.settings.expiryWarningDays)||7);
    const rows = db.subscriptions.filter(s=>{
      const m=subscriptionMetrics(s);
      return !s.frozen && s.type!=='permanent' && !m.expired && m.remainingDays!==null && m.remainingDays<=days;
    }).sort((a,b)=>(subscriptionMetrics(a).remainingDays??9999)-(subscriptionMetrics(b).remainingDays??9999));
    const names = rows.slice(0,4).map(s=>subscriberById(s.subscriberId)?.name||s.networkName||'اشتراك').join('، ');
    return {count:rows.length,days,names};
  }

  function notificationSnapshot() {
    const debt=debtorsNotificationSummary();
    const expiry=expiringNotificationSummary();
    return {
      enabled:!!db.settings.notificationsEnabled,
      debtorsEnabled:db.settings.dailyDebtorsNotifications!==false,
      expiryEnabled:db.settings.dailyExpiryNotifications!==false,
      debtors:{count:debt.count,total:debt.total,names:debt.names},
      expiry:{count:expiry.count,days:expiry.days,names:expiry.names},
      updatedAt:new Date().toISOString()
    };
  }

  function syncNotificationSnapshotToServiceWorker() {
    if(!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    try{navigator.serviceWorker.controller.postMessage({type:'AHMADI_NOTIFICATION_SNAPSHOT',payload:notificationSnapshot()});}catch(_){}
  }

  async function checkDailyBusinessNotifications(force=false) {
    if (!isLogged() || !db.settings.notificationsEnabled) return;
    db.settings.notificationState = {...defaultDB().settings.notificationState, ...(db.settings.notificationState||{})};
    const now=Date.now();
    let changed=false;
    if (db.settings.dailyDebtorsNotifications) {
      const last=new Date(db.settings.notificationState.lastDebtorsAt||0).getTime()||0;
      if (force || now-last>=DAILY_NOTIFICATION_MS) {
        const d=debtorsNotificationSummary();
        if (d.count) await showSystemNotification('المستحق عليهم', `${d.count} مشترك • إجمالي المستحق ${money(d.total)}${d.names ? ' • ' + d.names : ''}`, 'ahmadi-daily-debtors');
        db.settings.notificationState.lastDebtorsAt=new Date(now).toISOString(); changed=true;
      }
    }
    if (db.settings.dailyExpiryNotifications) {
      const last=new Date(db.settings.notificationState.lastExpiryAt||0).getTime()||0;
      if (force || now-last>=DAILY_NOTIFICATION_MS) {
        const x=expiringNotificationSummary();
        if (x.count) await showSystemNotification('اشتراكات على وشك الانتهاء', `${x.count} اشتراك خلال ${x.days} يوم${x.names ? ' • ' + x.names : ''}`, 'ahmadi-daily-expiry');
        db.settings.notificationState.lastExpiryAt=new Date(now).toISOString(); changed=true;
      }
    }
    if (changed) saveDB();
  }

  function checkAllNotifications(forceDaily=false) {
    checkTaskNotifications();
    checkDailyBusinessNotifications(forceDaily);
    syncNotificationSnapshotToServiceWorker();
  }

  function subscriberById(id) { return db.subscribers.find(x => x.id === id); }
  function subscriptionsFor(id) { return db.subscriptions.filter(x => x.subscriberId === id); }
  function movementsFor(id) { return db.movements.filter(x => x.subscriberId === id); }
  function accountById(id) { return db.accounts.find(x => x.id === id); }

  function fullPhone(sub) {
    if (!sub) return '';
    let raw = String(sub.phone || '').replace(/\D/g,'');
    if (raw.startsWith('970') || raw.startsWith('972')) return `+${raw}`;
    raw = raw.replace(/^0+/, '');
    return `${sub.prefix || '+970'}${raw}`;
  }

  function whatsappPhone(sub) { return fullPhone(sub).replace(/\D/g,''); }

  function subscriptionMetrics(s) {
    const start = s.startDate ? new Date(s.startDate) : new Date(s.createdAt || Date.now());
    const end = s.endDate ? new Date(s.endDate) : null;
    const now = new Date();
    const totalDays = end ? Math.max(1, Math.ceil((end - start) / DAY)) : null;
    const usedDays = Math.max(0, Math.floor((now - start) / DAY));
    const remainingDays = end ? Math.max(0, Math.ceil((end - now) / DAY)) : null;
    const expired = !!end && end.getTime() < now.getTime();
    return {start, end, totalDays, usedDays, remainingDays, expired};
  }

  function calcEndDate(startValue, type, durationValue, durationUnit) {
    if (type === 'permanent') return '';
    const d = new Date(startValue || Date.now());
    const amount = Math.max(1, num(durationValue));
    if (durationUnit === 'hour') d.setHours(d.getHours() + amount);
    if (durationUnit === 'day') d.setDate(d.getDate() + amount);
    if (durationUnit === 'week') d.setDate(d.getDate() + amount * 7);
    if (durationUnit === 'month') d.setMonth(d.getMonth() + amount);
    if (durationUnit === 'year') d.setFullYear(d.getFullYear() + amount);
    return d.toISOString();
  }

  function subscriberFinancial(id) {
    const subs = subscriptionsFor(id);
    const charges = subs.reduce((a,s) => a + Math.max(0, num(s.cost) - num(s.discount)), 0);
    const initialPaid = subs.reduce((a,s) => a + num(s.paid), 0);
    const flows = movementsFor(id);
    const collected = flows.filter(m => m.type === 'collect').reduce((a,m) => a + num(m.amount), 0);
    const sent = flows.filter(m => m.type === 'send').reduce((a,m) => a + num(m.amount), 0);
    const effectivePaid = initialPaid + collected - sent;
    const signed = charges - effectivePaid;
    return {charges, initialPaid, collected, sent, effectivePaid, signed, dueToUs:Math.max(0,signed), dueToSubscriber:Math.max(0,-signed)};
  }

  function accountBalance(id) {
    const a = accountById(id);
    if (!a) return 0;
    let balance = num(a.openingBalance);
    db.movements.forEach(m => {
      const amount = num(m.amount);
      if (m.type === 'collect' && m.accountToId === id) balance += amount;
      if (m.type === 'initial_payment' && m.accountToId === id) balance += amount;
      if (m.type === 'send' && m.accountFromId === id) balance -= amount;
      if (m.type === 'account_deposit' && m.accountToId === id) balance += amount;
      if (m.type === 'account_expense' && m.accountFromId === id) balance -= amount;
      if (m.type === 'transfer') {
        if (m.accountFromId === id) balance -= amount;
        if (m.accountToId === id) balance += amount;
      }
    });
    return balance;
  }

  function totalAccountsBalance(type = '') {
    return db.accounts.filter(a => !type || a.type === type).reduce((sum,a) => sum + accountBalance(a.id), 0);
  }

  function routeName(route) {
    const ar = {home:'الرئيسية',subscribers:'المشتركين',subscriber:'ملف المشترك',subscriptions:'الاشتراكات',flows:'التدفقات المالية',accounts:'الحسابات المالية',reports:'التقارير',support:'الدعم الفني',tasks:'المهام',timeline:'السجل الزمني',settings:'الإعدادات',employees:'الموظفون'};
    const en = {home:'Home',subscribers:'Subscribers',subscriber:'Subscriber',subscriptions:'Subscriptions',flows:'Cash Flow',accounts:'Accounts',reports:'Reports',support:'Support',tasks:'Tasks',timeline:'Timeline',settings:'Settings',employees:'Employees'};
    return (db.settings.language === 'en' ? en : ar)[route] || ar.home;
  }

  function navItems() {
    return [
      ['home','home','الرئيسية','Home'],
      ['subscribers','users','المشتركين','Subscribers'],
      ['subscriptions','calendar','الاشتراكات','Subscriptions'],
      ['flows','wallet','التدفقات المالية','Cash Flow'],
      ['accounts','bank','الحسابات المالية','Accounts'],
      ['reports','chart','التقارير','Reports'],
      ['support','chat','الدعم الفني','Support'],
      ['tasks','task','المهام','Tasks'],
      ['timeline','clock','السجل الزمني','Timeline'],
      ['employees','employee','الموظفون','Employees'],
      ['settings','settings','الإعدادات','Settings']
    ].filter(item => can(routePermission(item[0])));
  }

  function labelNav(item) { return db.settings.language === 'en' ? item[3] : item[2]; }

  function getRoute() {
    const hash = location.hash.replace(/^#\/?/, '') || 'home';
    const [page, id] = hash.split('/');
    return {page, id};
  }

  function go(page, id = '') {
    const next = id ? `#/${page}/${id}` : `#/${page}`;
    if (location.hash === next) renderRoute(); else location.hash = next;
    closeDrawer();
  }

  function isLogged() {
    if (!activeSession?.companyId) return false;
    if (activeSession.expiresAt && Date.now() > Number(activeSession.expiresAt)) return false;
    return true;
  }

  function showLogin() {
    $('#loginView').classList.remove('hidden');
    $('#appView').classList.add('hidden');
    let lastKey = localStorage.getItem(LAST_KEY) || activeSession?.companyKey || '';
    if(lastKey==='12345'){localStorage.removeItem(LAST_KEY);lastKey='';}
    $('#companyKeyInput').value = lastKey;
    $('#passwordInput').value = '';
    const note = $('.login-footnote span:last-child');
    if (note) note.textContent = navigator.onLine === false ? 'بدون إنترنت: يمكن الدخول بالمفاتيح التي سبق تسجيلها على هذا الجهاز' : 'الحفظ المحلي والمزامنة التلقائية مفعّلان';
    updateLanguageUI();
  }

  function showApp() {
    $('#loginView').classList.add('hidden');
    $('#appView').classList.remove('hidden');
    updateBranding();
    renderNav();
    if (!location.hash) location.hash = '#/home';
    renderRoute();
    checkAllNotifications();
  }

  async function loginWithCompanyKey(key, pass) {
    const button = $('#loginBtn');
    const original = button?.textContent || 'دخول إلى المنصة';
    if (button) { button.disabled = true; button.textContent = navigator.onLine === false ? 'دخول بدون إنترنت...' : 'جارٍ التحقق...'; }
    try {
      const license = await window.AhmadiCloud.loginCompany(key, pass);
      activeSession = {
        companyId: license.companyId,
        companyKey: license.companyKey,
        companyName: license.companyName || '',
        ownerName: license.ownerName || '',
        status: license.status || 'active',
        expiresAt: license.expiresAt || null,
        actorType: license.actorType || 'owner',
        actorId: license.actorId || license.employeeId || '',
        employeeId: license.employeeId || '',
        actorName: license.actorName || license.ownerName || 'صاحب الحساب',
        permissions: Array.isArray(license.permissions) ? license.permissions : ['*'],
        authHash: license.authHash || '',
        loginAt: new Date().toISOString()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
      localStorage.setItem(LAST_KEY, activeSession.companyKey);
      db = loadDB();
      attachCloudSession();
      if (!license.offline) {
        try { await window.AhmadiCloud.initialSync(); }
        catch (error) { console.warn('Initial sync deferred',error); toast('تم الدخول بنجاح. ستتم محاولة المزامنة تلقائياً عند استقرار الاتصال.','warning'); }
      }
      showApp();
      logAction('login','تسجيل الدخول',license.offline ? 'تم الدخول من النسخة المحلية بدون إنترنت' : 'تم تسجيل الدخول ومزامنة الحساب');
      toast(license.offline ? 'تم الدخول بدون إنترنت. ستتم المزامنة عند عودة الاتصال.' : 'تم تسجيل الدخول ومزامنة الحساب بنجاح.','success');
    } catch (error) {
      toast(error.message || 'تعذر تسجيل الدخول.','error');
    } finally {
      if (button) { button.disabled = false; button.textContent = original; }
    }
  }

  async function resumeCloudSession() {
    if (!isLogged()) return false;
    db = loadDB();
    attachCloudSession();
    showApp();
    if (navigator.onLine !== false && window.AhmadiCloud) {
      try {
        const valid = await window.AhmadiCloud.validateCompany(activeSession);
        if (!valid) {
          toast('تم إيقاف مفتاح الشركة أو انتهت صلاحيته.','error');
          logout(false);
          return false;
        }
        activeSession = {...activeSession, ...valid};
        localStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
        await window.AhmadiCloud.initialSync();
      } catch (error) {
        console.warn('Cloud resume deferred', error);
      }
    }
    return true;
  }

  function updateBranding() {
    ['loginAppName','mobileLoginAppName','headerAppName','drawerAppName'].forEach(id => { const el = $('#'+id); if (el) el.textContent = db.settings.appName; });
    const headerManager = $('#headerManager'); if (headerManager) headerManager.textContent = currentActorName();
  }

  function updateLanguageUI() {
    const en = db.settings.language === 'en';
    document.documentElement.lang = en ? 'en' : 'ar';
    document.documentElement.dir = en ? 'ltr' : 'rtl';
    document.body.dir = en ? 'ltr' : 'rtl';
    $('#langAr')?.classList.toggle('active', !en);
    $('#langEn')?.classList.toggle('active', en);
    if ($('#loginTitle')) $('#loginTitle').textContent = en ? 'Sign in' : 'تسجيل الدخول';
    if ($('#loginSubtitle')) $('#loginSubtitle').textContent = en ? 'Enter the company key and password to access the platform.' : 'أدخل مفتاح الشركة وكلمة المرور للوصول إلى المنصة.';
    if ($('#companyKeyLabel')) $('#companyKeyLabel').textContent = en ? 'Company key' : 'مفتاح الشركة';
    if ($('#passwordLabel')) $('#passwordLabel').textContent = en ? 'Password' : 'كلمة المرور';
    if ($('#companyKeyHint')) $('#companyKeyHint').textContent = en ? 'This key is assigned from the admin console.' : 'يتم إنشاء وإدارة هذا المفتاح من لوحة الأدمن.';
    if ($('#passwordHint')) $('#passwordHint').textContent = en ? 'The session is saved locally on this device.' : 'يتم حفظ جلسة الدخول محلياً على هذا الجهاز.';
    if ($('#loginBtn')) $('#loginBtn').textContent = en ? 'Open platform' : 'دخول إلى المنصة';
    renderNav();
    if (isLogged() && !$('#appView').classList.contains('hidden')) renderRoute();
  }

  function updateCloudStatusUI(state={}) {
    const el=$('#cloudSyncStatus'); if(!el)return;
    const mode=state.mode||'idle';
    el.className=`drawer-sync-status ${mode}`;
    const strong=el.querySelector('strong'),small=el.querySelector('small');
    if(strong)strong.textContent=mode==='offline'?'وضع بدون إنترنت':mode==='syncing'?'جارٍ المزامنة':mode==='error'?'مشكلة في المزامنة':state.pending?'تغييرات معلقة':'متزامن';
    if(small)small.textContent=state.message||(state.pending?`${state.pending} تحديث بانتظار الرفع`:'آخر البيانات محفوظة محلياً وسحابياً');
  }

  function renderNav() {
    const route = getRoute().page;
    const items = navItems();
    const drawer = $('#drawerNav');
    if (drawer) drawer.innerHTML = items.map(it => `<button class="drawer-item ${route === it[0] || (route === 'subscriber' && it[0] === 'subscribers') ? 'active':''}" data-route="${it[0]}" type="button"><span class="nav-icon">${icon(it[1],20)}</span><span>${labelNav(it)}</span></button>`).join('');
    const bottom = $('#bottomNav');
    if (bottom) {
      const primary = items.slice(0,4);
      bottom.innerHTML = primary.map(it => {
        const bottomLabel = it[0] === 'flows' ? (db.settings.language === 'en' ? 'Payments' : 'الدفعات') : labelNav(it);
        return `<button class="bottom-item ${route === it[0] || (route === 'subscriber' && it[0] === 'subscribers') ? 'active':''}" data-route="${it[0]}" type="button"><span class="bottom-icon">${icon(it[1],21)}</span><span>${bottomLabel}</span></button>`;
      }).join('') + `<button class="bottom-item" data-action="open-drawer" type="button"><span class="bottom-icon">${icon('menu',21)}</span><span>${db.settings.language === 'en' ? 'More' : 'المزيد'}</span></button>`;
    }
  }

  function openDrawer() {
    const drawer=$('#drawer'), backdrop=$('#drawerBackdrop');
    if(!drawer||!backdrop)return;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden','false');
    document.body.classList.add('drawer-open');
  }
  function closeDrawer() {
    const drawer=$('#drawer'), backdrop=$('#drawerBackdrop');
    if(drawer){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');}
    if(backdrop)backdrop.classList.remove('open');
    document.body.classList.remove('drawer-open');
  }

  function stripDuplicatePageHeading() {
    const head=$('#mainContent .page > .page-head:first-child');
    if(!head)return;
    const copy=head.querySelector('.page-head-copy');
    if(!copy?.querySelector('h2'))return; // keep subscriber back-navigation headers.
    copy.querySelectorAll('h2,p').forEach(el=>el.remove());
    if(!copy.textContent.trim()&&!copy.querySelector('button,a'))copy.remove();
    const actions=head.querySelector('.head-actions');
    if(!head.querySelector('.page-head-copy')&&(!actions||!actions.children.length))head.remove();
  }

  function renderRoute() {
    closeDrawer();
    if (!isLogged()) return showLogin();
    const {page, id} = getRoute();
    const valid = ['home','subscribers','subscriber','subscriptions','flows','accounts','reports','support','tasks','timeline','employees','settings'];
    let p = valid.includes(page) ? page : 'home';
    if (!can(routePermission(p))) { toast('ليس لديك صلاحية لفتح هذا القسم.','warning'); p = can('home.view') ? 'home' : (navItems()[0]?.[0] || 'home'); if (location.hash !== '#/'+p) history.replaceState(null,'','#/'+p); }
    $('#pageTitle').textContent = routeName(p);
    renderNav();
    if (p === 'home') renderHome();
    if (p === 'subscribers') renderSubscribers();
    if (p === 'subscriber') renderSubscriber(id);
    if (p === 'subscriptions') renderSubscriptions();
    if (p === 'flows') renderFlows();
    if (p === 'accounts') renderAccounts();
    if (p === 'reports') renderReports();
    if (p === 'support') renderSupport();
    if (p === 'tasks') renderTasks();
    if (p === 'timeline') renderTimeline();
    if (p === 'employees') renderEmployees();
    if (p === 'settings') renderSettings();
    stripDuplicatePageHeading();
    syncFloatingSpace();
    enhanceAllSelects($('#mainContent'));
    applyDateDefaults($('#mainContent'));
    window.scrollTo({top:0,behavior:'instant'});
  }

  function toast(message, type = 'info') {
    const root = $('#toastRoot');
    if (!root || !message) return;

    const kind = ['success','error','warning','info'].includes(type) ? type : 'info';
    const english = db?.settings?.language === 'en';
    const meta = {
      success:{title:english?'Done':'تم بنجاح',icon:'check'},
      error:{title:english?'Action failed':'تعذر التنفيذ',icon:'x'},
      warning:{title:english?'Attention':'تنبيه',icon:'alert'},
      info:{title:english?'Notice':'إشعار',icon:'info'}
    }[kind];

    if (toast._timer) clearTimeout(toast._timer);
    const current = root.querySelector('.app-toast');
    if (current) current.remove();

    const el = document.createElement('div');
    el.className = `app-toast ${kind}`;
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    el.setAttribute('aria-live', kind === 'error' ? 'assertive' : 'polite');
    el.innerHTML = `<div class="app-toast-icon">${icon(meta.icon,20)}</div><div class="app-toast-copy"><strong>${meta.title}</strong><span></span></div><button class="app-toast-close" type="button" aria-label="${english?'Close':'إغلاق'}">${icon('x',16)}</button><i class="app-toast-timer" aria-hidden="true"></i>`;
    el.querySelector('.app-toast-copy span').textContent = String(message);
    root.replaceChildren(el);

    let closed = false;
    const dismiss = () => {
      if (closed) return;
      closed = true;
      el.classList.add('leaving');
      setTimeout(() => { if (el.isConnected) el.remove(); }, 220);
    };
    el.querySelector('.app-toast-close').addEventListener('click', dismiss);
    requestAnimationFrame(() => el.classList.add('show'));
    toast._timer = setTimeout(dismiss, 3600);
  }

  function openModal(title, body, footer = '', wide = false) {
    $('#modalRoot').innerHTML = `<div class="modal-overlay" data-action="modal-backdrop"><div class="modal-sheet ${wide ? 'wide-modal':''}" role="dialog" aria-modal="true"><div class="modal-head"><h3>${title}</h3><button class="modal-close" data-action="close-modal" type="button">${icon('x',20)}</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-foot">${footer}</div>`:''}</div></div>`;
    requestAnimationFrame(()=>{enhanceAllSelects($('#modalRoot'));applyDateDefaults($('#modalRoot'));});
  }

  function closeModal() { $('#modalRoot').innerHTML = ''; ui.receiptData = ''; closeSmartSelect(); }

  function closeFabMenus(except = null) {
    $$('.fab-row.open').forEach(row => {
      if (row === except) return;
      row.classList.remove('open');
      row.querySelector('.fab-launcher')?.setAttribute('aria-expanded','false');
    });
  }

  function enhanceFabRow(row) {
    if (!row || row.dataset.fabEnhanced === '1') return;
    row.dataset.fabEnhanced = '1';
    row.classList.add('fab-menu');
    const actions = [...row.querySelectorAll(':scope > .fab')];
    actions.forEach((button, index) => {
      button.classList.add('fab-menu-action');
      button.style.setProperty('--fab-order', String(index));
      if (!button.getAttribute('aria-label')) {
        const label = button.textContent.trim();
        if (label) button.setAttribute('aria-label', label);
      }
    });
    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'fab-launcher';
    launcher.dataset.action = 'toggle-fab-menu';
    launcher.setAttribute('aria-label','الإجراءات');
    launcher.setAttribute('aria-expanded','false');
    launcher.innerHTML = icon('plus',25);
    row.prepend(launcher);
  }

  function syncFloatingSpace() {
    const main = $('#mainContent');
    if (!main) return;
    const rows = [...main.querySelectorAll('.fab-row')];
    main.classList.toggle('has-fab', rows.length > 0);

    // Keep the launcher physically on the LEFT even in RTL Android WebViews.
    rows.forEach(row => {
      enhanceFabRow(row);
      row.style.setProperty('left', window.innerWidth <= 680 ? '6px' : '8px', 'important');
      row.style.setProperty('right', 'auto', 'important');
      row.style.setProperty('top', 'auto', 'important');
      row.style.setProperty('inset-inline-start', 'auto', 'important');
      row.style.setProperty('inset-inline-end', 'auto', 'important');
      row.style.setProperty('direction', 'ltr', 'important');
      row.querySelectorAll('.fab,.fab-launcher').forEach(button => button.style.setProperty('direction','rtl'));
    });
  }

  let activeSelectUi = null;

  function enhanceAllSelects(root=document) {
    if (!root) return;
    root.querySelectorAll('select:not(.smart-select-ready)').forEach(enhanceSelect);
  }

  function enhanceSelect(select) {
    if (!select || select.classList.contains('smart-select-ready')) return;
    select.classList.add('smart-select-ready');
    const trigger=document.createElement('button');
    trigger.type='button';
    trigger.className='smart-select-trigger';
    trigger.setAttribute('aria-haspopup','listbox');
    trigger.innerHTML=`<span class="smart-select-value"></span><span class="smart-select-chevron"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>`;
    select.insertAdjacentElement('afterend',trigger);
    const sync=()=>{
      const opt=select.options[select.selectedIndex];
      trigger.querySelector('.smart-select-value').textContent=opt?.textContent?.trim()||'اختر من القائمة';
      trigger.classList.toggle('placeholder',!select.value);
      trigger.disabled=!!select.disabled;
    };
    sync();
    select.addEventListener('change',sync);
    select.addEventListener('input',sync);
    trigger.addEventListener('click',()=>openSmartSelect(select,trigger));
  }

  function positionSmartSelect(popover, trigger){
    const rect=trigger.getBoundingClientRect();
    const margin=9;
    const width=Math.min(Math.max(190,rect.width),Math.min(430,window.innerWidth-margin*2));
    popover.style.width=`${width}px`;
    const measured=Math.min(popover.scrollHeight||360,Math.min(420,window.innerHeight-margin*2));
    let top=rect.bottom+6;
    if(top+measured>window.innerHeight-margin && rect.top>measured+margin) top=rect.top-measured-6;
    top=Math.max(margin,Math.min(top,window.innerHeight-Math.min(measured,window.innerHeight-margin*2)-margin));
    let left=rect.right-width;
    left=Math.max(margin,Math.min(left,window.innerWidth-width-margin));
    popover.style.top=`${top}px`;popover.style.left=`${left}px`;
  }

  function openSmartSelect(select,trigger) {
    closeSmartSelect();
    if(!select||select.disabled)return;
    const options=[...select.options].map((o,index)=>({index,value:o.value,label:o.textContent.trim(),disabled:o.disabled,selected:o.selected,hidden:o.hidden})).filter(x=>!x.hidden);
    const label=select.closest('.field')?.querySelector('label')?.textContent?.trim() || select.getAttribute('aria-label') || 'اختر من القائمة';
    const backdrop=document.createElement('div');backdrop.className='smart-select-backdrop';
    const pop=document.createElement('div');pop.id='smartSelectRoot';pop.className='smart-select-popover';pop.setAttribute('role','listbox');
    pop.innerHTML=`<div class="smart-select-popover-head"><strong>${esc(label)}</strong><span>${options.length} خيار</span></div><div class="smart-select-search compact">${icon('search',17)}<input type="search" autocomplete="off" placeholder="ابحث داخل القائمة..." aria-label="بحث داخل القائمة"></div><div class="smart-select-list"></div>`;
    document.body.append(backdrop,pop);document.body.classList.add('select-sheet-open');
    activeSelectUi={select,trigger,pop,backdrop};
    const list=pop.querySelector('.smart-select-list'),search=pop.querySelector('input');
    const draw=()=>{
      const q=(search.value||'').trim().toLocaleLowerCase('ar');
      const filtered=options.filter(o=>!q||o.label.toLocaleLowerCase('ar').includes(q));
      const selected=filtered.filter(o=>o.selected),rest=filtered.filter(o=>!o.selected);
      const rows=[...selected,...rest].slice(0,180);
      list.innerHTML=rows.length?rows.map(o=>`<button type="button" class="smart-select-option ${o.selected?'selected':''}" data-option-index="${o.index}" role="option" aria-selected="${o.selected?'true':'false'}" ${o.disabled?'disabled':''}><span>${esc(o.label||'—')}</span><span class="smart-select-check">${o.selected?icon('check',16):''}</span></button>`).join(''):`<div class="smart-select-empty">لا توجد خيارات مطابقة</div>`;
      if(filtered.length>rows.length)list.insertAdjacentHTML('beforeend',`<div class="smart-select-empty small">اكتب جزءاً من الاسم للوصول إلى ${filtered.length-rows.length} خيار إضافي</div>`);
    };
    draw();
    backdrop.addEventListener('pointerdown',closeSmartSelect);
    pop.addEventListener('pointerdown',e=>e.stopPropagation());
    list.addEventListener('click',e=>{
      const btn=e.target.closest('[data-option-index]');if(!btn||btn.disabled)return;
      const opt=select.options[Number(btn.dataset.optionIndex)];if(!opt)return;
      select.selectedIndex=Number(btn.dataset.optionIndex);
      select.dispatchEvent(new Event('input',{bubbles:true}));
      select.dispatchEvent(new Event('change',{bubbles:true}));
      closeSmartSelect();
      trigger.focus({preventScroll:true});
    });
    search.addEventListener('input',draw);
    positionSmartSelect(pop,trigger);
    requestAnimationFrame(()=>{positionSmartSelect(pop,trigger);try{search.focus({preventScroll:true})}catch(_){}});
  }

  function closeSmartSelect() {
    activeSelectUi?.pop?.remove();activeSelectUi?.backdrop?.remove();activeSelectUi=null;
    document.body.classList.remove('select-sheet-open');
  }

  function emptyState(iconName, title, text) {
    return `<div class="empty-state"><div class="soft-icon teal">${icon(iconName,24)}</div><strong>${title}</strong><p>${text}</p></div>`;
  }

  function statCard(label, value, note, iconName, tone = 'teal') {
    return `<div class="stat-card"><div class="stat-top"><div><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div><div class="stat-icon ${tone}">${icon(iconName,23)}</div></div><div class="stat-note">${note}</div></div>`;
  }

  function field(label, id, type = 'text', value = '', placeholder = '', hint = '', attrs = '') {
    return `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${attrs}>${hint ? `<small>${hint}</small>`:''}</div>`;
  }

  function selectField(label, id, options, value = '', hint = '', attrs = '') {
    const opts = options.map(o => Array.isArray(o) ? `<option value="${esc(o[0])}" ${String(o[0])===String(value)?'selected':''}>${esc(o[1])}</option>` : `<option value="${esc(o)}" ${String(o)===String(value)?'selected':''}>${esc(o)}</option>`).join('');
    return `<div class="field"><label for="${id}">${label}</label><select id="${id}" name="${id}" ${attrs}>${opts}</select>${hint ? `<small>${hint}</small>`:''}</div>`;
  }

  function textareaField(label, id, value = '', placeholder = '', hint = '') {
    return `<div class="field"><label for="${id}">${label}</label><textarea id="${id}" name="${id}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>${hint?`<small>${hint}</small>`:''}</div>`;
  }

  function inRange(value, filter='all', from='', to='') {
    if (filter==='all') return true;
    const d=new Date(value); if(Number.isNaN(d.getTime())) return false;
    const now=new Date();
    if(filter==='today') return d.toDateString()===now.toDateString();
    if(filter==='week'){const start=new Date(now);start.setHours(0,0,0,0);start.setDate(now.getDate()-((now.getDay()+6)%7));const end=new Date(start);end.setDate(start.getDate()+7);return d>=start&&d<end;}
    if(filter==='month') return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
    if(filter==='year') return d.getFullYear()===now.getFullYear();
    if(filter==='custom'){const f=from?new Date(from+'T00:00:00'):null;const t=to?new Date(to+'T23:59:59'):null;return(!f||d>=f)&&(!t||d<=t);}
    return true;
  }

  function scopeFinancialForSubscriber(id, filter=ui.homeDateFilter, from=ui.homeFrom, to=ui.homeTo) {
    const plans=subscriptionsFor(id).filter(x=>inRange(x.createdAt||x.startDate,filter,from,to));
    const moves=movementsFor(id).filter(x=>inRange(x.date||x.createdAt,filter,from,to));
    const gross=plans.reduce((a,x)=>a+num(x.cost),0);
    const discounts=plans.reduce((a,x)=>a+num(x.discount),0);
    const initial=plans.reduce((a,x)=>a+num(x.paid),0);
    const collected=moves.filter(x=>x.type==='collect').reduce((a,x)=>a+num(x.amount),0);
    const sent=moves.filter(x=>x.type==='send').reduce((a,x)=>a+num(x.amount),0);
    const signed=(gross-discounts)-(initial+collected-sent);
    return {gross,discounts,initial,collected,sent,signed,dueToUs:Math.max(0,signed),dueToSubscriber:Math.max(0,-signed)};
  }

  function homeMetricRow(label,value,kind,tone='teal') {
    return `<button class="dash-metric" data-action="home-metric" data-kind="${kind}" type="button"><span>${label}</span><strong class="${tone==='debt'?'amount-debt':tone==='credit'?'amount-credit':''}">${value}</strong>${icon('chevron',16)}</button>`;
  }

  function renderHome() {
    const f=ui.homeDateFilter,from=ui.homeFrom,to=ui.homeTo;
    const scopedSubs=db.subscribers.filter(x=>inRange(x.createdAt,f,from,to));
    const scopedPlans=db.subscriptions.filter(x=>inRange(x.createdAt||x.startDate,f,from,to));
    const scopedMoves=db.movements.filter(x=>inRange(x.date||x.createdAt,f,from,to));
    const permanent=scopedPlans.filter(x=>x.type==='permanent').length;
    const temporary=scopedPlans.filter(x=>x.type==='temporary').length;
    const trial=scopedPlans.filter(x=>x.type==='trial').length;
    const frozen=scopedPlans.filter(x=>x.frozen).length;
    const warningDays=Math.max(1,num(db.settings.expiryWarningDays)||7);
    const expiring=scopedPlans.filter(x=>!x.frozen&&x.type!=='permanent'&&!subscriptionMetrics(x).expired&&subscriptionMetrics(x).remainingDays<=warningDays).length;
    const grossCost=scopedPlans.reduce((a,x)=>a+num(x.cost),0);
    const discounts=scopedPlans.reduce((a,x)=>a+num(x.discount),0);
    const collected=scopedPlans.reduce((a,x)=>a+num(x.paid),0)+scopedMoves.filter(x=>x.type==='collect').reduce((a,x)=>a+num(x.amount),0);
    const totalDue=db.subscribers.reduce((a,x)=>a+scopeFinancialForSubscriber(x.id,f,from,to).dueToUs,0);
    const totalCredit=db.subscribers.reduce((a,x)=>a+scopeFinancialForSubscriber(x.id,f,from,to).dueToSubscriber,0);
    const expenses=scopedMoves.filter(x=>x.type==='account_expense').reduce((a,x)=>a+num(x.amount),0);
    const equity=grossCost-discounts-expenses;
    const netCash=grossCost-discounts-totalDue-expenses;
    const totalBal=totalAccountsBalance(),cashBal=totalAccountsBalance('cash'),bankBal=totalAccountsBalance('bank');
    $('#mainContent').innerHTML = `
      <div class="page home-dashboard">
        <section class="welcome-strip">
          <div><small>أهلاً بك في منصة الأحمدي</small><h1>${esc(currentActorName())}</h1><p>ملخص سريع لأعمال المنصة حسب الفترة المحددة.</p></div>
          <span class="welcome-icon">${icon('bolt',27,2)}</span>
        </section>
        <section class="home-filter-card">
          <div class="section-title compact"><div><h3>الفترة الزمنية للملخص</h3><p>تطبق على ملخصات الصفحة الرئيسية</p></div></div>
          <div class="filter-chips" id="homeDateChips">${dateFilterChips(f)}</div>
          <div id="homeCustomRange" class="custom-range ${f==='custom'?'':'hidden'}"><label class="date-field">${icon('calendar',18)}<input id="homeFrom" type="date" value="${esc(from)}" aria-label="من"></label><label class="date-field">${icon('calendar',18)}<input id="homeTo" type="date" value="${esc(to)}" aria-label="إلى"></label></div>
        </section>

        <details class="dashboard-fold" open>
          <summary><span class="fold-icon teal">${icon('bolt',21)}</span><span><strong>إجراءات سريعة</strong><small>الأوامر المستخدمة يومياً</small></span><i>${icon('chevron',18)}</i></summary>
          <div class="fold-body"><div class="quick-action-grid">
            <button data-action="add-subscriber">${icon('users',20)}<span>إضافة مشترك</span></button>
            <button data-action="add-subscription">${icon('receipt',20)}<span>إضافة اشتراك</span></button>
            <button data-action="follow-subscriptions">${icon('clock',20)}<span>متابعة اشتراك</span></button>
            <button data-action="collect-payment">${icon('download',20)}<span>إيداع دفعة</span></button>
            <button data-action="send-payment">${icon('upload',20)}<span>إرسال دفعة</span></button>
            <button data-action="quick-expense">${icon('wallet',20)}<span>إضافة مصروف</span></button>
            <button data-action="transfer-account">${icon('transfer',20)}<span>تحويل بين الحسابات</span></button>
            <button data-action="open-inquiry">${icon('message',20)}<span>رسالة استعلامية</span></button>
          </div></div>
        </details>

        <details class="dashboard-fold">
          <summary><span class="fold-icon blue">${icon('users',21)}</span><span><strong>ملخص المشتركين</strong><small>الأعداد والحالات ضمن الفترة</small></span><i>${icon('chevron',18)}</i></summary>
          <div class="fold-body metric-list">
            ${homeMetricRow('عدد المشتركين',scopedSubs.length,'subscribers')}
            ${homeMetricRow('عدد الاشتراكات',scopedPlans.length,'subscriptions')}
            ${homeMetricRow('الاشتراكات الدائمة',permanent,'permanent')}
            ${homeMetricRow('الاشتراكات المؤقتة',temporary,'temporary')}
            ${homeMetricRow('الاشتراكات التجريبية',trial,'trial')}
            ${homeMetricRow(`على وشك الانتهاء خلال ${warningDays} يوم`,expiring,'expiring','debt')}
            ${homeMetricRow('الاشتراكات المجمدة',frozen,'frozen')}
          </div>
        </details>

        <details class="dashboard-fold">
          <summary><span class="fold-icon amber">${icon('wallet',21)}</span><span><strong>ملخص قائمة التدفقات النقدية</strong><small>التكلفة والتحصيل والاستحقاقات والمصروفات</small></span><i>${icon('chevron',18)}</i></summary>
          <div class="fold-body metric-list">
            ${homeMetricRow('إجمالي تكلفة الاشتراكات',money(grossCost),'gross')}
            ${homeMetricRow('إجمالي المبالغ المحصلة',money(collected),'collected','credit')}
            ${homeMetricRow('إجمالي المبالغ المستحقة على المشتركين',money(totalDue),'debtors','debt')}
            ${homeMetricRow('إجمالي المبالغ المستحقة للمشتركين',money(totalCredit),'creditors','credit')}
            ${homeMetricRow('إجمالي المصروفات',money(expenses),'expenses','debt')}
            ${homeMetricRow('حقوق الملكية',money(equity),'equity')}
            ${homeMetricRow('إجمالي الخصومات',money(discounts),'discounts')}
            ${homeMetricRow('صافي التدفق النقدي',money(netCash),'netcash')}
          </div>
        </details>

        <details class="dashboard-fold">
          <summary><span class="fold-icon violet">${icon('bank',21)}</span><span><strong>ملخص الحسابات المالية</strong><small>الأرصدة الحالية والحركات المرتبطة</small></span><i>${icon('chevron',18)}</i></summary>
          <div class="fold-body metric-list">
            ${homeMetricRow('إجمالي الأرصدة الكلية',money(totalBal),'balances')}
            ${homeMetricRow('إجمالي الأرصدة النقدية',money(cashBal),'cashBalances')}
            ${homeMetricRow('إجمالي الأرصدة البنكية',money(bankBal),'bankBalances')}
          </div>
        </details>
      </div>`;
    $('#homeDateChips').addEventListener('click',e=>{const b=e.target.closest('[data-date-filter]');if(!b)return;ui.homeDateFilter=b.dataset.dateFilter;renderHome();});
    $('#homeFrom')?.addEventListener('change',e=>{ui.homeFrom=e.target.value;renderHome();});
    $('#homeTo')?.addEventListener('change',e=>{ui.homeTo=e.target.value;renderHome();});
  }

  function renderSubscribers() {
    $('#mainContent').innerHTML = `
      <div class="page">
        <div class="page-head has-mobile-fab"><div class="page-head-copy"><h2>المشتركون</h2><p>${db.subscribers.length} مشترك مسجل</p></div><div class="head-actions"><button class="secondary-button" data-action="add-subscriber">${icon('plus',18)} إضافة مشترك</button></div></div>
        <div class="search-panel">
          <div class="search-box">${icon('search',20)}<input id="subscriberSearch" placeholder="بحث بالاسم أو رقم الهاتف أو المبلغ..."></div>
          <div class="filter-inline"><select id="subscriberBalanceFilter"><option value="all">كل الحالات</option><option value="debt">عليه مبلغ</option><option value="credit">له مبلغ</option><option value="clear">بدون استحقاق</option></select></div>
        </div>
        <div id="subscriberList" class="list"></div>
        <div class="fab-row"><button class="fab" data-action="add-subscriber">${icon('plus',20)}<span>إضافة مشترك</span></button></div>
      </div>`;
    const refresh = () => {
      const q = ($('#subscriberSearch')?.value || '').trim().toLowerCase();
      const f = $('#subscriberBalanceFilter')?.value || 'all';
      const list = db.subscribers.filter(s => {
        const fin = subscriberFinancial(s.id);
        const hay = `${s.name} ${fullPhone(s)} ${fin.signed} ${Math.abs(fin.signed)}`.toLowerCase();
        const matches = !q || hay.includes(q);
        const status = fin.signed > .009 ? 'debt' : fin.signed < -.009 ? 'credit' : 'clear';
        return matches && (f === 'all' || f === status);
      });
      $('#subscriberList').innerHTML = list.length ? list.map(subscriberCard).join('') : emptyState('users','لا توجد نتائج','أضف مشتركاً جديداً أو غيّر كلمات البحث والفلترة.');
    };
    $('#subscriberSearch').addEventListener('input', refresh);
    $('#subscriberBalanceFilter').addEventListener('change', refresh);
    refresh();
  }

  function subscriberCard(s) {
    const fin = subscriberFinancial(s.id);
    const initial = esc((s.name || '?').trim().charAt(0));
    const balanceClass = fin.signed > .009 ? 'amount-debt' : fin.signed < -.009 ? 'amount-credit' : 'amount-neutral';
    const balanceLabel = fin.signed > .009 ? 'مستحق عليه' : fin.signed < -.009 ? 'مستحق له' : 'الحساب متوازن';
    return `<article class="list-card clickable" data-action="open-subscriber" data-id="${s.id}">
      <div class="person-card">
        <div class="avatar">${initial}</div>
        <div class="person-info"><strong>${esc(s.name)}</strong><small dir="ltr">${esc(fullPhone(s))}</small><small>${subscriptionsFor(s.id).length} اشتراك</small></div>
        <div class="person-balance"><div class="balance-value ${balanceClass}">${money(Math.abs(fin.signed))}</div><div class="balance-label">${balanceLabel}</div></div>
      </div>
      <div class="card-actions">
        <button class="mini-action teal" data-action="call-subscriber" data-id="${s.id}" title="اتصال">${icon('phone',17)}</button>
        <button class="mini-action teal" data-action="wa-subscriber" data-id="${s.id}" title="واتساب">${icon('message',17)}</button>
        <button class="mini-action" data-action="message-subscriber" data-id="${s.id}" title="إرسال رسالة">${icon('send',17)}</button>
        <span class="card-spacer"></span>
        <span style="color:#a1abb2">${icon('chevron',18)}</span>
      </div>
    </article>`;
  }

  function openAddSubscriber() {
    openModal('إضافة مشترك', `
      <form id="subscriberForm" class="form-grid">
        <div class="full">${field('اسم المشترك','subName','text','','مثال: أحمد محمد','اكتب الاسم كما سيظهر في الرسائل.','required')}</div>
        ${selectField('مقدمة الهاتف','subPrefix',[['+970','+970'],['+972','+972']],'+970','يمكن التبديل بين المقدمتين.')}
        ${field('رقم هاتف المشترك','subPhone','tel','','0590000000','أدخل الرقم بدون مقدمة الدولة.','required inputmode="tel"')}
        <div class="full">${field('العنوان','subAddress','text','','مثال: غزة - الرمال','عنوان مختصر للمشترك.')}</div>
        <div class="full">${textareaField('الملاحظات','subNotes','','اكتب أي ملاحظة خاصة بالمشترك...','هذه الملاحظات داخلية ولا تظهر تلقائياً في الرسائل.')}</div>
      </form>`, `<button class="ghost-button" data-action="close-modal" type="button">إلغاء</button><button class="primary-button" data-action="save-subscriber" type="button">${icon('save',18)} حفظ المشترك</button>`);
  }

  function saveSubscriber() {
    const name = $('#subName')?.value.trim();
    const phone = $('#subPhone')?.value.trim();
    if (!name || !phone) return toast('أدخل اسم المشترك ورقم الهاتف.','error');
    const sub = {id:uid('sub'), name, prefix:$('#subPrefix').value, phone, address:$('#subAddress').value.trim(), notes:$('#subNotes').value.trim(), createdAt:new Date().toISOString()};
    db.subscribers.push(sub); saveDB(); logAction('subscriber','إضافة مشترك',`تمت إضافة المشترك ${name}`,sub.id); closeModal(); toast('تم حفظ المشترك.','success'); renderRoute();
  }

  function renderSubscriber(id) {
    const s = subscriberById(id);
    if (!s) return go('subscribers');
    const fin = subscriberFinancial(id);
    const subs = subscriptionsFor(id);
    const latest = [...subs].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0];
    const m = latest ? subscriptionMetrics(latest) : null;
    const tabs = [
      ['overview','نظرة عامة'],['subscriptions','تفاصيل الاشتراك'],['movements','الحركات المالية']
    ];
    $('#mainContent').innerHTML = `
      <div class="page">
        <div class="page-head"><div class="page-head-copy"><button class="ghost-button" data-route="subscribers">${icon('arrow',17)} العودة للمشتركين</button></div><div class="head-actions"><button class="secondary-button" data-action="add-subscription" data-subscriber="${s.id}">${icon('plus',17)} إضافة اشتراك</button></div></div>
        <section class="profile-head">
          <div class="avatar">${esc(s.name.charAt(0))}</div>
          <div class="profile-copy"><span class="meta">ملف المشترك</span><h2>${esc(s.name)}</h2><p dir="ltr">${esc(fullPhone(s))}</p></div>
          <div class="profile-actions"><button class="mini-action teal" data-action="call-subscriber" data-id="${s.id}">${icon('phone',18)}</button><button class="mini-action teal" data-action="wa-subscriber" data-id="${s.id}">${icon('message',18)}</button><button class="mini-action" data-action="message-subscriber" data-id="${s.id}">${icon('send',18)}</button></div>
        </section>
        <div class="tabs">${tabs.map(t=>`<button class="tab ${ui.currentSubscriberTab===t[0]?'active':''}" data-action="subscriber-tab" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>
        <div id="subscriberTabBody"></div>
      </div>`;
    const body = $('#subscriberTabBody');
    if (ui.currentSubscriberTab === 'overview') {
      body.innerHTML = `<div class="page">
        <div class="info-grid">
          <section class="info-card">
            <div class="info-card-title"><span class="soft-icon teal">${icon('users',21)}</span><strong>بيانات المشترك</strong></div>
            <div class="data-rows">
              <div class="data-row"><span>اسم المشترك</span><b>${esc(s.name)}</b></div>
              <div class="data-row"><span>رقم الهاتف</span><b dir="ltr">${esc(fullPhone(s))}</b></div>
              <div class="data-row"><span>العنوان</span><b>${esc(s.address || '—')}</b></div>
              <div class="data-row"><span>مستحق عليه</span><b class="amount-debt">${money(fin.dueToUs)}</b></div>
              <div class="data-row"><span>مستحق له</span><b class="amount-credit">${money(fin.dueToSubscriber)}</b></div>
              <div class="data-row"><span>الملاحظات</span><b>${esc(s.notes || '—')}</b></div>
            </div>
          </section>
          <section class="mini-stats">
            <div class="mini-stat"><span class="soft-icon violet">${icon('receipt',20)}</span><span>نوع الاشتراك</span><strong>${latest ? subscriptionTypeLabel(latest.type) : '—'}</strong></div>
            <div class="mini-stat"><span class="soft-icon blue">${icon('calendar',20)}</span><span>فترة الاشتراك</span><strong>${latest ? (latest.type==='permanent'?'دائم':`${fmtDate(latest.startDate)} - ${fmtDate(latest.endDate)}`) : '—'}</strong></div>
            <div class="mini-stat"><span class="soft-icon teal">${icon('clock',20)}</span><span>الفترة المتبقية</span><strong>${m ? (m.remainingDays===null?'دائم':`${m.remainingDays} يوم`) : '—'}</strong></div>
            <div class="mini-stat"><span class="soft-icon amber">${icon('dollar',20)}</span><span>إجمالي التكلفة</span><strong>${money(fin.charges)}</strong></div>
            <div class="mini-stat"><span class="soft-icon teal">${icon('wallet',20)}</span><span>إجمالي المدفوع</span><strong>${money(fin.effectivePaid)}</strong></div>
            <div class="mini-stat"><span class="soft-icon red">${icon('dollar',20)}</span><span>إجمالي المتبقي</span><strong>${money(Math.abs(fin.signed))}</strong></div>
          </section>
        </div>
      </div>`;
    } else if (ui.currentSubscriberTab === 'subscriptions') {
      body.innerHTML = `<div class="section-title"><div><h3>اشتراكات ${esc(s.name)}</h3><p>تفاصيل الاشتراكات الحالية والسابقة</p></div><button class="secondary-button" data-action="add-subscription" data-subscriber="${s.id}">${icon('plus',17)} إضافة اشتراك</button></div><div class="list">${subs.length ? [...subs].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(subscriptionCard).join('') : emptyState('receipt','لا توجد اشتراكات','أضف أول اشتراك لهذا المشترك.')}</div>`;
    } else {
      const mv = subscriberMovementFeed(s.id);
      body.innerHTML = `<div class="section-title"><div><h3>الحركات المالية</h3><p>اشتراكات ودفعات وخصومات وإرسال أموال</p></div></div><div class="list">${mv.length ? mv.map(movementCard).join('') : emptyState('wallet','لا توجد حركات','ستظهر هنا كل حركة مالية تخص هذا المشترك.')}</div>`;
    }
  }

  function subscriberMovementFeed(id) {
    const out = [];
    subscriptionsFor(id).forEach(s => {
      out.push({id:`sub_${s.id}`,type:'subscription',amount:num(s.cost),title:`إضافة اشتراك: ${s.networkName || 'اشتراك'}`,detail:`${subscriptionTypeLabel(s.type)} • ${fmtDate(s.startDate)}`,date:s.createdAt || s.startDate});
      if (num(s.discount)>0) out.push({id:`disc_${s.id}`,type:'discount',amount:num(s.discount),title:'خصم على الاشتراك',detail:s.networkName || '',date:s.createdAt || s.startDate});
      if (num(s.paid)>0) out.push({id:`paid_${s.id}`,type:'initial_payment',amount:num(s.paid),title:'دفعة عند إنشاء الاشتراك',detail:s.networkName || '',date:s.createdAt || s.startDate});
    });
    movementsFor(id).filter(m=>!['initial_payment','discount'].includes(m.type)).forEach(m=>out.push({...m,date:m.date || m.createdAt}));
    return out.sort((a,b)=>new Date(b.date)-new Date(a.date));
  }

  function subscriptionTypeLabel(type) {
    return ({permanent:'دائم',temporary:'مؤقت',trial:'تجريبي'})[type] || type || '—';
  }
  function durationUnitLabel(unit, n=1) {
    const map = {hour:'ساعة',day:'يوم',week:'أسبوع',month:'شهر',year:'سنة'};
    return map[unit] || unit || '';
  }
  function subscriptionStatus(s) {
    if (s.frozen) return ['مجمد','status-frozen'];
    if (s.type === 'permanent') return ['دائم','status-permanent'];
    const m = subscriptionMetrics(s);
    return m.expired ? ['منتهي','status-expired'] : ['فعال','status-active'];
  }
  function subscriptionCard(s) {
    const sub = subscriberById(s.subscriberId);
    const metrics = subscriptionMetrics(s);
    const status = subscriptionStatus(s);
    const remaining = Math.max(0, num(s.cost)-num(s.discount)-num(s.paid));
    return `<article class="list-card">
      <div class="subscription-card">
        <div class="soft-icon ${s.type==='trial'?'amber':s.type==='permanent'?'violet':'blue'}">${icon('receipt',22)}</div>
        <div class="subscription-main">
          <strong>${esc(s.networkName || 'اشتراك')}</strong>
          <small>${esc(sub?.name || 'مشترك محذوف')} • ${esc(s.managerName || '—')}</small>
          <div class="subscription-meta">
            <span class="status-pill ${status[1]}">${status[0]}</span>
            <span class="meta-pill">${subscriptionTypeLabel(s.type)}</span>
            <span class="meta-pill">${s.type==='permanent'?'بدون انتهاء':`متبقي ${metrics.remainingDays} يوم`}</span>
            <span class="meta-pill">${money(remaining)} متبقي أولي</span>
          </div>
        </div>
        <button class="mini-action" data-action="subscription-message" data-id="${s.id}" title="إرسال التفاصيل">${icon('send',17)}</button>
      </div>
    </article>`;
  }

  function renderSubscriptions() {
    const total = db.subscriptions.reduce((a,s)=>a+Math.max(0,num(s.cost)-num(s.discount)),0);
    const paid = db.subscriptions.reduce((a,s)=>a+num(s.paid),0) + db.movements.filter(m=>m.type==='collect').reduce((a,m)=>a+num(m.amount),0);
    $('#mainContent').innerHTML = `
      <div class="page">
        <div class="page-head has-mobile-fab"><div class="page-head-copy"><h2>الاشتراكات</h2><p>إدارة الاشتراكات الدائمة والمؤقتة والتجريبية</p></div><div class="head-actions"><button class="secondary-button" data-action="add-subscription">${icon('plus',17)} إضافة اشتراك</button></div></div>
        <section class="stats-grid">
          ${statCard('إجمالي القيمة',money(total),'بعد الخصومات','receipt','blue')}
          ${statCard('الاشتراكات',db.subscriptions.length.toLocaleString('en-US'),'اشتراك مسجل','calendar','violet')}
          ${statCard('المشتركون',new Set(db.subscriptions.map(s=>s.subscriberId)).size.toLocaleString('en-US'),'مشترك لديه اشتراك','users','teal')}
          ${statCard('إجمالي المدفوع',money(paid),'دفعات أولية وتحصيل','wallet','teal')}
        </section>
        <div class="search-panel">
          <div class="search-box">${icon('search',20)}<input id="subscriptionSearch" placeholder="بحث باسم المشترك أو الهاتف أو اسم الشبكة..."></div>
          <div class="filter-inline"><input id="subscriptionDate" type="date" value="${dateOnlyInput()}" aria-label="التاريخ"><select id="subscriptionTypeFilter"><option value="all">كل الأنواع</option><option value="permanent">دائم</option><option value="temporary">مؤقت</option><option value="trial">تجريبي</option></select></div>
        </div>
        <div id="subscriptionList" class="list"></div>
        <div class="fab-row"><button class="fab" data-action="add-subscription">${icon('plus',20)}<span>إضافة اشتراك</span></button></div>
      </div>`;
    const refresh = () => {
      const q = ($('#subscriptionSearch')?.value||'').trim().toLowerCase();
      const date = $('#subscriptionDate')?.value || '';
      const type = $('#subscriptionTypeFilter')?.value || 'all';
      const list = db.subscriptions.filter(s => {
        const sub = subscriberById(s.subscriberId);
        const hay = `${sub?.name||''} ${fullPhone(sub)} ${s.networkName||''} ${s.managerName||''}`.toLowerCase();
        const dateHit = !date || String(s.startDate||'').slice(0,10)===date || String(s.endDate||'').slice(0,10)===date;
        return (!q || hay.includes(q)) && dateHit && (type==='all'||s.type===type);
      }).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
      $('#subscriptionList').innerHTML = list.length ? list.map(subscriptionCard).join('') : emptyState('receipt','لا توجد اشتراكات','أضف اشتراكاً جديداً أو غيّر الفلترة.');
    };
    $('#subscriptionSearch').addEventListener('input',refresh);
    $('#subscriptionDate').addEventListener('change',refresh);
    $('#subscriptionTypeFilter').addEventListener('change',refresh);
    refresh();
  }

  function subscriberOptions(selected='') {
    if (!db.subscribers.length) return '<option value="">لا يوجد مشتركون - أضف مشتركاً أولاً</option>';
    return `<option value="">اختر المشترك</option>` + db.subscribers.map(s=>`<option value="${s.id}" ${s.id===selected?'selected':''}>${esc(s.name)} — ${esc(fullPhone(s))}</option>`).join('');
  }
  function financialAccounts() {
    if (!Array.isArray(db.accounts)) db.accounts = db.accounts && typeof db.accounts === 'object' ? Object.values(db.accounts) : [];
    return db.accounts.filter(a => a && a.id && a.name);
  }
  function accountOptions(selected='', emptyLabel='اختر الحساب') {
    const accounts = financialAccounts();
    if (!accounts.length) return '<option value="">لا توجد حسابات مالية مضافة</option>';
    return `<option value="">${emptyLabel}</option>` + accounts.map(a=>`<option value="${a.id}" ${String(a.id)===String(selected)?'selected':''}>${esc(a.name)} — ${money(accountBalance(a.id))}</option>`).join('');
  }

  function openAddSubscription(preselected='') {
    if (!db.subscribers.length) { toast('أضف مشتركاً أولاً قبل إنشاء الاشتراك.','error'); return go('subscribers'); }
    const start = nowLocalInput();
    openModal('إضافة اشتراك', `
      <form id="subscriptionForm" class="form-grid">
        <div class="full"><div class="field"><label for="subSubscriberId">اسم المشترك</label><select id="subSubscriberId" required>${subscriberOptions(preselected)}</select><small>يتم الاختيار من المشتركين المضافين مسبقاً.</small></div></div>
        ${field('اسم الاشتراك (الشبكة)','networkName','text','','مثال: شبكة أحمد','اسم الشبكة أو المنصة الخاصة بهذا الاشتراك.','required')}
        ${field('اسم مدير التطبيق','networkManager','text',currentActorName(),'مثال: اسم مدير الشبكة','اسم مدير الشبكة أو التطبيق.','required')}
        ${selectField('نوع الاشتراك','subscriptionType',[['permanent','دائم'],['temporary','مؤقت'],['trial','تجريبي']],'temporary','يتم تحديد فترة للمؤقت والتجريبي.')}
        ${selectField('حالة الاشتراك','subscriptionStatus',[['active','فعال'],['frozen','مجمد']],'active','يمكن تجميد الاشتراك ليظهر ضمن الاشتراكات المجمدة.')}
        ${field('تاريخ بداية الاشتراك','subscriptionStart','datetime-local',start,'','','required')}
        <div id="durationValueWrap">${field('فترة الاشتراك','durationValue','number','1','مثال: 1','اكتب رقم الفترة.','min="1" step="1"')}</div>
        <div id="durationUnitWrap">${selectField('وحدة الفترة','durationUnit',[['hour','ساعة'],['day','يوم'],['week','أسبوع'],['month','شهر'],['year','سنة']],'month','يتم الحساب من تاريخ التسجيل.')}</div>
        ${field('تكلفة الاشتراك','subscriptionCost','number',String(db.settings.temporaryMonthlyPrice||0),'0.00','بالشيقل.','min="0" step="0.01" inputmode="decimal"')}
        ${field('المبلغ المدفوع','subscriptionPaid','number','0','0.00','المبلغ الذي دفعه المشترك عند إنشاء الاشتراك.','min="0" step="0.01" inputmode="decimal"')}
        ${field('الخصم','subscriptionDiscount','number',String(db.settings.temporaryDiscount||0),'0.00','قيمة الخصم بالشيقل.','min="0" step="0.01" inputmode="decimal"')}
        ${field('المبلغ المتبقي','subscriptionRemaining','text','₪ 0.00','','يحسب تلقائياً بعد الخصم والدفع.','readonly')}
        ${field('اسم المستخدم للدخول','subscriptionUsername','text','','مثال: ahmed01','اسم المستخدم لتطبيق المشترك.')}
        ${field('كلمة المرور','subscriptionLoginPassword','text','','مثال: 12345678','كلمة مرور دخول المشترك.')}
        <div class="full"><div class="field"><label for="subscriptionAccount">الحساب المستلم فيه الدفعة</label><select id="subscriptionAccount">${accountOptions('','بدون ربط بحساب')}</select><small>اختياري، ويستخدم فقط لإضافة الدفعة إلى رصيد الحساب المالي.</small></div></div>
        <div class="full"><div id="subscriptionPreview" class="preview-card"></div></div>
      </form>`, `<button class="ghost-button" data-action="close-modal" type="button">إلغاء</button><button class="secondary-button" data-action="save-subscription" data-send="0" type="button">${icon('save',17)} حفظ</button><button class="primary-button" data-action="save-subscription" data-send="1" type="button">${icon('send',17)} حفظ وإرسال</button>`, true);
    const ids = ['subSubscriberId','networkName','networkManager','subscriptionType','subscriptionStatus','subscriptionStart','durationValue','durationUnit','subscriptionCost','subscriptionPaid','subscriptionDiscount','subscriptionUsername','subscriptionLoginPassword'];
    ids.forEach(id=>$('#'+id)?.addEventListener('input',updateSubscriptionPreview));
    ids.forEach(id=>$('#'+id)?.addEventListener('change',updateSubscriptionPreview));
    $('#subscriptionType')?.addEventListener('change',()=>{toggleSubscriptionDuration();applySubscriptionDefaults();updateSubscriptionPreview();});
    toggleSubscriptionDuration(); updateSubscriptionPreview();
  }

  function applySubscriptionDefaults() {
    const type=$('#subscriptionType')?.value;
    if(type==='permanent'){
      if($('#subscriptionCost')) $('#subscriptionCost').value=String(db.settings.permanentPrice||0);
      if($('#subscriptionDiscount')) $('#subscriptionDiscount').value=String(db.settings.permanentDiscount||0);
    } else if(type==='temporary') {
      if($('#subscriptionCost')) $('#subscriptionCost').value=String(db.settings.temporaryMonthlyPrice||0);
      if($('#subscriptionDiscount')) $('#subscriptionDiscount').value=String(db.settings.temporaryDiscount||0);
      if($('#durationValue')) $('#durationValue').value='1';
      if($('#durationUnit')) $('#durationUnit').value='month';
    } else if(type==='trial') {
      if($('#subscriptionCost')) $('#subscriptionCost').value='0';
      if($('#subscriptionDiscount')) $('#subscriptionDiscount').value='0';
      if($('#durationValue')) $('#durationValue').value=String(Math.max(1,num(db.settings.trialDays)||7));
      if($('#durationUnit')) $('#durationUnit').value='day';
    }
    ['subscriptionCost','subscriptionDiscount','durationValue','durationUnit'].forEach(id=>$('#'+id)?.dispatchEvent(new Event('change',{bubbles:true})));
  }

  function toggleSubscriptionDuration() {
    const permanent = $('#subscriptionType')?.value === 'permanent';
    $('#durationValueWrap')?.classList.toggle('hidden',permanent);
    $('#durationUnitWrap')?.classList.toggle('hidden',permanent);
  }

  function updateSubscriptionPreview() {
    const subscriber = subscriberById($('#subSubscriberId')?.value);
    const type = $('#subscriptionType')?.value || 'temporary';
    const start = $('#subscriptionStart')?.value || nowLocalInput();
    const end = calcEndDate(start,type,$('#durationValue')?.value,$('#durationUnit')?.value);
    const cost = num($('#subscriptionCost')?.value), paid=num($('#subscriptionPaid')?.value), discount=num($('#subscriptionDiscount')?.value);
    const remaining = cost - discount - paid;
    if ($('#subscriptionRemaining')) $('#subscriptionRemaining').value = money(remaining);
    const metrics = subscriptionMetrics({startDate:start,endDate:end,type});
    const preview = $('#subscriptionPreview'); if (!preview) return;
    preview.innerHTML = `<h4>معاينة الاشتراك</h4><div class="preview-grid">
      <div class="preview-line"><span>اسم المشترك</span><strong>${esc(subscriber?.name||'—')}</strong></div>
      <div class="preview-line"><span>اسم الشبكة</span><strong>${esc($('#networkName')?.value||'—')}</strong></div>
      <div class="preview-line"><span>مدير الشبكة</span><strong>${esc($('#networkManager')?.value||'—')}</strong></div>
      <div class="preview-line"><span>نوع الاشتراك</span><strong>${subscriptionTypeLabel(type)}</strong></div>
      <div class="preview-line"><span>الفترة</span><strong>${type==='permanent'?`من ${fmtDate(start)} — دائم`:`${fmtDate(start)} — ${fmtDate(end)}`}</strong></div>
      <div class="preview-line"><span>عدد أيام الاشتراك</span><strong>${metrics.totalDays===null?'غير محدد':`${metrics.totalDays} يوم`}</strong></div>
      <div class="preview-line"><span>الأيام المستهلكة</span><strong>${metrics.usedDays} يوم</strong></div>
      <div class="preview-line"><span>الأيام المتبقية</span><strong>${metrics.remainingDays===null?'دائم':`${metrics.remainingDays} يوم`}</strong></div>
      <div class="preview-line"><span>تكلفة الاشتراك</span><strong>${money(cost)}</strong></div>
      <div class="preview-line"><span>المبلغ المدفوع</span><strong>${money(paid)}</strong></div>
      <div class="preview-line"><span>الخصم</span><strong>${money(discount)}</strong></div>
      <div class="preview-line"><span>المبلغ المتبقي</span><strong class="${remaining>0?'amount-debt':remaining<0?'amount-credit':''}">${money(Math.abs(remaining))}${remaining<0?' له':''}</strong></div>
      <div class="preview-line"><span>اسم المستخدم</span><strong>${esc($('#subscriptionUsername')?.value||'—')}</strong></div>
      <div class="preview-line"><span>كلمة المرور</span><strong>${esc($('#subscriptionLoginPassword')?.value||'—')}</strong></div>
    </div>`;
  }

  function saveSubscription(sendAfter=false) {
    const subscriberId = $('#subSubscriberId')?.value;
    const networkName = $('#networkName')?.value.trim();
    if (!subscriberId || !networkName) return toast('اختر المشترك واكتب اسم الشبكة.','error');
    const type = $('#subscriptionType').value;
    const startDate = new Date($('#subscriptionStart').value).toISOString();
    const endDate = calcEndDate(startDate,type,$('#durationValue').value,$('#durationUnit').value);
    const s = {
      id:uid('plan'), subscriberId, networkName,
      managerName:$('#networkManager').value.trim(), type, frozen:$('#subscriptionStatus')?.value==='frozen',
      durationValue:type==='permanent'?0:num($('#durationValue').value), durationUnit:type==='permanent'?'':$('#durationUnit').value,
      startDate,endDate,cost:num($('#subscriptionCost').value),paid:num($('#subscriptionPaid').value),discount:num($('#subscriptionDiscount').value),
      username:$('#subscriptionUsername').value.trim(),loginPassword:$('#subscriptionLoginPassword').value.trim(),
      createdAt:new Date().toISOString()
    };
    db.subscriptions.push(s);
    const accountId = $('#subscriptionAccount')?.value || '';
    if (s.paid>0 && accountId) db.movements.push({id:uid('mv'),type:'initial_payment',subscriberId,subscriptionId:s.id,amount:s.paid,accountToId:accountId,date:s.startDate,notes:'دفعة عند إنشاء الاشتراك',createdAt:new Date().toISOString()});
    saveDB(); logAction('subscription','إضافة اشتراك',`${subscriberById(subscriberId)?.name || ''} • ${networkName}`,s.id);
    closeModal(); toast('تم حفظ الاشتراك.','success'); renderRoute();
    if (sendAfter) setTimeout(()=>openSendOptions(subscriberId,buildSubscriptionMessage(s),'تفاصيل الاشتراك'),100);
  }

  function applyTemplate(text, vars={}) {
    return String(text||'').replace(/{{\s*([\w]+)\s*}}/g,(_,k)=>String(vars[k]??'—'));
  }
  function subscriberTemplateVars(sub) {
    const plans=[...subscriptionsFor(sub.id)].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    const latest=plans[0]; const fin=subscriberFinancial(sub.id);
    const startDates=plans.map(x=>new Date(x.startDate)).filter(x=>!Number.isNaN(x.getTime()));
    const endDates=plans.map(x=>x.endDate?new Date(x.endDate):null).filter(Boolean).filter(x=>!Number.isNaN(x.getTime()));
    const totalDays=plans.reduce((a,x)=>{const m=subscriptionMetrics(x);return a+(m.totalDays||0)},0);
    const remainingDays=plans.reduce((a,x)=>{const m=subscriptionMetrics(x);return a+(m.remainingDays||0)},0);
    return {
      name:sub.name,manager:currentActorName(),today:fmtDate(new Date(),true),type:latest?subscriptionTypeLabel(latest.type):'—',
      period:plans.length?`من ${fmtDate(startDates.sort((a,b)=>a-b)[0])} إلى ${endDates.length?fmtDate(endDates.sort((a,b)=>b-a)[0]):'دائم'}`:'—',
      totalDays:totalDays||'غير محدد',remainingDays:remainingDays||'دائم',totalCost:money(fin.charges),totalPaid:money(fin.effectivePaid),
      totalRemaining:money(Math.abs(fin.signed)),username:latest?.username||'—',password:latest?.loginPassword||'—'
    };
  }
  function buildSubscriberMessage(sub) {
    return applyTemplate(db.settings.templates?.summary||defaultTemplates().summary,subscriberTemplateVars(sub));
  }
  function buildSubscriptionMessage(s) {
    const sub=subscriberById(s.subscriberId);if(!sub)return '';
    const m=subscriptionMetrics(s), fin=subscriberFinancial(sub.id), base=subscriberTemplateVars(sub), remaining=num(s.cost)-num(s.discount)-num(s.paid);
    return applyTemplate(db.settings.templates?.subscription||defaultTemplates().subscription,{...base,network:s.networkName||'—',networkManager:s.managerName||'—',type:subscriptionTypeLabel(s.type),period:s.type==='permanent'?`من ${fmtDate(s.startDate)} - دائم`:`من ${fmtDate(s.startDate)} إلى ${fmtDate(s.endDate)}`,days:m.totalDays===null?'غير محدد':m.totalDays,usedDays:m.usedDays,remainingDays:m.remainingDays===null?'دائم':m.remainingDays,cost:money(s.cost),paid:money(s.paid),discount:money(s.discount),balanceSide:remaining<0?'له':'عليه',remaining:money(Math.abs(remaining)),summaryPeriod:base.period,summaryDays:base.totalDays,summaryRemainingDays:base.remainingDays,summaryCost:money(fin.charges),summaryPaid:money(fin.effectivePaid),summaryRemaining:money(Math.abs(fin.signed)),username:s.username||base.username,password:s.loginPassword||base.password});
  }

  function buildPaymentMessage(m) {
    const sub=subscriberById(m.subscriberId);if(!sub)return '';
    const vars=subscriberTemplateVars(sub), account=accountById(m.accountToId||m.accountFromId), key=m.type==='send'?'send':'collect';
    return applyTemplate(db.settings.templates?.[key]||defaultTemplates()[key],{...vars,paymentDate:fmtDate(m.date||m.createdAt,true),amount:money(m.amount),account:account?.name||'غير محدد',summaryDays:vars.totalDays,summaryRemainingDays:vars.remainingDays,summaryCost:vars.totalCost,summaryPaid:vars.totalPaid,summaryRemaining:vars.totalRemaining});
  }
  function buildTransferMessage(m,side='from') {
    const sub=subscriberById(side==='from'?m.subscriberFromId:m.subscriberToId);if(!sub)return '';
    const vars=subscriberTemplateVars(sub), from=accountById(m.accountFromId),to=accountById(m.accountToId), key=side==='from'?'transferFrom':'transferTo';
    return applyTemplate(db.settings.templates?.[key]||defaultTemplates()[key],{...vars,fromAccount:from?.name||'—',toAccount:to?.name||'—',amount:money(m.amount),summaryCost:vars.totalCost,summaryPaid:vars.totalPaid,summaryRemaining:vars.totalRemaining});
  }

  function renderFlows() {
    const debtors = db.subscribers.filter(s=>subscriberFinancial(s.id).dueToUs>0.009);
    const creditors = db.subscribers.filter(s=>subscriberFinancial(s.id).dueToSubscriber>0.009);
    const flowMovements = db.movements.filter(m=>['collect','send','initial_payment'].includes(m.type)).sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt));
    const transfers = db.movements.filter(m=>m.type==='transfer').sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt));
    $('#mainContent').innerHTML = `
      <div class="page">
        <div class="action-strip">
          <button class="action-tile" data-action="collect-payment"><span class="soft-icon teal">${icon('download',21)}</span><span><strong>تحصيل دفعة</strong></span></button>
          <button class="action-tile" data-action="send-payment"><span class="soft-icon amber">${icon('upload',21)}</span><span><strong>إرسال دفعة</strong></span></button>
          <button class="action-tile" data-action="transfer-account"><span class="soft-icon violet">${icon('transfer',21)}</span><span><strong>تحويل بين الحسابات</strong></span></button>
        </div>
        <div class="flow-tabs">
          <button class="flow-tab ${ui.flowTab==='debtors'?'active':''}" data-action="flow-tab" data-tab="debtors">المستحق عليهم (${debtors.length})</button>
          <button class="flow-tab ${ui.flowTab==='creditors'?'active':''}" data-action="flow-tab" data-tab="creditors">المستحق لهم (${creditors.length})</button>
          <button class="flow-tab ${ui.flowTab==='movements'?'active':''}" data-action="flow-tab" data-tab="movements">الحركات المالية</button>
          <button class="flow-tab ${ui.flowTab==='transfers'?'active':''}" data-action="flow-tab" data-tab="transfers">التحويلات</button>
        </div>
        <div class="search-panel">
          <div class="search-box">${icon('search',20)}<input id="flowSearch" placeholder="بحث بالاسم أو المبلغ أو الملاحظات..."></div>
        </div>
        <div class="filter-chips" id="flowDateChips">${dateFilterChips(ui.dateFilter)}</div>
        <div id="flowCustomRange" class="custom-range ${ui.dateFilter==='custom'?'':'hidden'}">${customRangeHtml()}</div>
        <div id="flowList" class="list"></div>
      </div>`;
    attachDateFilterEvents('flow');
    const refresh = () => {
      const q = ($('#flowSearch')?.value||'').trim().toLowerCase();
      let html='';
      if (ui.flowTab==='debtors' || ui.flowTab==='creditors') {
        const base = ui.flowTab==='debtors'?debtors:creditors;
        const filtered = base.filter(s=>{
          const f=subscriberFinancial(s.id); const val=ui.flowTab==='debtors'?f.dueToUs:f.dueToSubscriber;
          return !q || `${s.name} ${fullPhone(s)} ${val}`.toLowerCase().includes(q);
        });
        html = filtered.length ? filtered.map(s=>flowPersonCard(s,ui.flowTab==='debtors'?'debt':'credit')).join('') : emptyState('wallet',ui.flowTab==='debtors'?'لا يوجد مشتركون مستحق عليهم':'لا يوجد مشتركون مستحق لهم','الحسابات المتوازنة لن تظهر هنا.');
      } else {
        const base = ui.flowTab==='movements'?flowMovements:transfers;
        const filtered = base.filter(m=>matchesDateFilter(m.date||m.createdAt) && (!q || movementSearchText(m).includes(q)));
        html = filtered.length ? filtered.map(movementCard).join('') : emptyState('wallet','لا توجد حركات','غيّر الفترة أو أضف حركة مالية جديدة.');
      }
      $('#flowList').innerHTML=html;
    };
    $('#flowSearch').addEventListener('input',refresh);
    $('#flowDateChips').addEventListener('click',e=>{const b=e.target.closest('[data-date-filter]'); if(!b)return;ui.dateFilter=b.dataset.dateFilter;renderFlows();});
    $('#flowFrom')?.addEventListener('change',e=>{ui.customFrom=e.target.value;refresh();});
    $('#flowTo')?.addEventListener('change',e=>{ui.customTo=e.target.value;refresh();});
    refresh();
  }

  function dateFilterChips(active='all') {
    const items=[['all','الكل'],['today','اليوم'],['week','هذا الأسبوع'],['month','هذا الشهر'],['year','هذه السنة'],['custom','من - إلى']];
    return items.map(i=>`<button class="chip ${active===i[0]?'active':''}" data-date-filter="${i[0]}" type="button">${i[1]}</button>`).join('');
  }
  function customRangeHtml(prefix='flow') {
    return `<label class="date-field">${icon('calendar',19)}<input id="${prefix}From" type="date" value="${esc(ui.customFrom)}" aria-label="من"></label><label class="date-field">${icon('calendar',19)}<input id="${prefix}To" type="date" value="${esc(ui.customTo)}" aria-label="إلى"></label>`;
  }
  function attachDateFilterEvents() {}
  function matchesDateFilter(value) {
    if (ui.dateFilter==='all') return true;
    const d=new Date(value); if(Number.isNaN(d.getTime())) return false;
    const now=new Date();
    if(ui.dateFilter==='today') return d.toDateString()===now.toDateString();
    if(ui.dateFilter==='week') { const start=new Date(now); start.setHours(0,0,0,0); start.setDate(now.getDate()-((now.getDay()+6)%7)); const end=new Date(start); end.setDate(start.getDate()+7); return d>=start&&d<end; }
    if(ui.dateFilter==='month') return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
    if(ui.dateFilter==='year') return d.getFullYear()===now.getFullYear();
    if(ui.dateFilter==='custom') { const from=ui.customFrom?new Date(ui.customFrom+'T00:00:00'):null; const to=ui.customTo?new Date(ui.customTo+'T23:59:59'):null; return (!from||d>=from)&&(!to||d<=to); }
    return true;
  }
  function movementSearchText(m) {
    const sub=subscriberById(m.subscriberId); const from=accountById(m.accountFromId); const to=accountById(m.accountToId);
    return `${sub?.name||''} ${from?.name||''} ${to?.name||''} ${m.amount||0} ${m.notes||''} ${movementTitle(m)}`.toLowerCase();
  }
  function flowPersonCard(s,kind) {
    const f=subscriberFinancial(s.id); const value=kind==='debt'?f.dueToUs:f.dueToSubscriber;
    return `<article class="list-card clickable" data-action="open-payment" data-mode="${kind==='debt'?'collect':'send'}" data-id="${s.id}">
      <div class="person-card"><div class="avatar">${esc(s.name.charAt(0))}</div><div class="person-info"><strong>${esc(s.name)}</strong><small dir="ltr">${esc(fullPhone(s))}</small><small>${kind==='debt'?'مستحق منه':'مستحق له'}</small></div><div class="person-balance"><div class="balance-value ${kind==='debt'?'amount-debt':'amount-credit'}">${money(value)}</div><div class="balance-label">${kind==='debt'?'مستحق عليه':'مستحق له'}</div></div></div>
      <div class="card-actions"><button class="mini-action teal" data-action="call-subscriber" data-id="${s.id}">${icon('phone',17)}</button><button class="mini-action teal" data-action="message-subscriber" data-id="${s.id}">${icon('send',17)}</button><span class="card-spacer"></span><span style="color:#a1abb2">${icon('chevron',18)}</span></div>
    </article>`;
  }
  function movementTitle(m) {
    const map={collect:'تحصيل دفعة',send:'إرسال دفعة',initial_payment:'دفعة أولية',transfer:'تحويل بين الحسابات',account_deposit:'إيداع في حساب',account_expense:'مصروف من حساب',discount:'خصم'};
    return m.title || map[m.type] || 'حركة مالية';
  }
  function movementCard(m) {
    const sub=subscriberById(m.subscriberId); const from=accountById(m.accountFromId); const to=accountById(m.accountToId);
    const isIn=['collect','initial_payment','account_deposit'].includes(m.type); const isOut=['send','account_expense'].includes(m.type); const isTransfer=m.type==='transfer';
    const tone=isTransfer?'transfer':isIn?'in':isOut?'out':'info'; const ic=isTransfer?'transfer':isIn?'download':isOut?'upload':'info';
    let detail=sub?.name||''; if(isTransfer)detail=`${from?.name||'—'} ← ${to?.name||'—'}`; else if(!detail)detail=to?.name||from?.name||'';
    return `<article class="list-card"><div class="movement-card"><div class="movement-icon ${tone}">${icon(ic,21)}</div><div class="movement-main"><strong>${movementTitle(m)}</strong><small>${esc(detail)}${m.notes?` • ${esc(m.notes)}`:''}</small><small>${fmtDate(m.date||m.createdAt,true)}</small></div><div class="movement-amount ${isOut?'out':'in'}">${isOut?'−':isIn?'+':''}${money(m.amount)}</div>${db.movements.some(x=>x.id===m.id)?`<button class="mini-action" data-action="movement-details" data-id="${m.id}">${icon('eye',16)}</button>`:''}${sub&&db.movements.some(x=>x.id===m.id)?`<button class="mini-action" data-action="send-movement" data-id="${m.id}">${icon('send',16)}</button>`:''}</div></article>`;
  }

  function openCollectChooser(mode='collect') {
    const all=[...db.subscribers].sort((a,b)=>{
      const av=mode==='collect'?subscriberFinancial(a.id).dueToUs:subscriberFinancial(a.id).dueToSubscriber;
      const bv=mode==='collect'?subscriberFinancial(b.id).dueToUs:subscriberFinancial(b.id).dueToSubscriber;
      return bv-av || String(a.name||'').localeCompare(String(b.name||''),'ar');
    });
    const title=mode==='collect'?'تحصيل دفعة — اختر المشترك':'إرسال دفعة — اختر المشترك';
    openModal(title,all.length?`<div class="chooser-note">${icon('info',17)} <span>يمكن اختيار أي مشترك. يظهر أصحاب المبالغ المستحقة أولاً، ويمكن تعديل مبلغ الدفعة يدوياً.</span></div><div class="list">${all.map(s=>flowPersonCard(s,mode==='collect'?'debt':'credit')).join('')}</div>`:emptyState('users','لا يوجد مشتركون','أضف مشتركاً أولاً ثم سجّل الدفعة.'));
  }

  function openPaymentModal(subId,mode='collect') {
    const s=subscriberById(subId); if(!s)return;
    const fin=subscriberFinancial(subId); const due=mode==='collect'?fin.dueToUs:fin.dueToSubscriber;
    closeModal();
    ui.receiptData='';
    const accountLabel=mode==='collect'?'الحساب المودع فيه':'الحساب المرسل منه';
    const accounts=financialAccounts();
    const defaultAccountId=accounts[0]?.id||'';
    openModal(mode==='collect'?`تحصيل دفعة من ${esc(s.name)}`:`إرسال دفعة إلى ${esc(s.name)}`,`
      <form id="paymentForm" class="form-grid">
        <div class="full"><div class="info-card" style="box-shadow:none"><div class="data-rows"><div class="data-row"><span>المشترك</span><b>${esc(s.name)}</b></div><div class="data-row"><span>إجمالي المستحق</span><b class="${mode==='collect'?'amount-debt':'amount-credit'}">${money(due)}</b></div><div class="data-row"><span>عدد الاشتراكات</span><b>${subscriptionsFor(subId).length}</b></div></div></div></div>
        <div class="full"><div class="section-card" style="box-shadow:none;padding:14px"><div class="section-title" style="margin-bottom:10px"><div><h3 style="font-size:13px">الاشتراكات السابقة</h3><p>التكلفة والمدفوع والمتبقي لكل اشتراك</p></div></div><div class="list">${subscriptionsFor(subId).length?subscriptionsFor(subId).slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(x=>`<div class="list-card" style="padding:11px;box-shadow:none"><div style="display:flex;gap:8px;justify-content:space-between;align-items:center"><div><strong style="font-size:11.5px">${esc(x.networkName||'اشتراك')}</strong><div style="font-size:9.5px;color:#9aa5ad">${subscriptionTypeLabel(x.type)} • ${fmtDate(x.startDate)}</div></div><div style="font-size:10px;text-align:end"><div>${money(x.cost)} تكلفة</div><div class="amount-credit">${money(x.paid)} مدفوع</div><div class="amount-debt">${money(Math.max(0,num(x.cost)-num(x.discount)-num(x.paid)))} متبقي أولي</div></div></div></div>`).join(''):'<div style="font-size:11px;color:#9aa5ad">لا توجد اشتراكات سابقة.</div>'}</div></div></div>
        ${field('تاريخ الدفع','paymentDate','datetime-local',nowLocalInput(),'','','required')}
        ${field('مبلغ الدفعة','paymentAmount','number',due.toFixed(2),'0.00','يمكن تعديل المبلغ قبل الحفظ.','min="0.01" step="0.01" inputmode="decimal" required')}
        <div class="full"><div class="field"><label for="paymentAccount">${accountLabel}</label><select id="paymentAccount">${accountOptions(defaultAccountId,'اختر الحساب')}</select><small>${accounts.length?'تم تحميل الحسابات المالية المضافة. يمكنك البحث داخل القائمة واختيار الحساب.':'لا توجد حسابات مالية. أضف حساباً من قسم الحسابات المالية أولاً.'}</small></div></div>
        <div class="full">${textareaField('الملاحظات','paymentNotes','','مثال: دفعة عن اشتراك شهر أغسطس...','ملاحظة داخلية تظهر في السجل والحركة.')}</div>
        <div class="full"><div class="receipt-box"><strong>إرفاق الإيصال</strong><div style="font-size:10px;color:#9ba5ac;margin-top:4px">اختر صورة من الجهاز أو افتح الكاميرا.</div><div class="receipt-actions"><button class="secondary-button" data-action="pick-receipt" type="button">${icon('upload',17)} صورة</button><button class="ghost-button" data-action="camera-receipt" type="button">${icon('camera',17)} كاميرا</button></div><input id="receiptFile" type="file" accept="image/*" hidden><input id="receiptCamera" type="file" accept="image/*" capture="environment" hidden><div id="receiptPreview"></div></div></div>
        <div class="full"><div id="paymentPreview" class="preview-card"></div></div>
      </form>`, `<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="secondary-button" data-action="save-payment" data-mode="${mode}" data-id="${subId}" data-send="0">${icon('save',17)} حفظ فقط</button><button class="primary-button" data-action="save-payment" data-mode="${mode}" data-id="${subId}" data-send="1">${icon('send',17)} حفظ وإرسال</button>`, true);
    $('#paymentAmount').addEventListener('input',()=>updatePaymentPreview(s,mode,due));
    $('#paymentAccount').addEventListener('change',()=>updatePaymentPreview(s,mode,due));
    updatePaymentPreview(s,mode,due);
    $('#receiptFile').addEventListener('change',e=>handleReceipt(e.target.files[0]));
    $('#receiptCamera').addEventListener('change',e=>handleReceipt(e.target.files[0]));
  }
  function updatePaymentPreview(sub,mode,due) {
    const amount=num($('#paymentAmount')?.value); const account=accountById($('#paymentAccount')?.value); const remain=Math.max(0,due-amount);
    $('#paymentPreview').innerHTML=`<h4>معاينة ${mode==='collect'?'التحصيل':'الإرسال'}</h4><div class="preview-grid"><div class="preview-line"><span>إجمالي المبلغ المستحق</span><strong>${money(due)}</strong></div><div class="preview-line"><span>المبلغ المودع</span><strong>${mode==='collect'?money(amount):money(0)}</strong></div><div class="preview-line"><span>المبلغ المرسل</span><strong>${mode==='send'?money(amount):money(0)}</strong></div><div class="preview-line"><span>المتبقي بعد الدفع</span><strong>${money(remain)}</strong></div><div class="preview-line"><span>الحساب المودع فيه</span><strong>${mode==='collect'?esc(account?.name||'—'):'—'}</strong></div><div class="preview-line"><span>الحساب المرسل منه</span><strong>${mode==='send'?esc(account?.name||'—'):'—'}</strong></div></div>`;
  }
  async function handleReceipt(file) {
    if(!file)return; if(!file.type.startsWith('image/'))return toast('اختر ملف صورة.','error');
    try { ui.receiptData=await compressImage(file); $('#receiptPreview').innerHTML=`<img class="receipt-preview" src="${ui.receiptData}" alt="معاينة الإيصال">`; toast('تم إرفاق الإيصال.','success'); } catch(e){ toast('تعذر تجهيز الصورة.','error'); }
  }
  function compressImage(file) {
    return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onerror=reject; r.onload=()=>{ const img=new Image(); img.onerror=reject; img.onload=()=>{ const max=900; let w=img.width,h=img.height; if(Math.max(w,h)>max){const k=max/Math.max(w,h);w=Math.round(w*k);h=Math.round(h*k);} const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);resolve(c.toDataURL('image/jpeg',.72));}; img.src=r.result;}; r.readAsDataURL(file); });
  }
  function savePayment(subId,mode,sendAfter=false) {
    const amount=num($('#paymentAmount')?.value); if(amount<=0)return toast('أدخل مبلغاً صحيحاً.','error');
    const accountId=$('#paymentAccount')?.value||''; const date=$('#paymentDate')?.value?new Date($('#paymentDate').value).toISOString():new Date().toISOString();
    const m={id:uid('mv'),type:mode,subscriberId:subId,amount,date,notes:$('#paymentNotes')?.value.trim()||'',receiptData:ui.receiptData||'',createdAt:new Date().toISOString()};
    if(mode==='collect')m.accountToId=accountId; else m.accountFromId=accountId;
    db.movements.push(m); saveDB(); const sub=subscriberById(subId); logAction('money',mode==='collect'?'تحصيل دفعة':'إرسال دفعة',`${sub?.name||''} • ${money(amount)}`,m.id); closeModal();toast('تم حفظ الحركة المالية.','success');renderRoute();
    if(sendAfter&&sub)setTimeout(()=>openSendOptions(subId,buildPaymentMessage(m),'إيصال الحركة'),100);
  }

  function renderAccounts() {
    const total = totalAccountsBalance();
    const cash = totalAccountsBalance('cash');
    const bank = totalAccountsBalance('bank');
    const deposits = db.movements.filter(m=>m.type==='account_deposit').sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt));
    const expenses = db.movements.filter(m=>m.type==='account_expense').sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt));
    const allMoves = db.movements.filter(m=>['collect','send','initial_payment','account_deposit','account_expense','transfer'].includes(m.type)).sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt));
    $('#mainContent').innerHTML = `
      <div class="page">
        <div class="page-head has-mobile-fab"><div class="page-head-copy"><h2>الحسابات المالية</h2><p>الأرصدة والإيداعات والمصروفات والتحويلات</p></div><div class="head-actions"><button class="secondary-button" data-action="add-account">${icon('plus',17)} إضافة حساب</button><button class="ghost-button" data-action="transfer-account">${icon('transfer',17)} تحويل</button></div></div>
        <button class="accounts-summary" data-action="show-account-movements" data-type="all" type="button" style="border:0;text-align:start;width:100%"><span>إجمالي الأرصدة</span><strong>${money(total)}</strong></button>
        <section class="account-summary-grid"><button class="account-type-card cash" data-action="show-account-movements" data-type="cash" type="button" style="border:0;text-align:start"><div class="soft-icon teal">${icon('wallet',21)}</div><span>إجمالي الأرصدة النقدية</span><strong>${money(cash)}</strong></button><button class="account-type-card bank" data-action="show-account-movements" data-type="bank" type="button" style="border:0;text-align:start"><div class="soft-icon violet">${icon('bank',21)}</div><span>إجمالي الأرصدة البنكية</span><strong>${money(bank)}</strong></button></section>
        <div class="flow-tabs">
          <button class="flow-tab ${ui.accountTab==='accounts'?'active':''}" data-action="account-tab" data-tab="accounts">الحسابات</button>
          <button class="flow-tab ${ui.accountTab==='deposits'?'active':''}" data-action="account-tab" data-tab="deposits">الإيداعات</button>
          <button class="flow-tab ${ui.accountTab==='expenses'?'active':''}" data-action="account-tab" data-tab="expenses">المصروفات</button>
          <button class="flow-tab ${ui.accountTab==='movements'?'active':''}" data-action="account-tab" data-tab="movements">كل الحركات</button>
        </div>
        <div class="search-panel"><div class="search-box">${icon('search',20)}<input id="accountSearch" placeholder="بحث بالاسم أو المبلغ أو التاريخ..."></div></div>
        <div class="filter-chips" id="accountDateChips">${dateFilterChips(ui.dateFilter)}</div>
        <div id="accountCustomRange" class="custom-range ${ui.dateFilter==='custom'?'':'hidden'}">${customRangeHtml('account')}</div>
        <div id="accountList" class="list"></div>
        <div class="fab-row"><button class="fab secondary" data-action="transfer-account">${icon('transfer',18)} تحويل</button><button class="fab" data-action="add-account">${icon('plus',19)} إضافة حساب</button></div>
      </div>`;
    const refresh = () => {
      const q=($('#accountSearch')?.value||'').trim().toLowerCase(); let html='';
      if(ui.accountTab==='accounts') {
        const list=db.accounts.filter(a=>!q||`${a.name} ${a.accountNumber||''} ${accountBalance(a.id)}`.toLowerCase().includes(q));
        html=list.length?list.map(accountCard).join(''):emptyState('bank','لا توجد حسابات مالية','أضف حساباً نقدياً أو بنكياً للبدء.');
      } else {
        const src=ui.accountTab==='deposits'?deposits:ui.accountTab==='expenses'?expenses:allMoves;
        const list=src.filter(m=>{
          const accountIds=[m.accountFromId,m.accountToId].filter(Boolean);
          const typeHit=ui.accountTypeFilter==='all'||accountIds.some(id=>accountById(id)?.type===ui.accountTypeFilter);
          return typeHit&&matchesDateFilter(m.date||m.createdAt)&&(!q||movementSearchText(m).includes(q));
        });
        html=list.length?list.map(movementCard).join(''):emptyState('wallet','لا توجد حركات','جرّب فترة أخرى أو أضف حركة مالية.');
      }
      $('#accountList').innerHTML=html;
    };
    $('#accountSearch').addEventListener('input',refresh);
    $('#accountDateChips').addEventListener('click',e=>{const b=e.target.closest('[data-date-filter]');if(!b)return;ui.dateFilter=b.dataset.dateFilter;renderAccounts();});
    $('#accountFrom')?.addEventListener('change',e=>{ui.customFrom=e.target.value;refresh();});
    $('#accountTo')?.addEventListener('change',e=>{ui.customTo=e.target.value;refresh();});
    refresh();
  }

  function accountCard(a) {
    const bal=accountBalance(a.id);
    return `<article class="list-card"><div class="account-card"><div class="soft-icon ${a.type==='bank'?'violet':'teal'}">${icon(a.type==='bank'?'bank':'wallet',22)}</div><div class="account-info"><strong>${esc(a.name)}</strong><small>${a.type==='bank'?'حساب بنكي':'حساب نقدي'}${a.accountNumber?` • ${esc(a.accountNumber)}`:''}</small><small>${fmtDate(a.date)}</small></div><div class="account-balance"><strong>${money(bal)}</strong><small>الرصيد الحالي</small></div></div><div class="account-actions"><button class="mini-action teal" data-action="account-deposit" data-id="${a.id}" title="إيداع">${icon('download',16)}</button><button class="mini-action red" data-action="account-expense" data-id="${a.id}" title="صرف">${icon('upload',16)}</button><span class="card-spacer"></span><button class="mini-action" data-action="account-edit" data-id="${a.id}" title="تعديل">${icon('edit',16)}</button></div></article>`;
  }

  function openAddAccount(editId='') {
    const a=editId?accountById(editId):null;
    openModal(a?'تعديل الحساب':'إضافة حساب',`<form id="accountForm" class="form-grid">
      <div class="full">${field('اسم الحساب','accountName','text',a?.name||'','مثال: الصندوق الرئيسي','اسم واضح للحساب.','required')}</div>
      ${selectField('نوع الحساب','accountType',[['cash','نقدي'],['bank','بنكي']],a?.type||'cash','إذا اخترت بنكياً سيظهر رقم الحساب.')}
      <div id="bankNumberWrap" class="${(a?.type||'cash')==='bank'?'':'hidden'}">${field('رقم الحساب','accountNumber','text',a?.accountNumber||'','مثال: 123456789','','')}</div>
      ${field('الرصيد الافتتاحي','openingBalance','number',String(a?.openingBalance??0),'0.00','الرصيد عند إنشاء الحساب.','step="0.01" inputmode="decimal"')}
      ${field('تاريخ إضافة الحساب','accountDate','date',dateOnlyInput(),'','','required')}
      <div class="full">${textareaField('الملاحظات','accountNotes',a?.notes||'','ملاحظات عن الحساب...','اختياري.')}</div>
    </form>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="primary-button" data-action="save-account" data-id="${editId}">${icon('save',17)} حفظ الحساب</button>`);
    $('#accountType').addEventListener('change',()=>$('#bankNumberWrap').classList.toggle('hidden',$('#accountType').value!=='bank'));
  }
  function saveAccount(id='') {
    const name=$('#accountName')?.value.trim(); if(!name)return toast('اكتب اسم الحساب.','error');
    const payload={name,type:$('#accountType').value,accountNumber:$('#accountType').value==='bank'?$('#accountNumber')?.value.trim()||'':'',openingBalance:num($('#openingBalance').value),date:$('#accountDate').value,notes:$('#accountNotes').value.trim()};
    if(id){const a=accountById(id);Object.assign(a,payload);logAction('account','تعديل حساب',name,id);} else {const a={id:uid('acc'),...payload,createdAt:new Date().toISOString()};db.accounts.push(a);logAction('account','إضافة حساب',name,a.id);}
    saveDB();closeModal();toast('تم حفظ الحساب.','success');renderRoute();
  }

  function openAccountMoney(id,mode='deposit') {
    const a=accountById(id);if(!a)return;
    openModal(mode==='deposit'?`إيداع في ${esc(a.name)}`:`صرف من ${esc(a.name)}`,`<form class="form-grid">
      ${field('المبلغ','accountMoveAmount','number','','0.00','بالشيقل.','min="0.01" step="0.01" inputmode="decimal" required')}
      ${field('التاريخ','accountMoveDate','datetime-local',nowLocalInput(),'','','required')}
      ${mode==='expense'?field('اسم الصارف','accountMoveBy','text',currentActorName(),'مثال: أحمد','اسم الشخص الذي قام بالصرف.') : ''}
      <div class="full">${textareaField('الملاحظات','accountMoveNotes','',mode==='deposit'?'مثال: تغذية الصندوق':'مثال: مصروف تشغيلي','')}</div>
    </form>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="primary-button" data-action="save-account-money" data-id="${id}" data-mode="${mode}">${icon('save',17)} حفظ</button>`);
  }
  function saveAccountMoney(id,mode) {
    const amount=num($('#accountMoveAmount')?.value);if(amount<=0)return toast('أدخل مبلغاً صحيحاً.','error');
    const m={id:uid('mv'),type:mode==='deposit'?'account_deposit':'account_expense',amount,date:new Date($('#accountMoveDate').value).toISOString(),notes:$('#accountMoveNotes').value.trim(),spentBy:mode==='expense'?($('#accountMoveBy')?.value.trim()||currentActorName()):'',createdAt:new Date().toISOString()};
    if(mode==='deposit')m.accountToId=id;else m.accountFromId=id;
    db.movements.push(m);saveDB();logAction('account',mode==='deposit'?'إيداع مالي':'مصروف مالي',`${accountById(id)?.name||''} • ${money(amount)}`,m.id);closeModal();toast('تم حفظ الحركة.','success');renderRoute();
  }

  function openTransferModal() {
    if(db.accounts.length<2)return toast('أضف حسابين على الأقل لإجراء التحويل.','error');
    openModal('التحويل بين الحسابات',`<form class="form-grid">
      <div class="field"><label for="transferSubscriberFrom">المشترك المحول منه (اختياري)</label><select id="transferSubscriberFrom">${subscriberOptions('')}</select><small>اختياري لإرسال إشعار التحويل للمشترك.</small></div>
      <div class="field"><label for="transferSubscriberTo">المشترك المحول إليه (اختياري)</label><select id="transferSubscriberTo">${subscriberOptions('')}</select><small>اختياري لإرسال إشعار الاستلام للمشترك.</small></div>
      <div class="field"><label for="transferFrom">الحساب المحول منه</label><select id="transferFrom">${accountOptions('','اختر الحساب')}</select><small>سيتم خصم المبلغ من هذا الحساب.</small></div>
      <div class="field"><label for="transferTo">الحساب المحول إليه</label><select id="transferTo">${accountOptions('','اختر الحساب')}</select><small>سيتم إضافة المبلغ إلى هذا الحساب.</small></div>
      ${field('المبلغ المراد تحويله','transferAmount','number','','0.00','بالشيقل.','min="0.01" step="0.01" inputmode="decimal"')}
      ${field('تاريخ التحويل','transferDate','datetime-local',nowLocalInput(),'','','required')}
      <div class="full">${textareaField('الملاحظات','transferNotes','','سبب التحويل أو ملاحظة...','')}</div>
    </form>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="primary-button" data-action="save-transfer">${icon('transfer',17)} حفظ التحويل</button>`);
  }
  function saveTransfer() {
    const from=$('#transferFrom')?.value,to=$('#transferTo')?.value,amount=num($('#transferAmount')?.value);if(!from||!to)return toast('اختر الحسابين.','error');if(from===to)return toast('اختر حسابين مختلفين.','error');if(amount<=0)return toast('أدخل مبلغاً صحيحاً.','error');
    const m={id:uid('mv'),type:'transfer',accountFromId:from,accountToId:to,subscriberFromId:$('#transferSubscriberFrom')?.value||'',subscriberToId:$('#transferSubscriberTo')?.value||'',amount,date:new Date($('#transferDate').value).toISOString(),notes:$('#transferNotes').value.trim(),createdAt:new Date().toISOString()};db.movements.push(m);saveDB();logAction('transfer','تحويل بين الحسابات',`${accountById(from)?.name||''} → ${accountById(to)?.name||''} • ${money(amount)}`,m.id);closeModal();toast('تم حفظ التحويل.','success');renderRoute();
  }


  function openMovementDetails(id) {
    const m=db.movements.find(x=>x.id===id);if(!m)return;
    const sub=subscriberById(m.subscriberId),from=accountById(m.accountFromId),to=accountById(m.accountToId);
    const editable=['collect','send','account_deposit','account_expense'].includes(m.type);
    openModal('تفاصيل الحركة المالية',`<div class="info-card" style="box-shadow:none"><div class="data-rows">
      <div class="data-row"><span>نوع الحركة</span><b>${movementTitle(m)}</b></div>
      <div class="data-row"><span>المشترك</span><b>${esc(sub?.name||'—')}</b></div>
      <div class="data-row"><span>المبلغ</span><b>${money(m.amount)}</b></div>
      <div class="data-row"><span>التاريخ</span><b>${fmtDate(m.date||m.createdAt,true)}</b></div>
      <div class="data-row"><span>الحساب المرسل منه</span><b>${esc(from?.name||'—')}</b></div>
      <div class="data-row"><span>الحساب المودع فيه</span><b>${esc(to?.name||'—')}</b></div>
      <div class="data-row"><span>الملاحظات</span><b>${esc(m.notes||'—')}</b></div>
    </div>${m.receiptData?`<img class="receipt-preview" src="${m.receiptData}" alt="الإيصال">`:''}</div>`,`${editable?`<button class="ghost-button" data-action="edit-movement" data-id="${m.id}">${icon('edit',17)} تعديل</button>`:''}${sub?`<button class="primary-button" data-action="send-movement" data-id="${m.id}">${icon('send',17)} إرسال</button>`:''}${m.type==='transfer'&&m.subscriberFromId?`<button class="secondary-button" data-action="send-transfer-from" data-id="${m.id}">إشعار المحول منه</button>`:''}${m.type==='transfer'&&m.subscriberToId?`<button class="primary-button" data-action="send-transfer-to" data-id="${m.id}">إشعار المحول إليه</button>`:''}`);
  }

  function openEditMovement(id) {
    const m=db.movements.find(x=>x.id===id);if(!m)return;
    const isIn=['collect','account_deposit'].includes(m.type);
    const accountId=isIn?m.accountToId:m.accountFromId;
    openModal('تعديل الحركة المالية',`<form class="form-grid">
      ${field('المبلغ','editMovementAmount','number',String(m.amount),'0.00','سيتم تحديث الأرصدة والمستحقات فور الحفظ.','min="0.01" step="0.01" inputmode="decimal"')}
      ${field('التاريخ','editMovementDate','datetime-local',nowLocalInput(),'','','required')}
      <div class="full"><div class="field"><label for="editMovementAccount">${isIn?'الحساب المودع فيه':'الحساب المرسل منه'}</label><select id="editMovementAccount">${accountOptions(accountId||'','بدون تحديد حساب')}</select><small>يمكن تغيير الحساب المرتبط بالحركة.</small></div></div>
      <div class="full">${textareaField('الملاحظات','editMovementNotes',m.notes||'','ملاحظات الحركة...','')}</div>
    </form>`,`<button class="ghost-button" data-action="movement-details" data-id="${m.id}">رجوع</button><button class="primary-button" data-action="save-edit-movement" data-id="${m.id}">${icon('save',17)} حفظ التعديل</button>`);
  }

  function toLocalDateTimeInput(value) {
    const d=new Date(value||Date.now());d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16);
  }

  function saveEditMovement(id) {
    const m=db.movements.find(x=>x.id===id);if(!m)return;
    const amount=num($('#editMovementAmount')?.value);if(amount<=0)return toast('أدخل مبلغاً صحيحاً.','error');
    m.amount=amount;m.date=new Date($('#editMovementDate').value).toISOString();m.notes=$('#editMovementNotes').value.trim();
    const accountId=$('#editMovementAccount').value||'';
    if(['collect','account_deposit'].includes(m.type))m.accountToId=accountId;else m.accountFromId=accountId;
    saveDB();logAction('money','تعديل حركة مالية',`${movementTitle(m)} • ${money(m.amount)}`,m.id);closeModal();toast('تم تعديل الحركة.','success');renderRoute();
  }

  function scopedHomePlans(kind='all') {
    const f=ui.homeDateFilter,from=ui.homeFrom,to=ui.homeTo;
    let list=db.subscriptions.filter(x=>inRange(x.createdAt||x.startDate,f,from,to));
    if(['permanent','temporary','trial'].includes(kind)) list=list.filter(x=>x.type===kind);
    if(kind==='frozen') list=list.filter(x=>x.frozen);
    if(kind==='expiring'){const days=Math.max(1,num(db.settings.expiryWarningDays)||7);list=list.filter(x=>!x.frozen&&x.type!=='permanent'&&!subscriptionMetrics(x).expired&&subscriptionMetrics(x).remainingDays<=days);}
    return list;
  }
  function homeMetricModal(kind) {
    const f=ui.homeDateFilter,from=ui.homeFrom,to=ui.homeTo;
    if(kind==='subscribers'){
      const list=db.subscribers.filter(x=>inRange(x.createdAt,f,from,to));
      return openModal('المشتركون ضمن الفترة',`<div class="list">${list.length?list.map(subscriberCard).join(''):emptyState('users','لا توجد بيانات','لا يوجد مشتركون ضمن الفترة المحددة.')}</div>`,'',true);
    }
    if(['subscriptions','permanent','temporary','trial','frozen','expiring','gross'].includes(kind)){
      const list=scopedHomePlans(kind==='gross'?'all':kind);
      return openModal(kind==='gross'?'إجمالي تكلفة الاشتراكات':'تفاصيل الاشتراكات',`<div class="summary-banner"><span>${kind==='gross'?'الإجمالي':'عدد الاشتراكات'}</span><strong>${kind==='gross'?money(list.reduce((a,x)=>a+num(x.cost),0)):list.length}</strong></div><div class="list">${list.length?list.map(subscriptionCard).join(''):emptyState('receipt','لا توجد بيانات','لا توجد اشتراكات مطابقة للفترة والحالة.')}</div>`,'',true);
    }
    if(['debtors','creditors'].includes(kind)){
      const debt=kind==='debtors';const list=db.subscribers.filter(x=>(debt?scopeFinancialForSubscriber(x.id,f,from,to).dueToUs:scopeFinancialForSubscriber(x.id,f,from,to).dueToSubscriber)>.009);
      return openModal(debt?'المستحق عليهم':'المستحق لهم',`<div class="list">${list.length?list.map(x=>flowPersonCard(x,debt?'debt':'credit')).join(''):emptyState('wallet','لا توجد استحقاقات','لا توجد نتائج ضمن الفترة المحددة.')}</div>`,'',true);
    }
    const moves=db.movements.filter(x=>inRange(x.date||x.createdAt,f,from,to));
    if(kind==='collected') return openModal('المبالغ المحصلة',`<div class="list">${moves.filter(x=>['collect','initial_payment'].includes(x.type)).map(movementCard).join('')||emptyState('wallet','لا توجد تحصيلات','لا توجد مبالغ محصلة في الفترة.')}</div>`,'',true);
    if(kind==='expenses') return openModal('المصروفات',`<div class="list">${moves.filter(x=>x.type==='account_expense').map(movementCard).join('')||emptyState('wallet','لا توجد مصروفات','لا توجد مصروفات في الفترة.')}</div>`,'',true);
    if(kind==='discounts'){
      const list=scopedHomePlans().filter(x=>num(x.discount)>0);
      return openModal('الخصومات',`<div class="summary-banner"><span>إجمالي الخصومات</span><strong>${money(list.reduce((a,x)=>a+num(x.discount),0))}</strong></div><div class="list">${list.map(x=>`<article class="list-card"><strong>${esc(subscriberById(x.subscriberId)?.name||'')}</strong><small>${esc(x.networkName||'')}</small><div class="amount-credit">خصم ${money(x.discount)}</div></article>`).join('')||emptyState('dollar','لا توجد خصومات','لا توجد خصومات ضمن الفترة.')}</div>`,'',true);
    }
    if(kind==='equity'||kind==='netcash'){
      const plans=scopedHomePlans(),gross=plans.reduce((a,x)=>a+num(x.cost),0),discount=plans.reduce((a,x)=>a+num(x.discount),0),expenses=moves.filter(x=>x.type==='account_expense').reduce((a,x)=>a+num(x.amount),0),due=db.subscribers.reduce((a,x)=>a+scopeFinancialForSubscriber(x.id,f,from,to).dueToUs,0),result=kind==='equity'?gross-discount-expenses:gross-discount-due-expenses;
      const formula=kind==='equity'?`${money(gross)} − ${money(discount)} − ${money(expenses)} = ${money(result)}`:`${money(gross)} − ${money(discount)} − ${money(due)} − ${money(expenses)} = ${money(result)}`;
      return openModal(kind==='equity'?'حقوق الملكية':'صافي التدفق النقدي',`<div class="calculation-card"><h4>${kind==='equity'?'تكلفة الاشتراكات − الخصومات − المصروفات':'تكلفة الاشتراكات − الخصومات − المستحقات − المصروفات'}</h4><strong>${formula}</strong></div><div class="metric-list">${homeMetricRow('إجمالي تكلفة الاشتراكات',money(gross),'gross')}${homeMetricRow('إجمالي الخصومات',money(discount),'discounts')}${kind==='netcash'?homeMetricRow('المستحق من المشتركين',money(due),'debtors','debt'):''}${homeMetricRow('إجمالي المصروفات',money(expenses),'expenses','debt')}</div>`,'',true);
    }
    if(['balances','cashBalances','bankBalances'].includes(kind)){
      const type=kind==='cashBalances'?'cash':kind==='bankBalances'?'bank':'';
      const list=moves.filter(m=>{if(!type)return true;return [m.accountFromId,m.accountToId].filter(Boolean).some(id=>accountById(id)?.type===type);});
      return openModal(type==='cash'?'حركات الأرصدة النقدية':type==='bank'?'حركات الأرصدة البنكية':'جميع الحركات المالية',`<div class="list">${list.length?list.map(movementCard).join(''):emptyState('bank','لا توجد حركات','لا توجد حركات ضمن الفترة المحددة.')}</div>`,'',true);
    }
  }

  function quickExpense() {
    const accounts=financialAccounts();if(!accounts.length)return toast('أضف حساباً مالياً أولاً قبل تسجيل المصروف.','warning');
    openModal('اختيار الحساب للصرف',`<div class="field"><label for="quickExpenseAccount">الحساب المراد الصرف منه</label><select id="quickExpenseAccount">${accountOptions(accounts[0].id,'اختر الحساب')}</select><small>اختر الحساب ثم تابع لإضافة المصروف.</small></div>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="primary-button" data-action="continue-quick-expense">متابعة ${icon('chevron',17)}</button>`);
  }

  function openInquiryComposer() {
    if(!db.subscribers.length)return toast('لا يوجد مشتركون لإرسال الرسالة.','warning');
    const checks=db.subscribers.map(x=>`<label class="recipient-check"><input type="checkbox" value="${x.id}" checked><span>${esc(x.name)}</span><small dir="ltr">${esc(fullPhone(x))}</small></label>`).join('');
    const custom=(db.settings.customTemplates||[]).map((x,i)=>`<option value="custom-${i}">قالب إضافي ${i+1}</option>`).join('');
    openModal('رسالة استعلامية للمشتركين',`<div class="form-grid"><div class="full"><div class="field"><label for="inquiryTemplate">القالب</label><select id="inquiryTemplate"><option value="default">القالب العام</option>${custom}</select><small>يمكن إضافة قوالب إضافية من الإعدادات ← قوالب الرسائل.</small></div></div><div class="full">${textareaField('نص الرسالة','inquiryText',db.settings.templates?.inquiry||defaultTemplates().inquiry,'اكتب الرسالة...','يمكن استخدام {{name}} و {{today}} و {{manager}} وسيتم تخصيصها لكل مشترك.')}</div><div class="full"><div class="recipient-tools"><button type="button" class="ghost-button" data-action="select-all-recipients">تحديد الكل</button><button type="button" class="ghost-button" data-action="clear-all-recipients">إلغاء التحديد</button></div><div id="inquiryRecipients" class="recipient-list">${checks}</div></div></div>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="primary-button" data-action="prepare-inquiry">${icon('send',17)} تجهيز الإرسال</button>`,true);
    $('#inquiryTemplate')?.addEventListener('change',e=>{const v=e.target.value;$('#inquiryText').value=v==='default'?(db.settings.templates?.inquiry||defaultTemplates().inquiry):(db.settings.customTemplates?.[Number(v.split('-')[1])]||'');});
  }
  function prepareInquiry() {
    const text=$('#inquiryText')?.value||'';const ids=$$('#inquiryRecipients input:checked').map(x=>x.value);if(!text.trim()||!ids.length)return toast('اكتب الرسالة واختر مشتركاً واحداً على الأقل.','warning');
    const rows=ids.map(id=>{const sub=subscriberById(id);const msg=applyTemplate(text,{name:sub?.name||'',today:fmtDate(new Date(),true),manager:currentActorName()});return `<button class="send-option" data-action="send-inquiry-one" data-id="${id}" data-message="${encodeURIComponent(msg)}"><span class="soft-icon teal">${icon('message',20)}</span><span><strong>${esc(sub?.name||'')}</strong><small>فتح خيارات واتساب أو SMS</small></span></button>`}).join('');
    openModal('إرسال الرسالة',`<div class="send-sheet single-column">${rows}</div>`,'',true);
  }

  function reportTile(label,type,ic='file') {return `<button class="report-menu-tile" data-action="open-report" data-report="${type}" type="button"><span>${icon(ic,21)}</span><strong>${label}</strong><i>${icon('chevron',15)}</i></button>`;}
  function reportScopedPlans(){return db.subscriptions.filter(x=>inRange(x.createdAt||x.startDate,ui.reportDateFilter,ui.reportFrom,ui.reportTo));}
  function reportScopedMoves(){return db.movements.filter(x=>inRange(x.date||x.createdAt,ui.reportDateFilter,ui.reportFrom,ui.reportTo)).sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt));}
  function reportSubscriberAllowed(id){return !ui.reportSubscriberId||String(id)===String(ui.reportSubscriberId);}
  function renderReports() {
    $('#mainContent').innerHTML=`<div class="page reports-page">
      <div class="page-head"><div class="page-head-copy"><h2>التقارير</h2><p>تقارير تفصيلية تمر بالفترة الزمنية والمشترك المحدد</p></div></div>
      <section class="home-filter-card"><div class="section-title compact"><div><h3>فلترة التقارير</h3><p>اختر الفترة والمشترك قبل فتح التقرير</p></div></div><div class="filter-chips" id="reportDateChips">${dateFilterChips(ui.reportDateFilter)}</div><div id="reportCustomRange" class="custom-range ${ui.reportDateFilter==='custom'?'':'hidden'}"><label class="date-field">${icon('calendar',18)}<input id="reportFrom" type="date" value="${esc(ui.reportFrom)}"></label><label class="date-field">${icon('calendar',18)}<input id="reportTo" type="date" value="${esc(ui.reportTo)}"></label></div><div class="field report-subscriber-select"><label for="reportSubscriber">المشترك</label><select id="reportSubscriber"><option value="">جميع المشتركين</option>${db.subscribers.map(x=>`<option value="${x.id}" ${ui.reportSubscriberId===x.id?'selected':''}>${esc(x.name)} — ${esc(fullPhone(x))}</option>`).join('')}</select><small>اتركها على جميع المشتركين أو اختر مشتركاً واحداً.</small></div></section>
      <section class="report-category"><div class="section-title"><div><h3>تقارير المشتركين</h3><p>كشوف الأسماء والاستحقاقات والحسابات</p></div></div><div class="report-menu-grid">${reportTile('كشف المشتركين','subs-list','users')}${reportTile('المستحق عليهم','subs-debt','wallet')}${reportTile('المستحق لهم','subs-credit','wallet')}${reportTile('حسابات المشتركين','subs-accounts','chart')}</div></section>
      <section class="report-category"><div class="section-title"><div><h3>تقارير الاشتراكات</h3><p>التفاصيل العامة والفردية والحوالات</p></div></div><div class="report-menu-grid">${reportTile('تفاصيل كل الاشتراكات','plans-all','receipt')}${reportTile('تفاصيل كل مشترك','plans-person','users')}</div></section>
      <section class="report-category"><div class="section-title"><div><h3>تقارير الحسابات المالية</h3><p>إجمالي ومفصل وبنكي ونقدي</p></div></div><div class="report-menu-grid">${reportTile('إجمالي الحسابات','accounts-summary','bank')}${reportTile('الحركات المفصلة','accounts-detail','transfer')}${reportTile('ملخص الحسابات البنكية','bank-summary','bank')}${reportTile('كل حركات الحسابات البنكية','bank-detail','bank')}${reportTile('كل حساب بنكي على حدا','bank-each','bank')}${reportTile('ملخص الحسابات النقدية','cash-summary','wallet')}${reportTile('كل حركات الحسابات النقدية','cash-detail','wallet')}${reportTile('كل حساب نقدي على حدا','cash-each','wallet')}</div></section>
      <section class="report-category"><div class="section-title"><div><h3>تقارير المصروفات</h3><p>المبلغ والحساب والسبب والصارف والتاريخ</p></div></div><div class="report-menu-grid">${reportTile('كشف المصروفات','expenses','upload')}</div></section>
      <section class="report-category"><div class="section-title"><div><h3>تقارير الملخصات</h3><p>نفس ملخصات الصفحة الرئيسية ضمن الفترة</p></div></div><div class="report-menu-grid">${reportTile('ملخص المشتركين','summary-subs','users')}${reportTile('ملخص التدفقات النقدية','summary-flows','wallet')}${reportTile('ملخص الحسابات المالية','summary-accounts','bank')}</div></section>
    </div>`;
    $('#reportDateChips').addEventListener('click',e=>{const b=e.target.closest('[data-date-filter]');if(!b)return;ui.reportDateFilter=b.dataset.dateFilter;renderReports();});
    $('#reportFrom')?.addEventListener('change',e=>{ui.reportFrom=e.target.value;renderReports();});$('#reportTo')?.addEventListener('change',e=>{ui.reportTo=e.target.value;renderReports();});
    $('#reportSubscriber')?.addEventListener('change',e=>{ui.reportSubscriberId=e.target.value;});
  }
  function reportSubscriptionCard(x) {
    const sub=subscriberById(x.subscriberId),m=subscriptionMetrics(x),status=subscriptionStatus(x),remain=num(x.cost)-num(x.discount)-num(x.paid);
    return `<article class="report-result-card"><div class="report-card-head"><div><strong>${esc(sub?.name||'مشترك محذوف')}</strong><small dir="ltr">${esc(fullPhone(sub))}</small></div><span class="status-pill ${status[1]}">${status[0]}</span></div><div class="report-data-grid"><span>الشبكة<b>${esc(x.networkName||'—')}</b></span><span>النوع<b>${subscriptionTypeLabel(x.type)}</b></span><span>البداية<b>${fmtDate(x.startDate)}</b></span><span>النهاية<b>${x.type==='permanent'?'دائم':fmtDate(x.endDate)}</b></span><span>المتبقي<b>${m.remainingDays===null?'دائم':m.remainingDays+' يوم'}</b></span><span>التكلفة<b>${money(x.cost)}</b></span><span>المدفوع<b>${money(x.paid)}</b></span><span>الخصم<b>${money(x.discount)}</b></span><span>المتبقي المالي<b>${money(Math.abs(remain))}</b></span></div></article>`;
  }
  function openReport(type) {
    const plans=reportScopedPlans().filter(x=>reportSubscriberAllowed(x.subscriberId)),moves=reportScopedMoves().filter(x=>!x.subscriberId||reportSubscriberAllowed(x.subscriberId));
    const subs=db.subscribers.filter(x=>reportSubscriberAllowed(x.id));let title='التقرير',body='';
    if(type==='subs-list'){
      const filteredSubs=subs.filter(x=>inRange(x.createdAt,ui.reportDateFilter,ui.reportFrom,ui.reportTo));const rows=filteredSubs.map(x=>{const latest=[...subscriptionsFor(x.id)].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0],status=latest?subscriptionStatus(latest):['بدون اشتراك',''];return `<article class="report-result-card"><div class="report-card-head"><div><strong>${esc(x.name)}</strong><small dir="ltr">${esc(fullPhone(x))}</small></div><span class="status-pill ${status[1]}">${status[0]}</span></div><div class="report-data-grid"><span>نوع الاشتراك<b>${latest?subscriptionTypeLabel(latest.type):'—'}</b></span><span>تاريخ التسجيل<b>${fmtDate(x.createdAt)}</b></span></div></article>`;}).join('');const filteredIds=new Set(filteredSubs.map(x=>x.id));const totalAmount=reportScopedPlans().filter(x=>filteredIds.has(x.subscriberId)).reduce((a,x)=>a+num(x.cost),0);title='كشف المشتركين';body=`<div class="report-summary"><span>العدد ${filteredSubs.length}</span><strong>${money(totalAmount)}</strong></div>${rows||emptyState('users','لا توجد بيانات','لا توجد نتائج ضمن الفلترة.')}`;
    } else if(type==='subs-debt'||type==='subs-credit'){
      const debt=type==='subs-debt',items=subs.map(x=>({x,f:scopeFinancialForSubscriber(x.id,ui.reportDateFilter,ui.reportFrom,ui.reportTo),latest:[...subscriptionsFor(x.id)].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0]})).filter(o=>(debt?o.f.dueToUs:o.f.dueToSubscriber)>.009);
      const total=items.reduce((a,o)=>a+(debt?o.f.dueToUs:o.f.dueToSubscriber),0);title=debt?'كشف المستحق عليهم':'كشف المستحق لهم';body=`<div class="report-summary"><span>${items.length} مشترك</span><strong>${money(total)}</strong></div>${items.map(o=>{const m=o.latest?subscriptionMetrics(o.latest):null,status=o.latest?subscriptionStatus(o.latest):['—',''];return `<article class="report-result-card"><div class="report-card-head"><div><strong>${esc(o.x.name)}</strong><small dir="ltr">${esc(fullPhone(o.x))}</small></div><strong>${money(debt?o.f.dueToUs:o.f.dueToSubscriber)}</strong></div><div class="report-data-grid"><span>تكلفة الاشتراكات<b>${money(o.f.charges)}</b></span><span>المدفوع<b>${money(o.f.effectivePaid)}</b></span><span>تاريخ الاشتراك<b>${o.latest?fmtDate(o.latest.startDate):'—'}</b></span><span>المتبقي للاشتراك<b>${m?(m.remainingDays===null?'دائم':m.remainingDays+' يوم'):'—'}</b></span><span>الحالة<b>${status[0]}</b></span></div></article>`}).join('')||emptyState('users','لا توجد نتائج','لا توجد استحقاقات مطابقة.')}`;
    } else if(type==='subs-accounts'){
      title='تقرير حسابات المشتركين';body=subs.map(x=>{const f=scopeFinancialForSubscriber(x.id,ui.reportDateFilter,ui.reportFrom,ui.reportTo),ms=movementsFor(x.id).filter(m=>inRange(m.date||m.createdAt,ui.reportDateFilter,ui.reportFrom,ui.reportTo));return `<article class="report-result-card"><div class="report-card-head"><div><strong>${esc(x.name)}</strong><small dir="ltr">${esc(fullPhone(x))}</small></div><strong class="${f.signed>0?'amount-debt':'amount-credit'}">${money(Math.abs(f.signed))}</strong></div><div class="report-data-grid"><span>إجمالي التكلفة<b>${money(f.charges)}</b></span><span>إجمالي المدفوع<b>${money(f.effectivePaid)}</b></span><span>الاستحقاق<b>${f.signed>0?'عليه':'له'} ${money(Math.abs(f.signed))}</b></span><span>الحركات ضمن الفترة<b>${ms.length}</b></span><span>الاشتراكات<b>${subscriptionsFor(x.id).length}</b></span></div>${ms.slice(0,8).map(m=>`<div class="report-mini-move"><span>${movementTitle(m)} • ${fmtDate(m.date||m.createdAt,true)}</span><b>${money(m.amount)}</b></div>`).join('')}</article>`}).join('')||emptyState('users','لا توجد بيانات','') ;
    } else if(type==='plans-all'||type==='plans-person'){
      title=type==='plans-all'?'إجمالي تفاصيل الاشتراكات':'تفاصيل الاشتراكات لكل مشترك';
      if(type==='plans-all') body=`<div class="report-summary"><span>${plans.length} اشتراك</span><strong>${money(plans.reduce((a,x)=>a+num(x.cost),0))}</strong></div>${plans.map(reportSubscriptionCard).join('')||emptyState('receipt','لا توجد اشتراكات','')}`;
      else body=subs.map(sub=>{const ps=plans.filter(x=>x.subscriberId===sub.id),ms=moves.filter(x=>x.subscriberId===sub.id);if(!ps.length&&!ms.length)return '';return `<section class="report-person-group"><div class="section-title"><div><h3>${esc(sub.name)}</h3><p dir="ltr">${esc(fullPhone(sub))}</p></div></div>${ps.map(reportSubscriptionCard).join('')}${ms.map(m=>`<div class="report-mini-move"><span>${movementTitle(m)} • ${fmtDate(m.date||m.createdAt,true)}</span><b>${money(m.amount)}</b></div>`).join('')}</section>`}).join('')||emptyState('receipt','لا توجد بيانات','');
    } else if(type.startsWith('accounts')||type.startsWith('bank')||type.startsWith('cash')){
      const accountType=type.startsWith('bank')?'bank':type.startsWith('cash')?'cash':'';const accounts=db.accounts.filter(a=>!accountType||a.type===accountType);const accountIds=new Set(accounts.map(a=>a.id));const am=moves.filter(m=>[m.accountFromId,m.accountToId].some(id=>accountIds.has(id)));
      if(type.endsWith('summary')){title=accountType==='bank'?'ملخص الحسابات البنكية':accountType==='cash'?'ملخص الحسابات النقدية':'إجمالي الحسابات';const total=accounts.reduce((a,x)=>a+accountBalance(x.id),0);body=`<div class="report-summary"><span>${accounts.length} حساب</span><strong>${money(total)}</strong></div>${accounts.map(a=>`<article class="report-result-card"><div class="report-card-head"><div><strong>${esc(a.name)}</strong><small>${a.accountNumber?esc(a.accountNumber):a.type==='bank'?'بنكي':'نقدي'}</small></div><strong>${money(accountBalance(a.id))}</strong></div></article>`).join('')||emptyState('bank','لا توجد حسابات','')}`;}
      else if(type.endsWith('detail')){title=accountType==='bank'?'حركات الحسابات البنكية':accountType==='cash'?'حركات الحسابات النقدية':'الحركات المالية المفصلة';body=`<div class="report-summary"><span>عدد الحركات ${am.length}</span><strong>${money(am.reduce((a,x)=>a+num(x.amount),0))}</strong></div>${am.map(m=>`<article class="report-result-card"><div class="report-card-head"><div><strong>${movementTitle(m)}</strong><small>${fmtDate(m.date||m.createdAt,true)}</small></div><strong>${money(m.amount)}</strong></div><div class="report-data-grid"><span>من<b>${esc(accountById(m.accountFromId)?.name||'—')}</b></span><span>إلى<b>${esc(accountById(m.accountToId)?.name||'—')}</b></span><span>الاسم<b>${esc(subscriberById(m.subscriberId)?.name||m.spentBy||'—')}</b></span><span>ملاحظات<b>${esc(m.notes||'—')}</b></span></div></article>`).join('')||emptyState('transfer','لا توجد حركات','')}`;}
      else {title=accountType==='bank'?'كل حساب بنكي على حدا':'كل حساب نقدي على حدا';body=accounts.map(a=>{const rows=am.filter(m=>m.accountFromId===a.id||m.accountToId===a.id);return `<section class="report-person-group"><div class="report-card-head"><div><strong>${esc(a.name)}</strong><small>${a.accountNumber?esc(a.accountNumber):''}</small></div><strong>${money(accountBalance(a.id))}</strong></div><div class="report-summary small"><span>عدد الحركات ${rows.length}</span><strong>${money(rows.reduce((x,m)=>x+num(m.amount),0))}</strong></div>${rows.map(m=>`<div class="report-mini-move"><span>${movementTitle(m)} • ${fmtDate(m.date||m.createdAt,true)} • ${esc(m.notes||'')}</span><b>${money(m.amount)}</b></div>`).join('')||'<p class="muted">لا توجد حركات ضمن الفترة.</p>'}</section>`}).join('')||emptyState('bank','لا توجد حسابات','');}
    } else if(type==='expenses'){
      const items=moves.filter(x=>x.type==='account_expense'),total=items.reduce((a,x)=>a+num(x.amount),0);title='تقرير المصروفات';body=`<div class="report-summary"><span>عدد الحركات ${items.length}</span><strong>${money(total)}</strong></div>${items.map(m=>`<article class="report-result-card"><div class="report-card-head"><div><strong>${esc(m.spentBy||currentActorName())}</strong><small>${fmtDate(m.date||m.createdAt,true)}</small></div><strong class="amount-debt">${money(m.amount)}</strong></div><div class="report-data-grid"><span>الحساب المصروف منه<b>${esc(accountById(m.accountFromId)?.name||'—')}</b></span><span>سبب الصرف / الملاحظات<b>${esc(m.notes||'—')}</b></span></div></article>`).join('')||emptyState('wallet','لا توجد مصروفات','')}`;
    } else if(type.startsWith('summary-')){
      const hp=db.subscriptions.filter(x=>inRange(x.createdAt||x.startDate,ui.reportDateFilter,ui.reportFrom,ui.reportTo)),hm=db.movements.filter(x=>inRange(x.date||x.createdAt,ui.reportDateFilter,ui.reportFrom,ui.reportTo));
      if(type==='summary-subs'){title='ملخص المشتركين';body=`<div class="metric-list">${homeMetricRow('عدد المشتركين',db.subscribers.filter(x=>inRange(x.createdAt,ui.reportDateFilter,ui.reportFrom,ui.reportTo)).length,'subscribers')}${homeMetricRow('عدد الاشتراكات',hp.length,'subscriptions')}${homeMetricRow('الدائمة',hp.filter(x=>x.type==='permanent').length,'permanent')}${homeMetricRow('المؤقتة',hp.filter(x=>x.type==='temporary').length,'temporary')}${homeMetricRow('التجريبية',hp.filter(x=>x.type==='trial').length,'trial')}${homeMetricRow('المجمدة',hp.filter(x=>x.frozen).length,'frozen')}</div>`;}
      if(type==='summary-flows'){const gross=hp.reduce((a,x)=>a+num(x.cost),0),disc=hp.reduce((a,x)=>a+num(x.discount),0),exp=hm.filter(x=>x.type==='account_expense').reduce((a,x)=>a+num(x.amount),0),col=hp.reduce((a,x)=>a+num(x.paid),0)+hm.filter(x=>x.type==='collect').reduce((a,x)=>a+num(x.amount),0);title='ملخص التدفقات النقدية';body=`<div class="metric-list">${homeMetricRow('تكلفة الاشتراكات',money(gross),'gross')}${homeMetricRow('المبالغ المحصلة',money(col),'collected')}${homeMetricRow('الخصومات',money(disc),'discounts')}${homeMetricRow('المصروفات',money(exp),'expenses')}${homeMetricRow('حقوق الملكية',money(gross-disc-exp),'equity')}</div>`;}
      if(type==='summary-accounts'){title='ملخص الحسابات المالية';body=`<div class="metric-list">${homeMetricRow('إجمالي الأرصدة',money(totalAccountsBalance()),'balances')}${homeMetricRow('الأرصدة النقدية',money(totalAccountsBalance('cash')),'cashBalances')}${homeMetricRow('الأرصدة البنكية',money(totalAccountsBalance('bank')),'bankBalances')}</div>`;}
    }
    openModal(title,`<div class="report-output">${body}</div>`,'',true);
  }

  function chatMessagesFor(subId){return db.chats.filter(x=>x.subscriberId===subId).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));}
  function renderSupport() {
    if(!ui.chatSubscriberId&&db.subscribers[0])ui.chatSubscriberId=db.subscribers[0].id;
    const sub=subscriberById(ui.chatSubscriberId),messages=sub?chatMessagesFor(sub.id):[];
    $('#mainContent').innerHTML=`<div class="page support-page"><div class="page-head"><div class="page-head-copy"><h2>الدعم الفني</h2><p>الرسائل والصور والصوت تُحفظ محلياً وتُزامن تلقائياً عند توفر الإنترنت.</p></div></div>
      <div class="field"><label for="supportSubscriber">صاحب الاشتراك</label><select id="supportSubscriber"><option value="">اختر المشترك</option>${db.subscribers.map(x=>`<option value="${x.id}" ${x.id===ui.chatSubscriberId?'selected':''}>${esc(x.name)} — ${esc(fullPhone(x))}</option>`).join('')}</select><small>اختر المشترك لفتح محادثة الدعم الفني الخاصة به.</small></div>
      ${sub?`<section class="chat-shell"><div class="chat-head"><div class="avatar">${esc(sub.name.charAt(0))}</div><div><strong>${esc(sub.name)}</strong><small dir="ltr">${esc(fullPhone(sub))}</small></div><button class="mini-action teal" data-action="support-call" data-id="${sub.id}">${icon('phone',18)}</button></div><div id="chatThread" class="chat-thread">${messages.length?messages.map(chatBubble).join(''):emptyState('chat','لا توجد رسائل','ابدأ محادثة الدعم الفني من الحقل بالأسفل.')}</div><div class="chat-compose"><textarea id="supportMessage" placeholder="اكتب رسالة..."></textarea><div class="chat-tools"><button type="button" data-action="support-image" title="إرسال صورة">${icon('image',20)}</button><button type="button" id="supportMicBtn" data-action="support-voice" title="رسالة صوتية">${icon('mic',20)}</button><button type="button" class="send-chat" data-action="support-send" title="إرسال">${icon('send',20)}</button></div><input id="supportImageInput" type="file" accept="image/*" hidden></div></section>`:emptyState('chat','اختر مشتركاً','أضف مشتركاً أو اختر اسماً لفتح الدعم الفني.')}
    </div>`;
    $('#supportSubscriber')?.addEventListener('change',e=>{ui.chatSubscriberId=e.target.value;renderSupport();});
    $('#supportImageInput')?.addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=await compressImageToTarget(file,50*1024);saveChatMessage(sub.id,'image','',data);toast('تم ضغط الصورة وحفظها بحجم 50KB أو أقل.','success');renderSupport();}catch(_){toast('تعذر ضغط الصورة.','error');}});
    setTimeout(()=>{const thread=$('#chatThread');if(thread)thread.scrollTop=thread.scrollHeight;},40);
  }
  function chatBubble(m){return `<div class="chat-bubble ${m.sender==='subscriber'?'incoming':'outgoing'}"><small>${m.sender==='subscriber'?'المشترك':'أنت'}</small>${m.kind==='text'?`<p>${esc(m.text)}</p>`:m.kind==='image'?`<img src="${m.data}" alt="صورة في المحادثة">`:`<audio controls src="${m.data}"></audio>`}<time>${fmtDate(m.createdAt,true)}</time></div>`;}
  function saveChatMessage(subscriberId,kind,text='',data=''){db.chats.push({id:uid('chat'),subscriberId,sender:'manager',kind,text,data,createdAt:new Date().toISOString()});saveDB();logAction('support','رسالة دعم فني',`${subscriberById(subscriberId)?.name||''} • ${kind}`,subscriberId);}
  async function compressImageToTarget(file,targetBytes=51200){
    const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=reject;r.onload=()=>resolve(r.result);r.readAsDataURL(file)});const img=await new Promise((resolve,reject)=>{const i=new Image();i.onerror=reject;i.onload=()=>resolve(i);i.src=data});
    let max=Math.min(1100,Math.max(img.width,img.height)),quality=.82,last='';for(let round=0;round<30;round++){const scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale)),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);last=c.toDataURL('image/jpeg',quality);const bytes=Math.ceil((last.length-last.indexOf(',')-1)*3/4);if(bytes<=targetBytes)return last;if(quality>.28)quality-=.07;else {max=Math.max(140,Math.round(max*.76));quality=.42;}}const bytes=Math.ceil((last.length-last.indexOf(',')-1)*3/4);if(bytes>targetBytes)throw new Error('image-too-large');return last;
  }
  async function toggleVoiceRecording(subId){
    if(ui.voiceRecorder&&ui.voiceRecorder.state==='recording'){ui.voiceRecorder.stop();return;}
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return toast('التسجيل الصوتي يحتاج فتح التطبيق عبر HTTPS أو متصفح يدعم الميكروفون.','warning');
    try{const stream=await navigator.mediaDevices.getUserMedia({audio:true}),rec=new MediaRecorder(stream);ui.voiceChunks=[];ui.voiceRecorder=rec;rec.ondataavailable=e=>{if(e.data.size)ui.voiceChunks.push(e.data)};rec.onstop=()=>{const blob=new Blob(ui.voiceChunks,{type:rec.mimeType||'audio/webm'});const r=new FileReader();r.onload=()=>{saveChatMessage(subId,'audio','',r.result);stream.getTracks().forEach(t=>t.stop());ui.voiceRecorder=null;renderSupport();toast('تم حفظ الرسالة الصوتية.','success')};r.readAsDataURL(blob)};rec.start();$('#supportMicBtn')?.classList.add('recording');toast('بدأ التسجيل، اضغط زر الميكروفون مرة أخرى للإيقاف.','info');}catch(_){toast('تعذر الوصول إلى الميكروفون.','error');}
  }

  function renderTasks() {
    const list=[...db.tasks].filter(t=>ui.taskFilter==='all'||t.status===ui.taskFilter).sort((a,b)=>new Date(a.dueAt)-new Date(b.dueAt));
    $('#mainContent').innerHTML=`<div class="page"><div class="page-head has-mobile-fab"><div class="page-head-copy"><h2>المهام</h2><p>مهام بوقت إشعار وحالة نجاح أو فشل</p></div><div class="head-actions"><button class="secondary-button" data-action="add-task">${icon('plus',17)} إضافة مهمة</button></div></div><div class="flow-tabs task-tabs"><button class="flow-tab ${ui.taskFilter==='pending'?'active':''}" data-action="task-filter" data-filter="pending">قيد التنفيذ</button><button class="flow-tab ${ui.taskFilter==='success'?'active':''}" data-action="task-filter" data-filter="success">ناجحة</button><button class="flow-tab ${ui.taskFilter==='failed'?'active':''}" data-action="task-filter" data-filter="failed">فاشلة</button><button class="flow-tab ${ui.taskFilter==='all'?'active':''}" data-action="task-filter" data-filter="all">الكل</button></div><div class="list">${list.length?list.map(taskCard).join(''):emptyState('task','لا توجد مهام','أضف مهمة جديدة وحدد وقتها وفترة التنبيه.')}</div><div class="fab-row"><button class="fab" data-action="add-task">${icon('plus',19)} إضافة مهمة</button></div></div>`;
  }
  function taskCard(t){const cls=t.status==='success'?'amount-credit':t.status==='failed'?'amount-debt':'';return `<article class="list-card clickable" data-action="task-details" data-id="${t.id}"><div class="task-card"><span class="soft-icon ${t.status==='success'?'teal':t.status==='failed'?'red':'blue'}">${icon('task',20)}</span><div><strong>${esc(t.title)}</strong><small>${fmtDate(t.dueAt,true)} • إشعار قبل ${t.remindMinutes} دقيقة</small></div><span class="${cls}">${t.status==='success'?'ناجحة':t.status==='failed'?'فاشلة':'قيد التنفيذ'}</span></div></article>`;}
  function openAddTask(){openModal('إضافة مهمة',`<div class="form-grid"><div class="full">${field('عنوان المهمة','taskTitle','text','','مثال: متابعة اشتراك أحمد','عنوان واضح ومختصر.','required')}</div><div class="full">${textareaField('تفاصيل المهمة','taskNotes','','اكتب تفاصيل المهمة...','')}</div>${field('موعد المهمة','taskDue','datetime-local',nowLocalInput(),'','','required')}${field('فترة الإشعار قبل الموعد','taskReminder','number',String(db.settings.taskReminderMinutes||60),'60','بالدقائق.','min="0" step="5"')}</div>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="primary-button" data-action="save-task">${icon('save',17)} حفظ المهمة</button>`);}
  function saveTask(){const title=$('#taskTitle')?.value.trim();if(!title)return toast('اكتب عنوان المهمة.','warning');db.tasks.push({id:uid('task'),title,notes:$('#taskNotes')?.value.trim()||'',dueAt:new Date($('#taskDue').value).toISOString(),remindMinutes:num($('#taskReminder').value),status:'pending',notified:false,createdAt:new Date().toISOString()});saveDB();logAction('task','إضافة مهمة',title);closeModal();renderTasks();toast('تم حفظ المهمة.','success');}
  function openTaskDetails(id){const t=db.tasks.find(x=>x.id===id);if(!t)return;openModal('تفاصيل المهمة',`<div class="info-card" style="box-shadow:none"><div class="data-rows"><div class="data-row"><span>المهمة</span><b>${esc(t.title)}</b></div><div class="data-row"><span>الموعد</span><b>${fmtDate(t.dueAt,true)}</b></div><div class="data-row"><span>الإشعار</span><b>قبل ${t.remindMinutes} دقيقة</b></div><div class="data-row"><span>التفاصيل</span><b>${esc(t.notes||'—')}</b></div><div class="data-row"><span>الحالة</span><b>${t.status==='success'?'ناجحة':t.status==='failed'?'فاشلة':'قيد التنفيذ'}</b></div></div></div>`,t.status==='pending'?`<button class="danger-button" data-action="task-status" data-id="${t.id}" data-status="failed">فشل المهمة</button><button class="primary-button" data-action="task-status" data-id="${t.id}" data-status="success">${icon('check',17)} نجاح المهمة</button>`:'');}
  function updateTaskStatus(id,status){const t=db.tasks.find(x=>x.id===id);if(!t)return;t.status=status;t.completedAt=new Date().toISOString();saveDB();logAction('task',status==='success'?'نجاح مهمة':'فشل مهمة',t.title,t.id);closeModal();renderTasks();toast(status==='success'?'تم تسجيل نجاح المهمة.':'تم تسجيل فشل المهمة.',status==='success'?'success':'warning');}
  function checkTaskNotifications(){if(!db.settings.notificationsEnabled||db.settings.taskNotificationsEnabled===false)return;const now=Date.now();let changed=false;db.tasks.filter(t=>t.status==='pending'&&!t.notified).forEach(t=>{const when=new Date(t.dueAt).getTime()-num(t.remindMinutes)*60000;if(now>=when){t.notified=true;changed=true;toast(`تذكير بالمهمة: ${t.title}`,'warning');showSystemNotification('تذكير مهمة',t.title,'ahmadi-task-'+t.id);}});if(changed)saveDB();}

  function renderTimeline() {
    $('#mainContent').innerHTML=`<div class="page">
      <div class="page-head"><div class="page-head-copy"><h2>السجل الزمني</h2><p>جميع عمليات الإضافة والدفع والتحويل والتعديل</p></div></div>
      <div class="search-panel"><div class="search-box">${icon('search',20)}<input id="timelineSearch" placeholder="بحث في السجل بالاسم أو المبلغ أو العملية..."></div></div>
      <div class="filter-chips" id="timelineDateChips">${dateFilterChips(ui.dateFilter)}</div>
      <div id="timelineCustomRange" class="custom-range ${ui.dateFilter==='custom'?'':'hidden'}">${customRangeHtml('timeline')}</div>
      <div id="timelineList" class="list"></div>
    </div>`;
    const refresh=()=>{const q=($('#timelineSearch')?.value||'').trim().toLowerCase();const list=db.logs.filter(l=>matchesDateFilter(l.createdAt)&&(!q||`${l.title} ${l.detail} ${l.type}`.toLowerCase().includes(q)));$('#timelineList').innerHTML=list.length?list.map(timelineCard).join(''):emptyState('clock','لا توجد عمليات','ستظهر هنا العمليات التي تقوم بها داخل المنصة.');};
    $('#timelineSearch').addEventListener('input',refresh);
    $('#timelineDateChips').addEventListener('click',e=>{const b=e.target.closest('[data-date-filter]');if(!b)return;ui.dateFilter=b.dataset.dateFilter;renderTimeline();});
    $('#timelineFrom')?.addEventListener('change',e=>{ui.customFrom=e.target.value;refresh();});
    $('#timelineTo')?.addEventListener('change',e=>{ui.customTo=e.target.value;refresh();});
    refresh();
  }
  function timelineCard(l) {
    const iconName=l.type==='subscriber'?'users':l.type==='subscription'?'receipt':l.type==='account'?'bank':l.type==='transfer'?'transfer':l.type==='money'?'wallet':l.type==='task'?'task':l.type==='support'?'chat':'clock';
    return `<article class="list-card"><div class="timeline-item"><div class="timeline-marker">${icon(iconName,20)}</div><div class="timeline-body"><strong>${esc(l.title)}</strong><p>${esc(l.detail||'')}</p><time>${fmtDate(l.createdAt,true)}</time></div></div></article>`;
  }

  function employeePermissionsHtml(selected=[]) {
    const set=new Set(Array.isArray(selected)?selected:[]);
    return `<div class="permission-toolbar"><button type="button" class="ghost-button" data-action="employee-perm-all">تحديد الكل</button><button type="button" class="ghost-button" data-action="employee-perm-none">إلغاء الكل</button></div><div class="permission-groups">${PERMISSION_GROUPS.map(([group,items])=>`<section class="permission-group"><strong>${group}</strong><div>${items.map(([key,label])=>`<label class="permission-check"><input type="checkbox" value="${key}" ${set.has(key)?'checked':''}><span>${label}</span></label>`).join('')}</div></section>`).join('')}</div>`;
  }

  function employeeStatusLabel(row){return row.status==='inactive'?'موقوف':'فعال';}

  function renderEmployees() {
    if(!requirePermission('employees.view'))return go('home');
    $('#mainContent').innerHTML=`<div class="page employees-page"><div class="employee-summary"><div><span>الحساب الحالي</span><strong>${esc(currentActorName())}</strong><small>${isOwnerSession()?'صاحب مفتاح الشركة':'موظف'} • ${esc(activeSession?.companyName||'')}</small></div><span class="soft-icon teal">${icon('employee',23)}</span></div><div class="section-title"><div><h3>الموظفون</h3><p>لكل موظف كلمة مرور مستقلة وصلاحيات محددة داخل نفس مفتاح الشركة.</p></div>${can('employees.manage')?`<button class="secondary-button" data-action="add-employee">${icon('plus',17)} إضافة موظف</button>`:''}</div><div id="employeeList" class="list">${emptyState('employee','جارٍ تحميل الموظفين','سيظهر الموظفون هنا.')}</div>${can('employees.manage')?`<div class="fab-row"><button class="fab" data-action="add-employee">${icon('plus',20)}<span>إضافة موظف</span></button></div>`:''}</div>`;
    window.AhmadiCloud?.listEmployees?.(activeSession.companyId).then(rows=>{ui.employeeRows=Array.isArray(rows)?rows:[];drawEmployeeList();}).catch(error=>{ui.employeeRows=[];drawEmployeeList();toast(error.message||'تعذر تحديث الموظفين حالياً.','warning');});
  }

  function drawEmployeeList(){
    const root=$('#employeeList');if(!root)return;const rows=ui.employeeRows||[];
    root.innerHTML=rows.length?rows.map(row=>`<article class="list-card employee-card"><div class="employee-card-main"><span class="soft-icon ${row.status==='inactive'?'red':'teal'}">${icon('employee',20)}</span><div><strong>${esc(row.name||'موظف')}</strong><small>${(row.permissions||[]).length} صلاحية • آخر تحديث ${fmtDate(row.updated_at||row.created_at,true)}</small></div><span class="status-pill ${row.status==='inactive'?'status-expired':'status-active'}">${employeeStatusLabel(row)}</span></div>${can('employees.manage')?`<div class="employee-card-actions"><button class="mini-action" data-action="edit-employee" data-id="${row.id}" title="تعديل">${icon('edit',16)}</button><button class="mini-action ${row.status==='inactive'?'teal':'red'}" data-action="toggle-employee" data-id="${row.id}" data-status="${row.status}" title="${row.status==='inactive'?'تفعيل':'إيقاف'}">${icon(row.status==='inactive'?'play':'lock',16)}</button><button class="mini-action red" data-action="delete-employee" data-id="${row.id}" title="حذف">${icon('trash',16)}</button></div>`:''}</article>`).join(''):emptyState('employee','لا يوجد موظفون','أضف موظفاً وحدد صلاحياته وكلمة مروره الخاصة.');syncFloatingSpace();
  }

  function openEmployeeModal(id=''){
    if(!requirePermission('employees.manage'))return;
    const row=(ui.employeeRows||[]).find(x=>x.id===id);const editing=!!row;
    openModal(editing?'تعديل الموظف':'إضافة موظف',`<form id="employeeForm" class="form-grid"><div class="full">${field('اسم الموظف','employeeName','text',row?.name||'','مثال: محمد أحمد','سيظهر هذا الاسم في الهيدر والسجل عند دخول الموظف.','required')}</div><div class="full">${field(editing?'كلمة مرور جديدة':'كلمة مرور الموظف','employeePassword','password','','أدخل كلمة مرور خاصة بالموظف',editing?'اتركها فارغة إذا لم ترد تغييرها.':'4 خانات على الأقل.','autocomplete="new-password"')}</div>${editing?`<div class="full">${selectField('حالة الموظف','employeeStatus',[['active','فعال'],['inactive','موقوف']],row.status||'active','عند الإيقاف يتم إنهاء دخوله عند أول اتصال.')}</div>`:''}<div class="full permission-wrap"><div class="field-label-static">الصلاحيات الدقيقة</div>${employeePermissionsHtml(row?.permissions||[])}</div></form>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="primary-button" data-action="save-employee" data-id="${id}">${icon('save',17)} حفظ الموظف</button>`,true);
  }

  function selectedEmployeePermissions(){return $$('#employeeForm .permission-check input:checked').map(x=>x.value);}

  async function saveEmployee(id=''){
    if(!requirePermission('employees.manage'))return;const name=$('#employeeName')?.value.trim(),password=$('#employeePassword')?.value||'';if(!name)return toast('اكتب اسم الموظف.','warning');if(!id&&password.length<4)return toast('كلمة مرور الموظف يجب ألا تقل عن 4 خانات.','warning');
    const btn=$(`[data-action="save-employee"]`);if(btn)btn.disabled=true;
    try{const permissions=selectedEmployeePermissions();if(id)await window.AhmadiCloud.updateEmployee(activeSession.companyId,id,{name,password,status:$('#employeeStatus')?.value||'active',permissions});else await window.AhmadiCloud.createEmployee(activeSession.companyId,{name,password,permissions});closeModal();toast(id?'تم تحديث الموظف وصلاحياته.':'تم إضافة الموظف.','success');renderEmployees();}
    catch(error){toast(error.message||'تعذر حفظ الموظف.','error');}finally{if(btn)btn.disabled=false;}
  }

  async function toggleEmployee(id,status){
    if(!requirePermission('employees.manage'))return;if(id===activeSession?.employeeId)return toast('لا يمكنك إيقاف حسابك الحالي من نفس الجلسة.','warning');
    try{await window.AhmadiCloud.updateEmployee(activeSession.companyId,id,{status:status==='inactive'?'active':'inactive'});toast(status==='inactive'?'تم تفعيل الموظف.':'تم إيقاف الموظف.','success');renderEmployees();}catch(error){toast(error.message||'تعذر تحديث الموظف.','error');}
  }

  function confirmDeleteEmployee(id){
    if(!requirePermission('employees.manage'))return;if(id===activeSession?.employeeId)return toast('لا يمكنك حذف حسابك الحالي.','warning');const row=(ui.employeeRows||[]).find(x=>x.id===id);if(!row)return;
    openModal('حذف الموظف',`<div class="empty-state" style="border-color:#ffd9dd"><div class="soft-icon red">${icon('trash',23)}</div><strong>حذف ${esc(row.name)}</strong><p>سيتم إلغاء إمكانية دخوله بهذا الحساب. إذا كان الجهاز بدون إنترنت ينفذ الحذف محلياً ثم يرفع فور عودة الاتصال.</p></div>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="danger-button" data-action="confirm-delete-employee" data-id="${id}">حذف الموظف</button>`);
  }

  async function deleteEmployeeNow(id){if(!requirePermission('employees.manage'))return;try{await window.AhmadiCloud.deleteEmployee(activeSession.companyId,id);closeModal();toast('تم حذف الموظف.','success');renderEmployees();}catch(error){toast(error.message||'تعذر حذف الموظف.','error');}}

  function renderSettings() {
    const backupCount=db.backups.length;
    const cloud=window.AhmadiCloud?.getStatus?.()||{};
    const syncLabel=cloud.mode==='offline'?'بدون إنترنت':cloud.mode==='syncing'?'جارٍ المزامنة':cloud.mode==='error'?'مشكلة مزامنة':cloud.pending?'تغييرات معلقة':'متزامن';
    const cards=[];
    if(can('settings.templates'))cards.push(`<button class="settings-menu-card" data-action="settings-templates"><span class="soft-icon teal">${icon('template',22)}</span><span><strong>قوالب الرسائل</strong><small>7 قوالب قابلة للتعديل</small></span>${icon('chevron',17)}</button>`);
    if(can('settings.edit'))cards.push(`<button class="settings-menu-card" data-action="settings-platform"><span class="soft-icon blue">${icon('settings',22)}</span><span><strong>إعدادات المنصة الأساسية</strong><small>الاسم والأسعار والفترات</small></span>${icon('chevron',17)}</button>`);
    if(can('settings.backups'))cards.push(`<button class="settings-menu-card" data-action="settings-backups"><span class="soft-icon violet">${icon('download',22)}</span><span><strong>النسخ الاحتياطي</strong><small>${backupCount} عملية نسخة أو استيراد مسجلة</small></span>${icon('chevron',17)}</button>`);
    if(isOwnerSession())cards.push(`<button class="settings-menu-card" data-action="settings-login"><span class="soft-icon teal">${icon('key',22)}</span><span><strong>حساب الشركة</strong><small>المفتاح والصلاحية وتغيير كلمة المرور</small></span>${icon('chevron',17)}</button>`);
    if(can('settings.edit'))cards.push(`<button class="settings-menu-card" data-action="settings-app"><span class="soft-icon blue">${icon('globe',22)}</span><span><strong>التطبيق واللغة</strong><small>اللغة وتثبيت التطبيق</small></span>${icon('chevron',17)}</button>`);
    if(isOwnerSession())cards.push(`<button class="settings-menu-card" data-action="settings-admin"><span class="soft-icon violet">${icon('key',22)}</span><span><strong>لوحة إدارة مفاتيح الشركات</strong><small>إضافة وإيقاف وحذف المفاتيح ومددها</small></span>${icon('chevron',17)}</button>`);
    if(can('settings.notifications'))cards.push(`<button class="settings-menu-card" data-action="settings-notifications"><span class="soft-icon amber">${icon('bell',22)}</span><span><strong>الإشعارات</strong><small>${db.settings.notificationsEnabled?'مفعلة':'معطلة'} • المستحقات والانتهاء والعمليات</small></span>${icon('chevron',17)}</button>`);
    $('#mainContent').innerHTML=`<div class="page settings-hub"><div class="cloud-settings-strip"><span class="soft-icon teal">${icon('transfer',20)}</span><div><strong>${syncLabel}</strong><small>${cloud.pending?`${cloud.pending} مجموعة بيانات بانتظار الرفع`:'الحفظ محلي أولاً ثم المزامنة تلقائياً'}</small></div><button class="ghost-button" data-action="sync-now" type="button">مزامنة الآن</button></div><div class="settings-menu-grid">${cards.join('')}</div>${isOwnerSession()?`<section class="settings-card danger-zone"><h3>إعادة ضبط البيانات المحلية</h3><p>يمسح نسخة هذا الجهاز فقط، ثم يمكن إعادة استعادة البيانات المتزامنة.</p><button class="danger-button" data-action="reset-data">${icon('trash',17)} مسح بيانات هذا الجهاز</button></section>`:''}</div>`;
  }

  function openTemplateSettings(){
    const t={...defaultTemplates(),...(db.settings.templates||{})};const fields=[['summary','القالب الأول — الملخص'],['subscription','القالب الثاني — الاشتراكات'],['collect','القالب الثالث — التحصيل'],['send','القالب الرابع — إرسال الأموال'],['transferFrom','القالب الخامس — تحويل الأموال / المحول منه'],['transferTo','القالب السادس — تحويل الأموال / المحول إليه'],['inquiry','القالب السابع — رسالة عامة']];
    const custom=(db.settings.customTemplates||[]).map((text,i)=>`<div class="custom-template-row"><div class="field"><label for="customTpl_${i}">قالب إضافي ${i+1}</label><textarea id="customTpl_${i}" placeholder="اكتب قالباً إضافياً...">${esc(text)}</textarea><small>يظهر هذا القالب في إجراء الرسالة الاستعلامية.</small></div><button class="danger-icon-button" data-action="delete-custom-template" data-index="${i}" type="button">${icon('trash',17)}</button></div>`).join('');
    openModal('قوالب الرسائل',`<div class="template-stack">${fields.map(([k,l])=>textareaField(l,'tpl_'+k,t[k],'اكتب نص القالب...','المتغيرات مثل {{name}} و {{today}} و {{manager}} يتم استبدالها تلقائياً.')).join('')}<div class="template-divider"><strong>قوالب إضافية للرسائل الاستعلامية</strong><button type="button" class="secondary-button" data-action="add-custom-template">${icon('plus',17)} إضافة قالب</button></div>${custom||'<p class="muted">لا توجد قوالب إضافية حالياً.</p>'}</div>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="primary-button" data-action="save-templates">${icon('save',17)} حفظ القوالب</button>`,true);
  }
  function saveTemplates(){const keys=['summary','subscription','collect','send','transferFrom','transferTo','inquiry'];db.settings.templates={...defaultTemplates(),...(db.settings.templates||{})};keys.forEach(k=>db.settings.templates[k]=$('#tpl_'+k)?.value||'');db.settings.customTemplates=(db.settings.customTemplates||[]).map((_,i)=>$('#customTpl_'+i)?.value||'').filter(x=>x.trim());saveDB();logAction('settings','تعديل قوالب الرسائل','تم تحديث قوالب الرسائل');closeModal();toast('تم حفظ قوالب الرسائل.','success');}
  function addCustomTemplate(){db.settings.customTemplates=[...(db.settings.customTemplates||[]),''];saveDB();openTemplateSettings();setTimeout(()=>$('#customTpl_'+(db.settings.customTemplates.length-1))?.focus(),80);}
  function deleteCustomTemplate(index){db.settings.customTemplates.splice(Number(index),1);saveDB();openTemplateSettings();toast('تم حذف القالب الإضافي.','success');}
  function openPlatformSettings(){openModal('إعدادات المنصة الأساسية',`<div class="form-grid"><div class="full">${field('اسم المنصة','platformName','text',db.settings.appName,'الأحمدي لإدارة عدادات الكهرباء','يظهر في الواجهة والرسائل.','required')}</div>${field('تسعير الاشتراك الدائم','permanentPrice','number',String(db.settings.permanentPrice||0),'0.00','بالشيقل.','min="0" step="0.01"')}${field('خصم الاشتراك الدائم','permanentDiscount','number',String(db.settings.permanentDiscount||0),'0.00','بالشيقل.','min="0" step="0.01"')}${field('تسعير الاشتراك المؤقت للشهر','temporaryPrice','number',String(db.settings.temporaryMonthlyPrice||0),'0.00','بالشيقل.','min="0" step="0.01"')}${field('خصم الاشتراك المؤقت','temporaryDiscount','number',String(db.settings.temporaryDiscount||0),'0.00','بالشيقل.','min="0" step="0.01"')}${field('فترة الاشتراك التجريبي','trialDays','number',String(db.settings.trialDays||7),'7','بالأيام.','min="1" step="1"')}${field('فترة تنبيه الاشتراكات على وشك الانتهاء','expiryWarningDays','number',String(db.settings.expiryWarningDays||7),'7','بالأيام.','min="1" step="1"')}</div>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="primary-button" data-action="save-platform-settings">${icon('save',17)} حفظ</button>`,true);}
  function savePlatformSettings(){const name=$('#platformName')?.value.trim();if(!name)return toast('اسم المنصة مطلوب.','warning');Object.assign(db.settings,{appName:name,permanentPrice:num($('#permanentPrice').value),permanentDiscount:num($('#permanentDiscount').value),temporaryMonthlyPrice:num($('#temporaryPrice').value),temporaryDiscount:num($('#temporaryDiscount').value),trialDays:Math.max(1,num($('#trialDays').value)),expiryWarningDays:Math.max(1,num($('#expiryWarningDays').value))});saveDB();updateBranding();logAction('settings','تعديل إعدادات المنصة الأساسية',name);closeModal();renderSettings();toast('تم حفظ إعدادات المنصة.','success');}
  function openBackupSettings(){const rows=[...db.backups].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(x=>`<div class="backup-row"><span class="soft-icon ${x.kind==='import'?'blue':'teal'}">${icon(x.kind==='import'?'upload':'download',18)}</span><div><strong>${x.kind==='import'?'استيراد نسخة':'إنشاء نسخة'}</strong><small>${fmtDate(x.date,true)}${x.name?` • ${esc(x.name)}`:''}</small></div></div>`).join('');openModal('النسخ الاحتياطي',`<div class="summary-banner"><span>عدد عمليات النسخ والاستيراد</span><strong>${db.backups.length}</strong></div><div class="settings-actions"><button class="secondary-button" data-action="export-backup">${icon('download',17)} إنشاء وتنزيل نسخة</button><button class="ghost-button" data-action="import-backup">${icon('upload',17)} رفع نسخة واستيرادها</button></div><div class="backup-history">${rows||emptyState('download','لا يوجد سجل نسخ','أنشئ أول نسخة احتياطية وسيظهر تاريخها هنا.')}</div>`,'',true);}
  function notificationPermissionLabel(){if(!('Notification'in window))return 'غير مدعوم في هذا المتصفح';if(Notification.permission==='granted')return 'مسموح';if(Notification.permission==='denied')return 'محظور من إعدادات المتصفح';return 'لم يتم طلب السماح بعد';}
  function openNotificationSettings(){
    const state=db.settings.notificationState||{};
    openModal('الإشعارات',`
      <div class="notification-status-card"><span class="soft-icon amber">${icon('bell',20)}</span><div><strong>إشعارات منصة الأحمدي</strong><small>حالة إذن المتصفح: ${notificationPermissionLabel()}</small></div></div>
      <div class="settings-toggle-row master-toggle"><div><strong>تفعيل إشعارات المنصة</strong><small>المفتاح الرئيسي لجميع الإشعارات التالية.</small></div><label class="switch"><input id="notificationsEnabled" type="checkbox" ${db.settings.notificationsEnabled?'checked':''}><span></span></label></div>
      <div class="settings-toggle-row"><div><strong>المستحق عليهم</strong><small>إشعار كل 24 ساعة بعددهم وإجمالي المبلغ المستحق.</small></div><label class="switch"><input id="dailyDebtorsNotifications" type="checkbox" ${db.settings.dailyDebtorsNotifications!==false?'checked':''}><span></span></label></div>
      <div class="settings-toggle-row"><div><strong>الاشتراكات على وشك الانتهاء</strong><small>فحص يومي وإشعار بالاشتراكات التي اقترب موعد انتهائها.</small></div><label class="switch"><input id="dailyExpiryNotifications" type="checkbox" ${db.settings.dailyExpiryNotifications!==false?'checked':''}><span></span></label></div>
      ${field('التنبيه قبل انتهاء الاشتراك','notificationExpiryDays','number',String(db.settings.expiryWarningDays||7),'7','عدد الأيام قبل انتهاء الاشتراك.','min="1" step="1" inputmode="numeric"')}
      <div class="settings-toggle-row"><div><strong>إشعار عند إضافة أي عملية</strong><small>يظهر فور إضافة مشترك أو اشتراك أو دفعة أو مصروف أو تحويل أو حساب أو مهمة.</small></div><label class="switch"><input id="operationNotifications" type="checkbox" ${db.settings.operationNotifications!==false?'checked':''}><span></span></label></div>
      <div class="settings-toggle-row"><div><strong>إشعارات المهام</strong><small>تذكير بالمهام قبل موعدها حسب الفترة المحددة.</small></div><label class="switch"><input id="taskNotificationsEnabled" type="checkbox" ${db.settings.taskNotificationsEnabled!==false?'checked':''}><span></span></label></div>
      ${field('فترة تنبيه المهام','notificationMinutes','number',String(db.settings.taskReminderMinutes||60),'60','بالدقائق قبل موعد المهمة.','min="0" step="5"')}
      <div class="notification-last-check"><span>آخر إشعار مستحقات</span><b>${state.lastDebtorsAt?fmtDate(state.lastDebtorsAt,true):'لم يرسل بعد'}</b><span>آخر إشعار انتهاء</span><b>${state.lastExpiryAt?fmtDate(state.lastExpiryAt,true):'لم يرسل بعد'}</b></div>
      <button class="secondary-button wide" data-action="request-notifications">${icon('bell',17)} السماح بإشعارات المتصفح</button>
      <button class="ghost-button wide" data-action="test-notifications">${icon('send',17)} إرسال إشعار تجريبي</button>
    `,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="primary-button" data-action="save-notifications">${icon('save',17)} حفظ</button>`,true);
  }
  function saveNotifications(){
    db.settings.notificationsEnabled=!!$('#notificationsEnabled')?.checked;
    db.settings.dailyDebtorsNotifications=!!$('#dailyDebtorsNotifications')?.checked;
    db.settings.dailyExpiryNotifications=!!$('#dailyExpiryNotifications')?.checked;
    db.settings.operationNotifications=!!$('#operationNotifications')?.checked;
    db.settings.taskNotificationsEnabled=!!$('#taskNotificationsEnabled')?.checked;
    db.settings.taskReminderMinutes=Math.max(0,num($('#notificationMinutes')?.value));
    db.settings.expiryWarningDays=Math.max(1,num($('#notificationExpiryDays')?.value)||7);
    saveDB(); closeModal(); renderSettings(); toast('تم حفظ إعدادات الإشعارات.','success');
    if(db.settings.notificationsEnabled) checkAllNotifications(true);
  }
  async function requestNotifications(){
    if(!('Notification'in window))return toast('المتصفح لا يدعم إشعارات النظام.','warning');
    try{
      const p=await Notification.requestPermission();
      if(p==='granted'){toast('تم السماح بإشعارات النظام.','success');await registerPeriodicNotificationSync();checkAllNotifications(true);}
      else toast('لم يتم السماح بالإشعارات. يمكنك تفعيلها من إعدادات Chrome.','warning');
      openNotificationSettings();
    }catch(_){toast('تعذر طلب صلاحية الإشعارات.','error')}
  }
  async function testNotifications(){
    if(!db.settings.notificationsEnabled)return toast('فعّل إشعارات المنصة أولاً ثم احفظ الإعدادات.','warning');
    if(!('Notification'in window)||Notification.permission!=='granted')return toast('اضغط السماح بإشعارات المتصفح أولاً.','warning');
    const ok=await showSystemNotification('إشعار تجريبي','إشعارات منصة الأحمدي تعمل بنجاح.','ahmadi-test-'+Date.now());
    toast(ok?'تم إرسال الإشعار التجريبي.':'تعذر إرسال الإشعار التجريبي.',ok?'success':'error');
  }
  async function registerPeriodicNotificationSync(){
    if(!('serviceWorker'in navigator)||!/^https?:$/.test(location.protocol))return false;
    try{
      const reg=await navigator.serviceWorker.ready;
      if(!reg.periodicSync)return false;
      await reg.periodicSync.register('ahmadi-daily-check',{minInterval:DAILY_NOTIFICATION_MS});
      return true;
    }catch(_){return false;}
  }
  function openLoginSettings(){
    const expires=activeSession?.expiresAt?fmtDate(new Date(Number(activeSession.expiresAt)).toISOString(),true):'غير محدد';
    openModal('حساب الشركة',`<div class="form-grid">${field('مفتاح الشركة','settingsCompanyKey','text',activeSession?.companyKey||'','','يتم إنشاء المفتاح وإدارته من لوحة الأدمن.','readonly')}${field('انتهاء الصلاحية','settingsExpiry','text',expires,'','','readonly')}${field('كلمة مرور جديدة','settingsPassword','password','','اتركها فارغة بدون تغيير','سيتم تحديثها وتخزين اعتماد الدخول لهذا الجهاز.')}${field('تأكيد كلمة المرور','settingsPasswordConfirm','password','','أعد كتابة كلمة المرور','')}</div>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="primary-button" data-action="save-login-settings">${icon('save',17)} حفظ</button>`);
  }
  async function saveLoginSettings() {
    const password=$('#settingsPassword')?.value||'',confirm=$('#settingsPasswordConfirm')?.value||'';
    if(!password)return toast('اكتب كلمة المرور الجديدة أو أغلق النافذة بدون تغيير.','warning');
    if(password!==confirm)return toast('تأكيد كلمة المرور غير مطابق.','error');
    try{await window.AhmadiCloud.changeCompanyPassword(activeSession.companyId,password);activeSession.authHash=window.AhmadiCloud.sha256(password);localStorage.setItem(SESSION_KEY,JSON.stringify(activeSession));closeModal();toast('تم تغيير كلمة مرور الشركة.','success');}
    catch(error){toast(error.message||'تعذر تغيير كلمة المرور.','error');}
  }

  function exportBackup() {const snap={...db,exportedAt:new Date().toISOString()};const text=JSON.stringify(snap,null,2),blob=new Blob([text],{type:'application/json'}),a=document.createElement('a'),name=`ahmadi-backup-${dateOnlyInput()}-${Date.now()}.json`;a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);db.backups.push({id:uid('backup'),kind:'export',date:new Date().toISOString(),name,size:text.length});saveDB();toast('تم إنشاء النسخة الاحتياطية وتسجيل تاريخها.','success');if(getRoute().page==='settings')renderSettings();}
  async function importBackup(file) {if(!file)return;try{const text=await file.text(),parsed=JSON.parse(text);if(!parsed||!Array.isArray(parsed.subscribers)||!Array.isArray(parsed.subscriptions))throw new Error('bad');const oldHistory=[...db.backups];db={...defaultDB(),...parsed,settings:{...defaultDB().settings,...(parsed.settings||{}),templates:{...defaultTemplates(),...((parsed.settings||{}).templates||{})}},tasks:Array.isArray(parsed.tasks)?parsed.tasks:[],chats:Array.isArray(parsed.chats)?parsed.chats:[],backups:Array.isArray(parsed.backups)?parsed.backups:[]};db.backups=[...db.backups,...oldHistory,{id:uid('backup'),kind:'import',date:new Date().toISOString(),name:file.name,size:file.size||text.length}].slice(-100);saveDB();logAction('settings','استيراد نسخة احتياطية',file.name);toast('تم استيراد النسخة بنجاح.','success');renderRoute();updateBranding();}catch(e){toast('الملف غير صالح كنسخة احتياطية.','error');}}

  async function syncNowManual(){
    if(!window.AhmadiCloud)return toast('وحدة المزامنة غير متاحة.','error');
    try{await window.AhmadiCloud.syncNow();toast('تمت مزامنة البيانات.','success');if(getRoute().page==='settings')renderSettings();}
    catch(error){toast(error.message||'تعذر تنفيذ المزامنة الآن.','error');}
  }
  function openAdminConsole(){window.open('admin.html','_blank','noopener');}

  function resetDataConfirm() {
    openModal('تأكيد مسح البيانات',`<div class="empty-state" style="border-color:#ffd9dd"><div class="soft-icon red">${icon('trash',23)}</div><strong>سيتم حذف بيانات المنصة</strong><p>سيتم مسح نسخة بيانات هذا الجهاز فقط. بيانات الدخول لا يتم حفظها داخل قاعدة بيانات المنصة المحلية.</p></div>`,`<button class="ghost-button" data-action="close-modal">إلغاء</button><button class="danger-button" data-action="confirm-reset">مسح البيانات</button>`);
  }
  async function confirmReset() { localStorage.removeItem(companyDbKey()); db=defaultDB(); persistLocalOnly(); refreshSyncBaseline(); closeModal(); toast('تم مسح نسخة هذا الجهاز. جارٍ استعادة البيانات المتزامنة...','success'); try{await window.AhmadiCloud?.pullChanges?.(true);}catch(_){} go('home'); }

  function openSendOptions(subId,message,title='إرسال رسالة') {
    const s=subscriberById(subId);if(!s)return;
    openModal(title,`<div class="send-sheet"><button class="send-option" data-action="send-whatsapp" data-id="${subId}" data-message="${encodeURIComponent(message)}"><span class="soft-icon teal">${icon('message',22)}</span><span><strong>واتساب</strong><small>إرسال الرسالة عبر WhatsApp</small></span></button><button class="send-option" data-action="send-sms" data-id="${subId}" data-message="${encodeURIComponent(message)}"><span class="soft-icon blue">${icon('send',22)}</span><span><strong>رسالة SMS</strong><small>فتح تطبيق الرسائل بالنص جاهزاً</small></span></button></div>`);
  }
  function launchWhatsApp(subId,message) { const s=subscriberById(subId);if(!s)return;window.open(`https://wa.me/${whatsappPhone(s)}?text=${encodeURIComponent(message)}`,'_blank','noopener'); }
  function launchSms(subId,message) { const s=subscriberById(subId);if(!s)return;location.href=`sms:${fullPhone(s)}?body=${encodeURIComponent(message)}`; }

  function openGlobalSearch() {
    openModal('بحث سريع',`<div class="search-panel"><div class="search-box">${icon('search',20)}<input id="globalSearchInput" autofocus placeholder="ابحث باسم مشترك، هاتف، شبكة أو حساب..."></div></div><div id="globalSearchResults" class="list" style="margin-top:12px"></div>`);
    const run=()=>{const q=($('#globalSearchInput')?.value||'').trim().toLowerCase();if(!q){$('#globalSearchResults').innerHTML=emptyState('search','ابدأ الكتابة','ابحث عن مشترك أو شبكة اشتراك أو حساب مالي.');return;}const subs=db.subscribers.filter(s=>`${s.name} ${fullPhone(s)}`.toLowerCase().includes(q)).slice(0,5);const plans=db.subscriptions.filter(p=>`${p.networkName} ${subscriberById(p.subscriberId)?.name||''}`.toLowerCase().includes(q)).slice(0,5);const accs=db.accounts.filter(a=>`${a.name} ${a.accountNumber||''}`.toLowerCase().includes(q)).slice(0,5);$('#globalSearchResults').innerHTML=[...subs.map(s=>`<button class="list-card clickable" data-action="global-open-subscriber" data-id="${s.id}" style="text-align:start;width:100%"><strong>${esc(s.name)}</strong><div style="font-size:10px;color:#9aa5ad" dir="ltr">${esc(fullPhone(s))}</div></button>`),...plans.map(p=>`<button class="list-card clickable" data-action="global-open-subscriptions" style="text-align:start;width:100%"><strong>${esc(p.networkName)}</strong><div style="font-size:10px;color:#9aa5ad">اشتراك • ${esc(subscriberById(p.subscriberId)?.name||'')}</div></button>`),...accs.map(a=>`<button class="list-card clickable" data-action="global-open-accounts" style="text-align:start;width:100%"><strong>${esc(a.name)}</strong><div style="font-size:10px;color:#9aa5ad">حساب مالي • ${money(accountBalance(a.id))}</div></button>`)].join('')||emptyState('search','لا توجد نتائج','جرّب كلمة أخرى.');};
    $('#globalSearchInput').addEventListener('input',run);run();setTimeout(()=>$('#globalSearchInput')?.focus(),60);
  }

  async function installApp() {
    if (window.matchMedia('(display-mode: standalone)').matches) return toast('التطبيق مثبت ويعمل كتطبيق مستقل.','success');
    if (ui.deferredInstall) { ui.deferredInstall.prompt(); const choice=await ui.deferredInstall.userChoice; ui.deferredInstall=null; if(choice.outcome==='accepted')toast('تم بدء تثبيت التطبيق.','success'); return; }
    toast(location.protocol==='file:'?'زر التثبيت يعمل بعد فتح الموقع من Chrome عبر HTTPS أو localhost.':'من Chrome افتح القائمة ⋮ واختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.');
  }

  function initStaticIcons() {
    $('#drawerBtn').innerHTML=icon('menu',21);$('#drawerClose').innerHTML=icon('x',20);const headerInstallIcon=$('#headerInstallIcon');if(headerInstallIcon)headerInstallIcon.innerHTML=icon('download',18);else $('#installBtn').innerHTML=icon('download',20);$('#loginInstallBtn').innerHTML=icon('download',19);$('#quickSearchBtn').innerHTML=icon('search',20);$('#toggleLoginPassword').innerHTML=icon('eye',19);
    const slot=$('.drawer-install-icon');if(slot)slot.innerHTML=icon('download',18);
    const logoutSlot=$('#drawerLogoutIcon');if(logoutSlot)logoutSlot.innerHTML=icon('logout',18);
  }

  function actionPermission(action){
    return ({
      'add-subscriber':'subscribers.add','save-subscriber':'subscribers.add',
      'add-subscription':'subscriptions.add','save-subscription':'subscriptions.add',
      'collect-payment':'flows.collect','send-payment':'flows.send','open-payment':'flows.view','save-payment':'flows.collect',
      'quick-expense':'flows.expense','continue-quick-expense':'flows.expense','account-expense':'flows.expense','save-account-money':'flows.expense',
      'add-account':'accounts.add','save-account':'accounts.add','account-edit':'accounts.edit',
      'edit-movement':'flows.edit','save-edit-movement':'flows.edit',
      'open-report':'reports.view',
      'settings-templates':'settings.templates','save-templates':'settings.templates','add-custom-template':'settings.templates','delete-custom-template':'settings.templates',
      'settings-platform':'settings.edit','save-platform-settings':'settings.edit','settings-backups':'settings.backups','settings-notifications':'settings.notifications','save-notifications':'settings.notifications',
      'request-notifications':'settings.notifications','test-notifications':'settings.notifications','settings-app':'settings.edit','save-app-settings':'settings.edit',
      'support-send':'support.send','support-image':'support.send','support-voice':'support.send',
      'add-task':'tasks.manage','save-task':'tasks.manage','task-status':'tasks.manage',
      'add-employee':'employees.manage','edit-employee':'employees.manage','save-employee':'employees.manage','toggle-employee':'employees.manage','delete-employee':'employees.manage','confirm-delete-employee':'employees.manage'
    })[action] || '';
  }
  function actionAllowed(action,el=null){
    if(action==='transfer-account'||action==='save-transfer')return can('flows.transfer')||can('accounts.transfer');
    if(action==='account-deposit')return can('flows.collect')||can('accounts.edit');
    if(action==='save-payment')return el?.dataset?.mode==='send'?can('flows.send'):can('flows.collect');
    if(action==='open-payment')return el?.dataset?.mode==='send'?can('flows.send'):can('flows.collect');
    if(action==='save-account-money')return el?.dataset?.mode==='deposit'?(can('flows.collect')||can('accounts.edit')):can('flows.expense');
    if(action==='settings-login'||action==='settings-admin'||action==='reset-data'||action==='confirm-reset')return isOwnerSession();
    const perm=actionPermission(action);return !perm||can(perm);
  }

  function handleAction(e) {
    const clickedFab=e.target.closest('.fab-row');
    if(!clickedFab)closeFabMenus();
    const routeEl=e.target.closest('[data-route]');if(routeEl){e.preventDefault();closeFabMenus();closeDrawer();go(routeEl.dataset.route);return;}
    const el=e.target.closest('[data-action]');if(!el)return;const action=el.dataset.action;
    if(action==='toggle-fab-menu'){e.preventDefault();e.stopPropagation();const row=el.closest('.fab-row');if(!row)return;const open=!row.classList.contains('open');closeFabMenus(row);row.classList.toggle('open',open);el.setAttribute('aria-expanded',String(open));return;}
    if(clickedFab)closeFabMenus();
    if(!actionAllowed(action,el))return toast('ليس لديك صلاحية لتنفيذ هذا الإجراء.','warning');
    if(action==='open-drawer')return openDrawer();
    if(action==='close-modal')return closeModal();
    if(action==='modal-backdrop'&&e.target===el)return closeModal();
    if(action==='install-app')return installApp();
    if(action==='add-subscriber')return openAddSubscriber();
    if(action==='save-subscriber')return saveSubscriber();
    if(action==='open-subscriber'||action==='global-open-subscriber'){closeModal();ui.currentSubscriberTab='overview';return go('subscriber',el.dataset.id);}
    if(action==='call-subscriber'){e.stopPropagation();const s=subscriberById(el.dataset.id);if(s)location.href=`tel:${fullPhone(s)}`;return;}
    if(action==='wa-subscriber'){e.stopPropagation();const s=subscriberById(el.dataset.id);if(s)launchWhatsApp(s.id,buildSubscriberMessage(s));return;}
    if(action==='message-subscriber'){e.stopPropagation();const s=subscriberById(el.dataset.id);if(s)openSendOptions(s.id,buildSubscriberMessage(s),'إرسال تفاصيل المشترك');return;}
    if(action==='subscriber-tab'){ui.currentSubscriberTab=el.dataset.tab;return renderSubscriber(getRoute().id);}
    if(action==='add-subscription')return openAddSubscription(el.dataset.subscriber||'');
    if(action==='save-subscription')return saveSubscription(el.dataset.send==='1');
    if(action==='subscription-message'){const s=db.subscriptions.find(x=>x.id===el.dataset.id);if(s)return openSendOptions(s.subscriberId,buildSubscriptionMessage(s),'إرسال تفاصيل الاشتراك');}
    if(action==='flow-tab'){ui.flowTab=el.dataset.tab;return renderFlows();}
    if(action==='collect-payment')return openCollectChooser('collect');
    if(action==='send-payment')return openCollectChooser('send');
    if(action==='open-payment'){e.stopPropagation();return openPaymentModal(el.dataset.id,el.dataset.mode);}
    if(action==='pick-receipt')return $('#receiptFile')?.click();
    if(action==='camera-receipt')return $('#receiptCamera')?.click();
    if(action==='save-payment')return savePayment(el.dataset.id,el.dataset.mode,el.dataset.send==='1');
    if(action==='send-movement'){const m=db.movements.find(x=>x.id===el.dataset.id);if(m&&m.subscriberId)return openSendOptions(m.subscriberId,buildPaymentMessage(m),'إرسال الحركة المالية');}
    if(action==='account-tab'){ui.accountTab=el.dataset.tab;ui.accountTypeFilter='all';return renderAccounts();}
    if(action==='add-account')return openAddAccount();
    if(action==='account-edit')return openAddAccount(el.dataset.id);
    if(action==='save-account')return saveAccount(el.dataset.id||'');
    if(action==='account-deposit')return openAccountMoney(el.dataset.id,'deposit');
    if(action==='account-expense')return openAccountMoney(el.dataset.id,'expense');
    if(action==='save-account-money')return saveAccountMoney(el.dataset.id,el.dataset.mode);
    if(action==='transfer-account')return openTransferModal();
    if(action==='save-transfer')return saveTransfer();
    if(action==='show-account-movements'){ui.accountTab='movements';ui.accountTypeFilter=el.dataset.type||'all';return renderAccounts();}
    if(action==='movement-details')return openMovementDetails(el.dataset.id);
    if(action==='edit-movement')return openEditMovement(el.dataset.id);
    if(action==='save-edit-movement')return saveEditMovement(el.dataset.id);
    if(action==='follow-subscriptions'){ui.subscriptionFilter='all';return go('subscriptions');}
    if(action==='home-metric')return homeMetricModal(el.dataset.kind);
    if(action==='quick-expense')return quickExpense();
    if(action==='continue-quick-expense'){const id=$('#quickExpenseAccount')?.value;if(!id)return toast('اختر الحساب.','warning');closeModal();return openAccountMoney(id,'expense');}
    if(action==='open-inquiry')return openInquiryComposer();
    if(action==='select-all-recipients'){ $$('#inquiryRecipients input').forEach(x=>x.checked=true); return; }
    if(action==='clear-all-recipients'){ $$('#inquiryRecipients input').forEach(x=>x.checked=false); return; }
    if(action==='prepare-inquiry')return prepareInquiry();
    if(action==='send-inquiry-one'){const msg=decodeURIComponent(el.dataset.message||'');return openSendOptions(el.dataset.id,msg,'إرسال الرسالة');}
    if(action==='open-report')return openReport(el.dataset.report);
    if(action==='settings-templates')return openTemplateSettings();
    if(action==='save-templates')return saveTemplates();
    if(action==='add-custom-template')return addCustomTemplate();
    if(action==='delete-custom-template')return deleteCustomTemplate(el.dataset.index);
    if(action==='settings-platform')return openPlatformSettings();
    if(action==='save-platform-settings')return savePlatformSettings();
    if(action==='settings-backups')return openBackupSettings();
    if(action==='settings-notifications')return openNotificationSettings();
    if(action==='save-notifications')return saveNotifications();
    if(action==='request-notifications')return requestNotifications();
    if(action==='test-notifications')return testNotifications();
    if(action==='settings-login')return openLoginSettings();
    if(action==='settings-admin')return openAdminConsole();
    if(action==='sync-now')return syncNowManual();
    if(action==='settings-app')return openAppSettings();
    if(action==='save-app-settings')return saveAppSettings();
    if(action==='support-send'){const sub=subscriberById(ui.chatSubscriberId),text=$('#supportMessage')?.value.trim();if(!sub||!text)return toast('اكتب الرسالة أولاً.','warning');saveChatMessage(sub.id,'text',text);return renderSupport();}
    if(action==='support-image')return $('#supportImageInput')?.click();
    if(action==='support-voice')return ui.chatSubscriberId?toggleVoiceRecording(ui.chatSubscriberId):toast('اختر المشترك أولاً.','warning');
    if(action==='support-call'){const sub=subscriberById(el.dataset.id);if(sub)location.href=`tel:${fullPhone(sub)}`;return;}
    if(action==='add-task')return openAddTask();
    if(action==='save-task')return saveTask();
    if(action==='task-filter'){ui.taskFilter=el.dataset.filter;return renderTasks();}
    if(action==='task-details')return openTaskDetails(el.dataset.id);
    if(action==='task-status')return updateTaskStatus(el.dataset.id,el.dataset.status);
    if(action==='add-employee')return openEmployeeModal();
    if(action==='edit-employee')return openEmployeeModal(el.dataset.id);
    if(action==='save-employee')return saveEmployee(el.dataset.id||'');
    if(action==='toggle-employee')return toggleEmployee(el.dataset.id,el.dataset.status);
    if(action==='delete-employee')return confirmDeleteEmployee(el.dataset.id);
    if(action==='confirm-delete-employee')return deleteEmployeeNow(el.dataset.id);
    if(action==='employee-perm-all'){$$('#employeeForm .permission-check input').forEach(x=>x.checked=true);return;}
    if(action==='employee-perm-none'){$$('#employeeForm .permission-check input').forEach(x=>x.checked=false);return;}
    if(action==='send-transfer-from'){const m=db.movements.find(x=>x.id===el.dataset.id);if(m&&m.subscriberFromId)return openSendOptions(m.subscriberFromId,buildTransferMessage(m,'from'),'إشعار التحويل');}
    if(action==='send-transfer-to'){const m=db.movements.find(x=>x.id===el.dataset.id);if(m&&m.subscriberToId)return openSendOptions(m.subscriberToId,buildTransferMessage(m,'to'),'إشعار التحويل');}
    if(action==='save-login-settings')return saveLoginSettings();
    if(action==='export-backup')return exportBackup();
    if(action==='import-backup')return $('#backupImportInput').click();
    if(action==='reset-data')return resetDataConfirm();
    if(action==='confirm-reset')return confirmReset();
    if(action==='logout')return logout();
    if(action==='send-whatsapp'){const msg=decodeURIComponent(el.dataset.message||'');closeModal();return launchWhatsApp(el.dataset.id,msg);}
    if(action==='send-sms'){const msg=decodeURIComponent(el.dataset.message||'');closeModal();return launchSms(el.dataset.id,msg);}
    if(action==='global-open-subscriptions'){closeModal();return go('subscriptions');}
    if(action==='global-open-accounts'){closeModal();return go('accounts');}
  }

  function logout(showMessage=true){localStorage.removeItem(SESSION_KEY);window.AhmadiCloud?.detach?.();activeSession=null;db=defaultDB();refreshSyncBaseline();closeDrawer();location.hash='';showLogin();if(showMessage)toast('تم تسجيل الخروج.');}

  async function refreshActiveAccess(showError=false){
    if(!isLogged()||navigator.onLine===false||!window.AhmadiCloud)return true;
    try{
      const before=JSON.stringify({k:activeSession.companyKey,n:activeSession.actorName,p:activeSession.permissions,o:activeSession.ownerName,t:activeSession.actorType});
      const valid=await window.AhmadiCloud.validateCompany(activeSession);
      if(!valid){toast('تم إيقاف الحساب أو حذفه أو انتهت صلاحيته.','error');logout(false);return false;}
      activeSession={...activeSession,...valid};localStorage.setItem(SESSION_KEY,JSON.stringify(activeSession));localStorage.setItem(LAST_KEY,activeSession.companyKey||'');
      const after=JSON.stringify({k:activeSession.companyKey,n:activeSession.actorName,p:activeSession.permissions,o:activeSession.ownerName,t:activeSession.actorType});
      if(before!==after){updateBranding();renderNav();const route=getRoute().page;if(!can(routePermission(route)))go('home');else renderRoute();}
      else if(getRoute().page==='employees'&&can('employees.view')&&window.AhmadiCloud?.listEmployees){
        window.AhmadiCloud.listEmployees(activeSession.companyId).then(rows=>{ui.employeeRows=Array.isArray(rows)?rows:[];drawEmployeeList();}).catch(()=>{});
      }
      return true;
    }catch(error){if(showError)toast(error.message||'تعذر تحديث صلاحيات الحساب.','warning');return false;}
  }

  function init() {
    initStaticIcons();updateBranding();window.AhmadiCloud?.onStatus?.(updateCloudStatusUI);
    const interfaceObserver = new MutationObserver(() => {
      syncFloatingSpace();
      enhanceAllSelects(document);
      applyDateDefaults(document);
    });
    interfaceObserver.observe(document.body,{childList:true,subtree:true});
    enhanceAllSelects(document);
    applyDateDefaults(document);
    syncFloatingSpace();
    document.addEventListener('click',handleAction);
    window.addEventListener('hashchange',()=>{if(isLogged())renderRoute();});
    window.addEventListener('resize',()=>{syncFloatingSpace();if(activeSelectUi)positionSmartSelect(activeSelectUi.pop,activeSelectUi.trigger);},{passive:true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeFabMenus();closeDrawer();}});
    $('#drawerBtn').addEventListener('click',openDrawer);$('#drawerClose').addEventListener('click',closeDrawer);$('#drawerBackdrop').addEventListener('click',closeDrawer);$('#installBtn').addEventListener('click',installApp);$('#loginInstallBtn').addEventListener('click',installApp);$('#quickSearchBtn').addEventListener('click',openGlobalSearch);
    $('#langAr').addEventListener('click',()=>{db.settings.language='ar';saveDB();updateLanguageUI();});$('#langEn').addEventListener('click',()=>{db.settings.language='en';saveDB();updateLanguageUI();});
    $('#toggleLoginPassword').addEventListener('click',()=>{const input=$('#passwordInput');const hidden=input.type==='password';input.type=hidden?'text':'password';$('#toggleLoginPassword').innerHTML=icon(hidden?'eyeoff':'eye',19);});
    $('#loginForm').addEventListener('submit',e=>{e.preventDefault();const key=$('#companyKeyInput').value.trim(),pass=$('#passwordInput').value;loginWithCompanyKey(key,pass);});
    $('#backupImportInput').addEventListener('change',e=>{importBackup(e.target.files[0]);e.target.value='';});
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();ui.deferredInstall=e;});
    window.addEventListener('appinstalled',()=>{ui.deferredInstall=null;toast('تم تثبيت التطبيق.','success');});
    updateLanguageUI();
    refreshSyncBaseline();
    if(isLogged())resumeCloudSession();else showLogin();
    setInterval(()=>{if(isLogged())checkAllNotifications();},60000);
    setInterval(()=>{refreshActiveAccess(false);},20000);
    window.addEventListener('online',()=>setTimeout(()=>refreshActiveAccess(false),900));
    window.addEventListener('focus',()=>refreshActiveAccess(false));
    if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').then(()=>{syncNotificationSnapshotToServiceWorker();if(db.settings.notificationsEnabled&&'Notification'in window&&Notification.permission==='granted')registerPeriodicNotificationSync();}).catch(()=>{});
  }

  document.addEventListener('DOMContentLoaded',init);
})();
