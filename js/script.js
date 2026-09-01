(function(){
const DELIVERY_FEE = 8000;
  const state = {
    flavor: 'Original',
    size: 'Medium',
    unitPrice: 18000,
    qty: 1,
    cart: [] // {id, flavor, size, qty, unitPrice}
  };

  const fmt = (n) => 'Rp' + n.toLocaleString('id-ID');

  /* ---------- navigation ---------- */
  function goTo(screen){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
    document.getElementById('screen-' + screen).classList.add('visible');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-nav="' + screen + '"]').forEach(n => n.classList.add('active'));
    window.scrollTo({top:0, behavior:'smooth'});
    closeCart();
    closeNotif();
    if(screen === 'checkout') renderCheckout();
    if(screen === 'tracking') renderTracking();
  }
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(el.getAttribute('data-nav'));
    });
  });

  /* ---------- product selection ---------- */
  document.getElementById('flavorRow').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if(!btn) return;
    document.querySelectorAll('#flavorRow .chip').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    state.flavor = btn.dataset.flavor;
    document.getElementById('flavorLabel').textContent = state.flavor;
  });

  document.getElementById('sizeRow').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if(!btn) return;
    document.querySelectorAll('#sizeRow .chip').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    state.size = btn.dataset.size;
    state.unitPrice = parseInt(btn.dataset.price, 10);
    document.getElementById('sizeLabel').textContent = state.size;
    updateProductPrice();
  });

  document.getElementById('qtyMinus').addEventListener('click', () => {
    if(state.qty > 1){ state.qty--; syncQty(); }
  });
  document.getElementById('qtyPlus').addEventListener('click', () => {
    state.qty++; syncQty();
  });
  function syncQty(){
    document.getElementById('qtyVal').textContent = state.qty;
    updateProductPrice();
  }
  function updateProductPrice(){
    document.getElementById('productPrice').textContent = fmt(state.unitPrice * state.qty);
  }

  document.getElementById('addToCartBtn').addEventListener('click', () => {
    const existing = state.cart.find(i => i.flavor === state.flavor && i.size === state.size);
    if(existing){
      existing.qty += state.qty;
    } else {
      state.cart.push({
        id: Date.now(),
        flavor: state.flavor,
        size: state.size,
        qty: state.qty,
        unitPrice: state.unitPrice
      });
    }
    renderCart();
    showToast('Ditambahkan ke keranjang');
    openCart();
    // reset quantity selector
    state.qty = 1; syncQty();
  });

  /* ---------- cart drawer ---------- */
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('overlay');
  function openCart(){ drawer.classList.add('open'); overlay.classList.add('open'); }
  function closeCart(){ drawer.classList.remove('open'); overlay.classList.remove('open'); }
  document.getElementById('cartIconBtn').addEventListener('click', openCart);
  document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
  document.getElementById('continueShoppingBtn').addEventListener('click', closeCart);
  overlay.addEventListener('click', () => { closeCart(); closeNotif(); });

  function cartCount(){ return state.cart.reduce((s,i) => s + i.qty, 0); }
  function cartSubtotal(){ return state.cart.reduce((s,i) => s + i.qty * i.unitPrice, 0); }

  function renderCart(){
    const wrap = document.getElementById('cartItemsWrap');
    const badge = document.getElementById('cartBadge');
    const count = cartCount();

    if(count > 0){ badge.style.display = 'flex'; badge.textContent = count; }
    else { badge.style.display = 'none'; }

    if(state.cart.length === 0){
      wrap.innerHTML = `<div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
        <b>Keranjang masih kosong</b>
        <span>Yuk pilih rasa favoritmu dulu.</span>
      </div>`;
    } else {
      wrap.innerHTML = state.cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-thumb">${mushroomIconSmall()}</div>
          <div class="cart-item-body">
            <div class="cart-item-top">
              <b>Jamur Goreng Crispy</b>
              <button class="cart-remove" data-remove="${item.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
            </div>
            <div class="cart-item-meta">${item.flavor} · ${item.size}</div>
            <div class="cart-item-bottom">
              <span style="font-size:12.5px; color:var(--brown-faint); font-weight:600;">× ${item.qty}</span>
              <span class="price">${fmt(item.qty * item.unitPrice)}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    const subtotal = cartSubtotal();
    const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
    document.getElementById('cartSubtotal').textContent = fmt(subtotal);
    document.getElementById('cartDelivery').textContent = fmt(delivery);
    document.getElementById('cartTotal').textContent = fmt(subtotal + delivery);
    document.getElementById('checkoutBtn').disabled = state.cart.length === 0;
  }

  document.getElementById('cartItemsWrap').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if(!btn) return;
    const id = Number(btn.dataset.remove);
    state.cart = state.cart.filter(i => i.id !== id);
    renderCart();
  });

  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if(state.cart.length === 0) return;
    goTo('checkout');
  });

  function mushroomIconSmall(){
    return `<svg viewBox="0 0 40 40" fill="none">
      <ellipse cx="20" cy="18" rx="14" ry="9" fill="#E8912D"/>
      <rect x="13" y="23" width="14" height="12" rx="4" fill="#C6721A"/>
      <ellipse cx="20" cy="18" rx="14" ry="9" fill="#EFA847"/>
    </svg>`;
  }

  /* ---------- checkout ---------- */
  function renderCheckout(){
    const lines = document.getElementById('checkoutLines');
    lines.innerHTML = state.cart.map(item => `
      <div class="order-line">
        <div class="order-line-thumb">${mushroomIconSmall()}</div>
        <div>
          <b>Jamur Goreng Crispy</b>
          <div class="order-line-meta">${item.flavor} · ${item.size} · × ${item.qty}</div>
        </div>
        <div style="margin-left:auto; font-weight:700; font-size:14px; white-space:nowrap;">${fmt(item.qty * item.unitPrice)}</div>
      </div>
    `).join('');
    const subtotal = cartSubtotal();
    const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
    document.getElementById('ckSubtotal').textContent = fmt(subtotal);
    document.getElementById('ckDelivery').textContent = fmt(delivery);
    document.getElementById('ckTotal').textContent = fmt(subtotal + delivery);
  }

  document.getElementById('confirmOrderBtn').addEventListener('click', () => {
    const name = document.getElementById('inpName').value.trim();
    const phone = document.getElementById('inpPhone').value.trim();
    const address = document.getElementById('inpAddress').value.trim();
    if(!name || !phone || !address){
      showToast('Lengkapi nama, nomor HP, dan alamat dulu ya');
      return;
    }
    state.customer = { name, phone, address, note: document.getElementById('inpNote').value.trim() };
    state.cart = []; // order placed, clear cart
    renderCart();
    goTo('confirm');
  });

  /* ---------- tracking ---------- */
  function renderTracking(){
    document.getElementById('trackName').textContent = state.customer ? state.customer.name : '—';
    document.getElementById('trackAddress').textContent = state.customer ? state.customer.address : '—';
  }

  document.getElementById('helpBtn').addEventListener('click', () => {
    showToast('Menghubungkan ke tim support...');
  });

  /* ---------- contact ---------- */
  const sendBtn = document.getElementById('sendMessageBtn');
  if(sendBtn){
    sendBtn.addEventListener('click', () => {
      showToast('Pesan terkirim, tim kami akan segera membalas');
    });
  }

  /* ---------- notifications ---------- */
  const notifPop = document.getElementById('notifPopover');
  function openNotif(){ notifPop.classList.add('open'); overlay.classList.add('open'); }
  function closeNotif(){ notifPop.classList.remove('open'); }
  document.getElementById('notifIconBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    notifPop.classList.contains('open') ? closeNotif() : openNotif();
  });
  document.getElementById('markReadBtn').addEventListener('click', () => {
    document.querySelectorAll('.notif-item').forEach(n => n.classList.remove('unread'));
    document.getElementById('notifBadge').style.display = 'none';
  });

  /* ---------- toast ---------- */
  let toastTimer;
  function showToast(msg){
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  /* ---------- init ---------- */
  renderCart();
  updateProductPrice();
})();