// ── CONFIG ──
const API = 'https://script.google.com/macros/s/AKfycbz9HrQuPhqcWLmIatSKKecRnz5xHMQz89PGH8CibdwdZT9wtQsxP3Z1A47_S1wU_hou7A/exec';
const WA = '213655295217';
const CODE = 'CNSy7zbs';

// ── API CALLER (Robust & No Content-Type for CORS) ──
async function callAPI(data) {
  try {
    console.log('API Request:', data.action, data);
    const response = await fetch(API, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const result = await response.json();
    console.log('API Response:', result);
    return result;
  } catch (err) {
    console.error('API Error:', err);
    toast('خطأ في الاتصال بالخادم', 'er');
    return { status: 'error', message: err.toString() };
  }
}

// ── LOCAL STORAGE HELPERS ──
const getDB = (key, def = []) => JSON.parse(localStorage.getItem(key)) || def;
const setDB = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ── ADMIN GALLERY ──
const adminGallery = [
  'images/d8206835e100174a6affd66aa0c52f34.jpg',
  'images/063dbae28cb9f7a6b7ddcd9aaadf6e7d.jpg',
  'images/821f4ffeb9b5ce726b26ea98bf2046ed.jpg',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
  'https://images.unsplash.com/photo-1519704943960-da38fe972a93?w=400',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
  'https://images.unsplash.com/photo-1441984969733-5435bb757ffb?w=400',
  'https://images.unsplash.com/photo-1472806426350-60358bd456cf?w=400'
];

// ── PRODUCTS ──
let prods = [];

async function loadProds() {
  const res = await callAPI({ action: 'getProducts' });
  if (res.status === 'success') {
    prods = res.products.map(p => ({
      ...p,
      price: +p.price,
      oldPrice: +p.oldPrice || 0,
      qty: +p.qty || 0
    }));
    renderAll();
    fillSel();
    renderHomeGallery();
  }
}

// ── HOME IMAGES ──
let homeImgs = getDB('luxe_home_imgs', [adminGallery[0], adminGallery[1], adminGallery[2]]);

function renderHomeGallery() {
  const g = document.getElementById('hGallery');
  if(!g) return;
  // If we have products, use first 3 as gallery if homeImgs are default
  const displayImgs = (prods.length >= 3) ? prods.slice(0, 3).map(p => p.img) : homeImgs;
  g.innerHTML = displayImgs.map(src => `<img src="${src}" alt="Gallery Image" onerror="this.src='https://via.placeholder.com/400'">`).join('');
}

function renderAll() {
  renderG('all', 'hG');
  renderG('all', 'cG');
}

function pn(p) { return (curL === 'en' && p.nameEn) ? p.nameEn : (curL === 'fr' && p.nameFr) ? p.nameFr : p.name; }
function pd(p) { return (curL === 'en' && p.descEn) ? p.descEn : (curL === 'fr' && p.descFr) ? p.descFr : p.desc || ''; }

function renderG(cat, gid) {
  const el = document.getElementById(gid); if (!el) return;
  const list = cat === 'all' ? prods : prods.filter(p => p.cat === cat);
  if (!list.length) { el.innerHTML = `<div class="ld"><p style="color:var(--muted)">${prods.length ? 'لا توجد منتجات في هذه الفئة' : 'جاري تحميل المنتجات...'}</p></div>`; return; }
  el.innerHTML = list.map(p => {
    const bc = p.badge === 'جديد' ? 'new' : p.badge === 'تخفيض' ? 'sale' : '';
    return `<div class="card" onclick="openMod('${p.id}')">
      <div class="cimg">
        <img src="${p.img || ''}" alt="${pn(p)}" loading="lazy" onerror="this.src='https://via.placeholder.com/400'">
        ${p.badge ? `<div class="cbadge ${bc}">${p.badge}</div>` : ''}
        <div class="cacts">
          <button class="cab" onclick="event.stopPropagation();qAdd('${p.id}')">🛒</button>
          <button class="cab" onclick="event.stopPropagation();openMod('${p.id}')">👁</button>
        </div>
      </div>
      <div class="cbody">
        <div class="ccat">${p.cat}</div>
        <div class="cname">${pn(p)}</div>
        <div class="cdesc">${pd(p)}</div>
        <div class="cfoot">
          <div class="cprice">${p.oldPrice ? `<s>${p.oldPrice}</s> ` : ''}${p.price} دج</div>
          <div class="csz">${(p.sizes || '').split(',').slice(0, 3).map(s => `<span class="sz">${s}</span>`).join('')}</div>
        </div>
        <button class="addbtn" onclick="event.stopPropagation();qAdd('${p.id}')">${t('add_cart')}</button>
      </div>
    </div>`;
  }).join('');
}

function filt(cat, btn, gid) { btn.closest('.fils').querySelectorAll('.fb').forEach(b => b.classList.remove('on')); btn.classList.add('on'); renderG(cat, gid); }

// ── MODAL ──
let modId = null, picSz = '';
function openMod(id) {
  const p = prods.find(x => String(x.id) === String(id)); if (!p) return;
  modId = id; picSz = (p.sizes || '').split(',')[0] || '';
  document.getElementById('mI').src = p.img || '';
  document.getElementById('mCat').textContent = p.cat;
  document.getElementById('mNm').textContent = pn(p);
  document.getElementById('mPr').innerHTML = `${p.oldPrice ? `<s style="font-size:.9rem;color:var(--muted);font-family:'Tajawal',sans-serif">${p.oldPrice} دج</s> ` : ''}${p.price} دج`;
  document.getElementById('mDe').textContent = pd(p);
  document.getElementById('mSz').innerHTML = (p.sizes || '').split(',').map((s, i) => `<button class="szo${i === 0 ? ' on' : ''}" onclick="pSz(this,'${s}')">${s}</button>`).join('');
  document.getElementById('mov').classList.add('on');
  document.body.style.overflow = 'hidden';
}
function closeMod() { document.getElementById('mov').classList.remove('on'); document.body.style.overflow = ''; }
const mov = document.getElementById('mov');
if(mov) mov.addEventListener('click', e => { if (e.target === e.currentTarget) closeMod(); });
function pSz(el, s) { document.querySelectorAll('.szo').forEach(b => b.classList.remove('on')); el.classList.add('on'); picSz = s; }
function addFromMod() { const p = prods.find(x => String(x.id) === String(modId)); if (p) { addCart(p, picSz); closeMod(); } }

// ── CART ──
let cart = getDB('luxe_cart', []);
function qAdd(id) { const p = prods.find(x => String(x.id) === String(id)); if (p) addCart(p, (p.sizes || 'M').split(',')[0]); }
function addCart(p, size) {
  const ex = cart.find(x => x.id == p.id && x.size === size);
  if (ex) ex.qty++; else cart.push({ id: p.id, name: p.name, price: p.price, img: p.img, size, qty: 1 });
  updCart(); toast(t('added'), 'ok');
}
function updCart() {
  setDB('luxe_cart', cart);
  const tot = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cnum = document.getElementById('cnum'); if(cnum) cnum.textContent = cart.reduce((s, i) => s + i.qty, 0);
  const ctot = document.getElementById('ctot'); if(ctot) ctot.textContent = tot.toLocaleString() + ' دج';
  const b = document.getElementById('cpb'); if(!b) return;
  if (!cart.length) { b.innerHTML = `<div class="ect"><div class="ei">🛍️</div><p>${t('empty_cart')}</p></div>`; return; }
  b.innerHTML = cart.map(i => `
    <div class="ci">
      <img src="${i.img || ''}" onerror="this.src='https://via.placeholder.com/100'">
      <div class="cin">
        <div class="cn2">${i.name}</div>
        <div class="cm">المقاس: ${i.size}</div>
        <div class="cpr">${(i.price * i.qty).toLocaleString()} دج</div>
        <div class="ciq">
          <button class="qb" onclick="chQ('${i.id}','${i.size}',-1)">−</button>
          <span>${i.qty}</span>
          <button class="qb" onclick="chQ('${i.id}','${i.size}',1)">+</button>
        </div>
      </div>
      <button class="crm" onclick="rmC('${i.id}','${i.size}')">🗑</button>
    </div>`).join('');
}
function chQ(id, sz, d) { const i = cart.find(x => x.id == id && x.size === sz); if (!i) return; i.qty += d; if (i.qty <= 0) rmC(id, sz); else updCart(); }
function rmC(id, sz) { cart = cart.filter(x => !(x.id == id && x.size === sz)); updCart(); }
function toggleCart() { document.getElementById('ctp').classList.toggle('on'); document.getElementById('ov').classList.toggle('on'); document.body.style.overflow = document.getElementById('ctp').classList.contains('on') ? 'hidden' : ''; }
function gotoOrder() {
  if(document.getElementById('ctp').classList.contains('on')) toggleCart();
  go('order');
}

// ── ORDER ──
function fillSel() {
  const s = document.getElementById('oPr'); if (!s) return;
  s.innerHTML = `<option value="">${t('sel_prod')}</option>` + prods.map(p => `<option value="${p.id}">${pn(p)} — ${p.price} دج</option>`).join('');
}
function updOC() {
  const cprev = document.getElementById('cprev'); if(!cprev) return;
  if (!cart.length) { cprev.style.display = 'none'; return; }
  cprev.style.display = 'block';
  document.getElementById('cpit').innerHTML = cart.map(i => `<div class="cpi"><span>${i.name} (${i.size}) ×${i.qty}</span><span>${(i.price * i.qty).toLocaleString()} دج</span></div>`).join('');
  document.getElementById('cptot').textContent = `${t('total')}: ${cart.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString()} دج`;
}
async function sendOrder() {
  const name = document.getElementById('oN').value.trim();
  const phone = document.getElementById('oP').value.trim();
  const addr = document.getElementById('oA').value.trim();
  if (!name || !phone || !addr) { toast(t('fill_fields'), 'er'); return; }
  const pid = document.getElementById('oPr').value;
  const pname = pid ? pn(prods.find(p => p.id == pid) || { name: 'غير محدد' }) : 'غير محدد';
  const size = document.getElementById('oS').value;
  const notes = document.getElementById('oNt').value.trim();
  const items = cart.length ? cart.map(i => `${i.name}(${i.size})x${i.qty}`).join(', ') : pname;
  const total = cart.length ? cart.reduce((s, i) => s + i.price * i.qty, 0) : 0;

  const lines = cart.length ? cart.map(i => `  - ${i.name} (${i.size}) × ${i.qty} = ${(i.price * i.qty).toLocaleString()} دج`).join('\n') : `  - ${pname} (${size})`;
  const msg = encodeURIComponent(`🛍️ *طلب جديد — LUXE FASHION*\n\n👤 ${name}\n📱 ${phone}\n📍 ${addr}\n\n🛒 *الطلب:*\n${lines}\n` + (total ? `\n💰 المجموع: ${total.toLocaleString()} دج\n` : '') + (notes ? `\n📝 ${notes}\n` : '') + `\n⏰ ${new Date().toLocaleString('ar-DZ')}`);
  window.open(`https://wa.me/${WA}?text=${msg}`, '_blank');
  toast(t('order_sent'), 'ok');
}

// ── ADMIN ──
let loggedIn = false;
let selectedGalleryImg = '';

function doLogin() {
  if (document.getElementById('ac').value === CODE) {
    loggedIn = true;
    document.getElementById('aLg').style.display = 'none';
    document.getElementById('aP').style.display = 'block';
    document.getElementById('lerr').style.display = 'none';
    syncP();
  } else { document.getElementById('lerr').style.display = 'block'; document.getElementById('ac').value = ''; }
}
function doLogout() { loggedIn = false; document.getElementById('aLg').style.display = 'flex'; document.getElementById('aP').style.display = 'none'; document.getElementById('ac').value = ''; }
function adminTab(tab) {
  document.querySelectorAll('.atab').forEach((b, i) => b.classList.toggle('on', ['products', 'home_imgs', 'add'].includes(tab) && b.getAttribute('onclick').includes(tab)));
  document.getElementById('aProds').style.display = tab === 'products' ? 'block' : 'none';
  document.getElementById('aHomeImgs').style.display = tab === 'home_imgs' ? 'block' : 'none';
  document.getElementById('aFm').style.display = tab === 'add' ? 'block' : 'none';
  if (tab === 'add') clearFm();
  if (tab === 'home_imgs') renderAdmHomeImgs();
}

function clearFm() {
  document.getElementById('eid').value = '';
  ['fNm', 'fNe', 'fNf', 'fDe', 'fDn', 'fDf', 'fOp'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fPr').value = ''; document.getElementById('fQt').value = '';
  document.getElementById('fSz').value = 'XS,S,M,L,XL,XXL';
  document.getElementById('fBg').value = ''; document.getElementById('fCt').value = 'رجالي';
  document.getElementById('fmTit').textContent = t('add_prod_title');
  selectedGalleryImg = '';
  renderGallerySelector('prodGallery');
}

function renderGallerySelector(targetId, currentImg = '') {
  const el = document.getElementById(targetId);
  if(!el) return;
  el.innerHTML = adminGallery.map(src => `
    <img src="${src}" class="${src === currentImg ? 'on' : ''}" onclick="selectImg(this, '${src}', '${targetId}')" style="width:60px; height:60px; object-fit:cover; border-radius:8px; cursor:pointer; border:2px solid transparent;">
  `).join('');
}

function selectImg(el, src, targetId) {
  el.parentElement.querySelectorAll('img').forEach(img => img.style.borderColor = 'transparent');
  el.style.borderColor = 'var(--red)';
  if(targetId === 'prodGallery') selectedGalleryImg = src;
  if(targetId.startsWith('hiSelect')) {
    const idx = targetId.replace('hiSelect', '');
    document.getElementById('hiVal' + idx).value = src;
  }
}

async function syncP() { await loadProds(); renderAdmP(); }
function renderAdmP() {
  document.getElementById('sP').textContent = prods.length;
  const w = document.getElementById('aTw');
  if (!prods.length) { w.innerHTML = '<p style="padding:1.5rem;color:var(--muted)">لا توجد منتجات — أضف منتجاً جديداً</p>'; return; }
  w.innerHTML = `<table><thead><tr><th>الصورة</th><th>الاسم</th><th>الفئة</th><th>السعر</th><th>الكمية</th><th>الإجراءات</th></tr></thead><tbody>${prods.map(p => `<tr><td><img src="${p.img || ''}" onerror="this.src='https://via.placeholder.com/80'"></td><td><strong>${p.name}</strong></td><td>${p.cat}</td><td style="color:var(--red);font-weight:800">${(+p.price).toLocaleString()} دج</td><td>${p.qty}</td><td><button class="bsm r" style="margin-left:4px" onclick="editP('${p.id}')">✏️ تعديل</button><button class="bsm g" onclick="delP('${p.id}')">🗑 حذف</button></td></tr>`).join('')}</tbody></table>`;
}

function editP(id) {
  const p = prods.find(x => String(x.id) === String(id)); if (!p) return;
  adminTab('add');
  document.getElementById('eid').value = p.id;
  document.getElementById('fNm').value = p.name || '';
  document.getElementById('fCt').value = p.cat || 'رجالي';
  document.getElementById('fPr').value = p.price || ''; document.getElementById('fOp').value = p.oldPrice || '';
  document.getElementById('fQt').value = p.qty || ''; document.getElementById('fBg').value = p.badge || '';
  document.getElementById('fDe').value = p.desc || '';
  document.getElementById('fSz').value = p.sizes || 'XS,S,M,L,XL,XXL';
  document.getElementById('fmTit').textContent = '✏️ تعديل: ' + p.name;
  selectedGalleryImg = p.img;
  renderGallerySelector('prodGallery', p.img);
}

async function saveProd() {
  const name = document.getElementById('fNm').value.trim();
  const price = document.getElementById('fPr').value;
  const qty = document.getElementById('fQt').value;
  const img = selectedGalleryImg;
  if (!name || !price || !qty || !img) { toast(t('fill_fields'), 'er'); return; }
  const eid = document.getElementById('eid').value;
  const prod = {
    id: eid || String(Date.now()), name, price: +price, oldPrice: +document.getElementById('fOp').value || 0, qty: +qty, img,
    cat: document.getElementById('fCt').value, badge: document.getElementById('fBg').value,
    desc: document.getElementById('fDe').value.trim(), sizes: document.getElementById('fSz').value.trim() || 'XS,S,M,L,XL,XXL'
  };

  const btn = document.querySelector('#aFm .br');
  btn.disabled = true; btn.textContent = 'جاري الحفظ...';

  const res = await callAPI({ action: 'saveProduct', product: prod });
  if (res.status === 'success') {
    toast(t('saved'), 'ok');
    await syncP();
    setTimeout(() => { adminTab('products'); }, 1500);
  } else {
    toast('فشل الحفظ: ' + res.message, 'er');
  }
  btn.disabled = false; btn.textContent = t('save');
}

async function delP(id) {
  if (!confirm(t('confirm_del') || 'حذف هذا المنتج؟')) return;
  const res = await callAPI({ action: 'deleteProduct', id: id });
  if (res.status === 'success') {
    toast(t('deleted'), 'ok');
    syncP();
  } else {
    toast('فشل الحذف: ' + res.message, 'er');
  }
}

function renderAdmHomeImgs() {
  const w = document.getElementById('aHiw');
  w.innerHTML = homeImgs.map((src, i) => `
    <div class="fg s2" style="margin-bottom:1.5rem;">
      <label>Image ${i+1}</label>
      <div id="hiSelect${i}" style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:10px;"></div>
      <input type="hidden" id="hiVal${i}" value="${src}">
    </div>
  `).join('') + `<button class="br" onclick="saveHomeImgs()">💾 حفظ صور الواجهة</button>`;
  homeImgs.forEach((src, i) => renderGallerySelector('hiSelect' + i, src));
}

function saveHomeImgs() {
  homeImgs = [
    document.getElementById('hiVal0').value.trim(),
    document.getElementById('hiVal1').value.trim(),
    document.getElementById('hiVal2').value.trim()
  ];
  setDB('luxe_home_imgs', homeImgs);
  toast(t('saved'), 'ok');
  renderHomeGallery();
}

// ── i18n ──
const LS = ['ar', 'en']; let curL = 'ar';
const TX = {
  ar: {
    home: 'الرئيسية', collections: 'المجموعات', about: 'من نحن', order: 'اطلب', admin: 'المسؤول', cart: 'السلة', new_arrivals: '✦ وصل حديثاً 2025', hero1: 'امتلك الأسلوب', hero2: 'أحكم الجرأة', hero_sub: 'أزياء مختلطة بروح عصرية جريئة — رجالي، أطفال. اكتشف الكولكشن الحصري.', shop_now: 'تسوق الآن →', our_story: 'قصتنا', s1: 'كولكشن', s2: 'عميل', s3: 'منتج', featured: 'مميز', top: 'أبرز', colls: 'المجموعات', all: 'الكل', men: 'رجالي', kids: 'أطفال', loading: 'جاري التحميل...', all_coll: 'كل المجموعات', discover: 'اكتشف', style: 'أسلوبك', coll_sub: 'أكثر من 15 تشكيلة متنوعة', about_tag: 'من نحن', about_h1: 'قصة', about_sub: 'شغف بالموضة، التزام بالجودة', our_story2: 'قصتنا', ab1: 'بدأت رحلتنا من شغف حقيقي — الإيمان بأن كل شخص يستحق أن يرتدي ما يجعله يشعر بالثقة والجرأة.', ab2: 'نقدم تشكيلة مختارة بعناية من الملابس المختلطة للرجال، والأطفال.', ab3: 'كل قطعة نختارها تحكي قصة — قصة أسلوب حياة.', v1: 'جودة مضمونة', v1d: 'نختار كل قطعة بمعايير صارمة', v2: 'أسعار عادلة', v2d: 'أفضل سعر دون تنازل', v3: 'توصيل سريع', v3d: 'نصلك في أسرع وقت', v4: 'خدمة واتساب', v4d: 'متاحون لك دائماً', order_title: 'اطلب الآن', order_sub: 'أكمل بياناتك — الطلب يصلك عبر واتساب', your_cart: '🛒 سلتك', f_name: 'الاسم *', f_phone: 'الهاتف *', f_addr: 'العنوان *', f_prod: 'المنتج', f_size: 'المقاس', f_notes: 'ملاحظات', sel_prod: '-- اختر --', send_wa: 'إرسال عبر واتساب', admin_title: 'لوحة التحكم', admin_sub: 'أدخل كود الدخول', wrong_code: '❌ كود خاطئ', enter: 'دخول', dashboard: 'لوحة التحكم', add_prod: '+ منتج جديد', refresh: '🔄 تحديث', logout: 'خروج', total_prods: 'إجمالي المنتجات', total_ords: 'إجمالي الطلبات', total_rev: 'المبيعات (دج)', products: 'المنتجات', orders_tab: 'الطلبات', add_tab: 'إضافة / تعديل', add_prod_title: 'إضافة منتج جديد', f_cat: 'الفئة', f_price: 'السعر (دج) *', f_oldp: 'السعر القديم', f_qty: 'الكمية *', f_badge: 'الشارة', f_img: 'اختر الصورة من المعرض *', f_desc: 'الوصف (عربي)', f_sizes: 'المقاسات (بفاصلة)', save: 'حفظ المنتج', cancel: 'إلغاء', cart_title: '🛒 السلة', empty_cart: 'السلة فارغة', total: 'المجموع', order_now: '📱 اطلب الآن', pick_size: 'اختر المقاس:', add_cart: 'إضافة للسلة 🛒', ft_desc: 'متجرك للأزياء المختلطة — رجالي، أطفال.', ft_links: 'روابط', ft_contact: 'تواصل', rights: '© 2025 LUXE FASHION — جميع الحقوق محفوظة', added: '✅ أُضيف للسلة!', order_sent: '✅ جاري فتح واتساب...', saved: '✅ تم الحفظ!', deleted: '🗑 تم الحذف', fill_fields: '⚠️ أكمل الحقول المطلوبة'
  },
  en: {
    home: 'Home', collections: 'Collections', about: 'About', order: 'Order', admin: 'Admin', cart: 'Cart', new_arrivals: '✦ New Arrivals 2025', hero1: 'Own the Style', hero2: 'Keep the Vibe', hero_sub: 'Bold mixed fashion — men, kids. Discover the exclusive collection.', shop_now: 'Shop Now →', our_story: 'Our Story', s1: 'Collections', s2: 'Customers', s3: 'Products', featured: 'FEATURED', top: 'Top', colls: 'Collections', all: 'All', men: "Men's", kids: "Kids'", loading: 'Loading...', all_coll: 'All Collections', discover: 'Discover', style: 'Your Style', coll_sub: '15+ diverse collections', about_tag: 'About', about_h1: 'Story of', about_sub: 'Passion for fashion, commitment to quality', our_story2: 'Our Story', ab1: "Our journey started from a genuine passion — the belief that everyone deserves to wear what makes them feel confident and bold.", ab2: "We offer a carefully curated range of mixed clothing for men, and children.", ab3: "Every piece we choose tells a story — a lifestyle story.", v1: 'High Quality', v1d: 'Every piece selected with strict standards', v2: 'Fair Prices', v2d: 'Best price, no compromise', v3: 'Fast Delivery', v3d: 'We deliver as quickly as possible', v4: 'WhatsApp Service', v4d: 'Always available for you', order_title: 'Order Now', order_sub: 'Fill in your details — order sent via WhatsApp', your_cart: '🛒 Your Cart', f_name: 'Full Name *', f_phone: 'Phone *', f_addr: 'Address *', f_prod: 'Product', f_size: 'Size', f_notes: 'Notes', sel_prod: '-- Select --', send_wa: 'Send via WhatsApp', admin_title: 'Admin Panel', admin_sub: 'Enter access code', wrong_code: '❌ Wrong code', enter: 'Enter', dashboard: 'Dashboard', add_prod: '+ New Product', refresh: '🔄 Refresh', logout: 'Logout', total_prods: 'Total Products', total_ords: 'Total Orders', total_rev: 'Revenue (DZD)', products: 'Products', orders_tab: 'Orders', add_tab: 'Add / Edit', add_prod_title: 'Add New Product', f_cat: 'Category', f_price: 'Price (DZD) *', f_oldp: 'Old Price', f_qty: 'Quantity *', f_badge: 'Badge', f_img: 'Choose Image from Gallery *', f_desc: 'Description', f_sizes: 'Sizes (comma separated)', save: 'Save Product', cancel: 'Cancel', cart_title: '🛒 Cart', empty_cart: 'Your cart is empty', total: 'Total', order_now: '📱 Order Now', pick_size: 'Select size:', add_cart: 'Add to Cart 🛒', ft_desc: 'Your #1 store for mixed fashion.', ft_links: 'Links', ft_contact: 'Contact', rights: '© 2025 LUXE FASHION — All Rights Reserved', added: '✅ Added to cart!', order_sent: '✅ Opening WhatsApp...', saved: '✅ Saved!', deleted: '🗑 Deleted', fill_fields: '⚠️ Please fill required fields'
  }
};
function t(k) { return TX[curL][k] || TX.ar[k] || k; }
function applyLang() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.getAttribute('data-k');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = t(k);
    else el.textContent = t(k);
  });
  document.documentElement.lang = curL;
  document.documentElement.dir = curL === 'ar' ? 'rtl' : 'ltr';
  const lbtn = document.getElementById('lbtn'); if(lbtn) lbtn.textContent = curL.toUpperCase();
  fillSel(); renderAll();
}
function cycleLang() { curL = LS[(LS.indexOf(curL) + 1) % LS.length]; applyLang(); }

// ── THEME ──
let dark = false;
function toggleTheme() { dark = !dark; document.documentElement.setAttribute('data-theme', dark ? 'dark' : ''); document.getElementById('tbtn').textContent = dark ? '☀️' : '🌙'; }

// ── NAV ──
function go(pg) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pg);
  if(target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const nl = document.getElementById('nl');
  if(nl) nl.classList.remove('on');
  if (pg === 'order') { updOC(); fillSel(); }
  if (pg === 'coll') renderG('all', 'cG');
  if (pg === 'admin' && !loggedIn) { document.getElementById('aLg').style.display = 'flex'; document.getElementById('aP').style.display = 'none'; }
}

// ── TOAST ──
function toast(msg, type = '') { const el = document.getElementById('toast'); el.textContent = msg; el.className = 'toast' + (type ? ' ' + type : ''); el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000); }

// ── INIT ──
loadProds(); applyLang(); updCart();
