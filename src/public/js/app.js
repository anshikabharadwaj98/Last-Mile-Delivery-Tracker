// App State
let token = localStorage.getItem('token');
let currentUser = null;
let activeSection = 'auth-section';
let zonesCache = [];
let agentsCache = [];
let customersCache = [];
let calculationTimeout = null;

// API Helpers
async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(endpoint, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Request failed');
  }

  return data;
}

// ─── Auth Banner ──────────────────────────────────────────────────────────────
/**
 * Shows an inline status banner inside the auth card.
 * type: 'success' | 'error' | 'info' | 'warning'
 * autoHide: seconds before auto-dismissal (0 = stay forever)
 */
function showAuthBanner(type, message, autoHide = 8) {
  const banner = document.getElementById('auth-banner');
  if (!banner) return;
  banner.className = `banner-${type}`;
  banner.innerHTML = message;
  banner.style.display = 'block';
  if (autoHide > 0) {
    clearTimeout(banner._hideTimer);
    banner._hideTimer = setTimeout(() => {
      banner.style.display = 'none';
    }, autoHide * 1000);
  }
}

function hideAuthBanner() {
  const banner = document.getElementById('auth-banner');
  if (banner) banner.style.display = 'none';
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupFormListeners();
});

async function initApp() {
  // Handle email verification result in URL (?verified=true / ?verified=false)
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has('verified')) {
    const verified = urlParams.get('verified');
    if (verified === 'true') {
      showAuthBanner('success', '✅ Email verified successfully! You can now log in.');
    } else {
      const errorMsg = urlParams.get('error') || 'The verification link is invalid or expired.';
      showAuthBanner('error', `❌ Email verification failed: ${errorMsg} <br><a onclick="triggerResendBanner(); return false;" href="#">Request a new link →</a>`, 0);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // ?resend=true  — user clicked "Request New Link" on the failure page
  if (urlParams.has('resend') && urlParams.get('resend') === 'true') {
    toggleAuthForm(false);
    showAuthBanner('info', '🔁 Enter your email below and click "Resend verification email" to get a new link.', 0);
    // Inject resend link below login form
    const loginForm = document.getElementById('login-form');
    if (loginForm && !document.getElementById('resend-banner-link')) {
      const resendDiv = document.createElement('div');
      resendDiv.id = 'resend-banner-link';
      resendDiv.style.cssText = 'text-align:center; margin-top:12px; font-size:0.85rem; color:#94a3b8;';
      resendDiv.innerHTML = `<a href="#" onclick="handleResendVerification(); return false;" style="color:#0ea5e9; font-weight:600;">Resend verification email</a>`;
      loginForm.appendChild(resendDiv);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Set date constraints on reschedule form
  const rescheduleDateInput = document.getElementById('reschedule-date');
  if (rescheduleDateInput) {
    const today = new Date().toISOString().split('T')[0];
    rescheduleDateInput.min = today;
  }

  showSection('auth-section');
  setupNav();

  if (token) {
    try {
      const data = await apiFetch('/api/auth/me');
      currentUser = data.user;
      setupNav();
      loadRoleDashboard();
    } catch (err) {
      console.warn('Session invalid, logging out:', err);
      logout();
    }
  }
}

// Navigation and Layout Control
function showSection(sectionId) {
  activeSection = sectionId;
  document.querySelectorAll('.page-section').forEach(sec => {
    sec.classList.remove('active');
  });
  const activeSec = document.getElementById(sectionId);
  if (activeSec) {
    activeSec.classList.add('active');
  }
}

function setupNav() {
  const navUser = document.getElementById('nav-user-info');
  const navLogout = document.getElementById('nav-logout');
  const seedBar = document.getElementById('seed-login-bar');
  
  if (currentUser) {
    navUser.style.display = 'flex';
    document.getElementById('nav-user-name').textContent = currentUser.name;
    
    const roleBadge = document.getElementById('nav-user-role');
    roleBadge.textContent = currentUser.role;
    roleBadge.className = 'badge';
    roleBadge.classList.add(`badge-${currentUser.role === 'admin' ? 'delivered' : currentUser.role === 'delivery_agent' ? 'assigned' : 'created'}`);
    
    navLogout.style.display = 'block';
    if (seedBar) seedBar.style.display = 'none';
  } else {
    navUser.style.display = 'none';
    navLogout.style.display = 'none';
    if (seedBar) seedBar.style.display = 'none';
  }
}

// Auth Handlers
function toggleAuthForm(isRegister) {
  const loginForm = document.getElementById('login-form');
  const formB2C = document.getElementById('register-form-b2c');
  const formB2B = document.getElementById('register-form-b2b');
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const toggleMsg = document.getElementById('auth-toggle-msg');

  if (isRegister) {
    loginForm.style.display = 'none';
    formB2C.style.display = 'block';
    formB2B.style.display = 'none';
    title.textContent = 'Create Account';
    subtitle.textContent = 'Register to calculate rates and ship packages';
    toggleMsg.innerHTML = 'Already have an account? <a href="#" onclick="toggleAuthForm(false); return false;">Login here</a>';
  } else {
    loginForm.style.display = 'block';
    formB2C.style.display = 'none';
    formB2B.style.display = 'none';
    title.textContent = 'Welcome Back';
    subtitle.textContent = 'Sign in to track and manage shipments';
    toggleMsg.innerHTML = 'Don\'t have an account? <a href="#" onclick="toggleAuthForm(true); return false;">Register here</a>';
  }
}

function switchRegisterMode(mode) {
  const formB2C = document.getElementById('register-form-b2c');
  const formB2B = document.getElementById('register-form-b2b');
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');

  if (mode === 'b2b') {
    formB2C.style.display = 'none';
    formB2B.style.display = 'block';
    title.textContent = 'Create Business Account';
    subtitle.textContent = 'Register with your company info for B2B rates';
  } else {
    formB2C.style.display = 'block';
    formB2B.style.display = 'none';
    title.textContent = 'Create Account';
    subtitle.textContent = 'Register to calculate rates and ship packages';
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  showSection('auth-section');
  setupNav();
  hideAuthBanner();
  // Clear forms
  document.getElementById('login-form').reset();
  document.getElementById('register-form-b2c').reset();
  document.getElementById('register-form-b2b').reset();
}

/**
 * Handles the resend verification email flow.
 * Pre-fills email from the login field if provided, then sends the resend request.
 */
async function handleResendVerification(prefillEmail = '') {
  const emailInput = document.getElementById('login-email');
  const email = prefillEmail || (emailInput ? emailInput.value.trim() : '');

  if (!email) {
    showAuthBanner('warning', '⚠️ Please enter your email address in the field above, then click the resend link.', 6);
    if (emailInput) emailInput.focus();
    return;
  }

  showAuthBanner('info', '⏳ Sending a new verification link...', 0);

  try {
    const data = await apiFetch('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (data.alreadyVerified) {
      showAuthBanner('success', '✅ This account is already verified. You can log in now.', 8);
      return;
    }

    let bannerMsg = `✅ ${data.message}`;
    if (data.email_preview_url) {
      bannerMsg += `<br><a href="${data.email_preview_url}" target="_blank" rel="noopener">Preview new email in Ethereal →</a>`;
    } else if (data.verification_link) {
      bannerMsg += `<br><a href="${data.verification_link}" target="_blank" rel="noopener">Click here to verify →</a>`;
    }
    showAuthBanner('success', bannerMsg, 0);
  } catch (err) {
    showAuthBanner('error', `❌ ${err.message}`, 8);
  }
}

/**
 * Shows a prompt for the resend flow (called from verification failure page link)
 */
function triggerResendBanner() {
  toggleAuthForm(false);
  showAuthBanner('info',
    '🔁 Enter your email in the field above, then click → <a href="#" onclick="handleResendVerification(); return false;" style="font-weight:600;">Resend verification email</a>',
    0
  );
  const emailInput = document.getElementById('login-email');
  if (emailInput) emailInput.focus();
}

function loadRoleDashboard() {
  if (!currentUser) return;

  if (currentUser.role === 'admin') {
    showSection('admin-dashboard');
    loadAdminData();
  } else if (currentUser.role === 'customer') {
    showSection('customer-dashboard');
    loadCustomerOrders();
  } else if (currentUser.role === 'delivery_agent') {
    showSection('agent-dashboard');
    loadAgentConsole();
  }
}

// Form Listeners Setup
function setupFormListeners() {
  // Login Form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthBanner();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = data.user;
      setupNav();
      loadRoleDashboard();
    } catch (err) {
      // If blocked due to unverified email, show resend link inline
      if (err.message && err.message.toLowerCase().includes('verify your email')) {
        showAuthBanner('warning',
          `⚠️ ${err.message}<br><a href="#" onclick="handleResendVerification('${email}'); return false;" style="margin-top:6px; display:inline-block;">Resend verification email →</a>`,
          0
        );
      } else {
        showAuthBanner('error', `❌ ${err.message}`);
      }
    }
  });

  // B2C Register Form
  document.getElementById('register-form-b2c').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthBanner();
    const name = document.getElementById('reg-b2c-name').value;
    const email = document.getElementById('reg-b2c-email').value;
    const password = document.getElementById('reg-b2c-password').value;
    const role = document.getElementById('reg-b2c-role').value;
    const phone = document.getElementById('reg-b2c-phone').value;
    const house_address = document.getElementById('reg-b2c-address').value;

    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, phone, house_address })
      });
      document.getElementById('register-form-b2c').reset();
      toggleAuthForm(false); // Switch to login view
      let bannerMsg = `✅ ${data.message}`;
      if (data.email_preview_url) {
        bannerMsg += `<br><a href="${data.email_preview_url}" target="_blank" rel="noopener">Preview email in Ethereal →</a>`;
      } else if (data.verification_link) {
        bannerMsg += `<br><a href="${data.verification_link}" target="_blank" rel="noopener">Click here to verify your email →</a>`;
      }
      showAuthBanner('success', bannerMsg, 0);
    } catch (err) {
      showAuthBanner('error', `❌ ${err.message}`);
    }
  });

  // B2B Register Form
  document.getElementById('register-form-b2b').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthBanner();
    const company_name = document.getElementById('reg-b2b-company-name').value;
    const company_address = document.getElementById('reg-b2b-company-address').value;
    const email = document.getElementById('reg-b2b-email').value;
    const password = document.getElementById('reg-b2b-password').value;
    const phone = document.getElementById('reg-b2b-phone').value;
    const gstin = document.getElementById('reg-b2b-gstin').value;
    const role = document.getElementById('reg-b2b-role').value;

    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ company_name, company_address, email, password, phone, gstin, role })
      });
      document.getElementById('register-form-b2b').reset();
      toggleAuthForm(false); // Switch to login view
      let bannerMsg = `✅ ${data.message}`;
      if (data.email_preview_url) {
        bannerMsg += `<br><a href="${data.email_preview_url}" target="_blank" rel="noopener">Preview email in Ethereal →</a>`;
      } else if (data.verification_link) {
        bannerMsg += `<br><a href="${data.verification_link}" target="_blank" rel="noopener">Click here to verify your email →</a>`;
      }
      showAuthBanner('success', bannerMsg, 0);
    } catch (err) {
      showAuthBanner('error', `❌ ${err.message}`);
    }
  });

  // Order Creation Form
  document.getElementById('order-creation-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const isByAdmin = document.getElementById('order-modal-creator-role').value === 'admin';
    const payload = {
      pickup_address: document.getElementById('order-pickup-addr').value,
      pickup_postal_code: document.getElementById('order-pickup-postal').value,
      drop_address: document.getElementById('order-drop-addr').value,
      drop_postal_code: document.getElementById('order-drop-postal').value,
      length_cm: parseFloat(document.getElementById('order-length').value),
      width_cm: parseFloat(document.getElementById('order-width').value),
      height_cm: parseFloat(document.getElementById('order-height').value),
      actual_weight_kg: parseFloat(document.getElementById('order-weight').value),
      order_type: document.getElementById('order-type').value,
      payment_type: document.getElementById('order-payment').value,
    };

    if (isByAdmin) {
      payload.customer_id = document.getElementById('order-customer-id').value;
    }

    try {
      const response = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      closeOrderModal();
      alert(response.message);
      loadRoleDashboard();
    } catch (err) {
      alert(err.message);
    }
  });

  // Agent Location Form
  document.getElementById('agent-location-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      latitude: parseFloat(document.getElementById('agent-lat').value),
      longitude: parseFloat(document.getElementById('agent-lon').value),
      current_zone_id: document.getElementById('agent-zone').value || null
    };

    try {
      const response = await apiFetch('/api/agent/location', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      alert(response.message);
      // Update local cache
      currentUser.latitude = response.agent.latitude;
      currentUser.longitude = response.agent.longitude;
      currentUser.current_zone_id = response.agent.current_zone_id;
      loadAgentConsole();
    } catch (err) {
      alert(err.message);
    }
  });

  // Status Update Form
  document.getElementById('status-update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('status-modal-order-id').value;
    const status = document.getElementById('status-select').value;
    const failed_reason = status === 'Failed' ? document.getElementById('status-failed-reason').value : null;

    try {
      const response = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, failed_reason })
      });
      closeStatusModal();
      alert(response.message);
      loadRoleDashboard();
    } catch (err) {
      alert(err.message);
    }
  });

  // Assign Agent Form
  document.getElementById('assign-agent-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('assign-modal-order-id').value;
    const mode = document.getElementById('assign-select-mode').value;
    const payload = {};

    if (mode === 'auto') {
      payload.auto = true;
    } else {
      payload.agent_id = document.getElementById('assign-agent-select').value;
      payload.auto = false;
    }

    try {
      const response = await apiFetch(`/api/orders/${orderId}/assign`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      closeAssignModal();
      alert(response.message);
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  });

  // Reschedule Form
  document.getElementById('reschedule-order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('reschedule-modal-order-id').value;
    const reschedule_date = document.getElementById('reschedule-date').value;

    try {
      const response = await apiFetch(`/api/orders/${orderId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ reschedule_date })
      });
      closeRescheduleModal();
      alert(response.message);
      loadRoleDashboard();
    } catch (err) {
      alert(err.message);
    }
  });

  // Admin New Zone Form
  document.getElementById('admin-zone-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('zone-name').value;
    const code = document.getElementById('zone-code').value;
    const description = document.getElementById('zone-desc').value;

    try {
      await apiFetch('/api/zones', {
        method: 'POST',
        body: JSON.stringify({ name, code, description })
      });
      document.getElementById('admin-zone-form').reset();
      alert('Zone created successfully!');
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  });

  // Admin Assign Area Form
  document.getElementById('admin-area-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const zone_id = document.getElementById('area-zone-id').value;
    const name = document.getElementById('area-name').value;
    const postal_code = document.getElementById('area-postal').value;
    const latitude = document.getElementById('area-lat').value;
    const longitude = document.getElementById('area-lon').value;

    try {
      await apiFetch('/api/zones/areas', {
        method: 'POST',
        body: JSON.stringify({ zone_id, name, postal_code, latitude, longitude })
      });
      document.getElementById('admin-area-form').reset();
      alert('Area registered to zone successfully!');
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  });

  // Admin Save Rate Card
  document.getElementById('admin-ratecard-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('rc-name').value,
      order_type: document.getElementById('rc-order-type').value,
      rate_type: document.getElementById('rc-rate-type').value,
      zone_from_id: document.getElementById('rc-zone-from').value || null,
      zone_to_id: document.getElementById('rc-zone-to').value || null,
      base_weight_kg: parseFloat(document.getElementById('rc-base-weight').value),
      base_rate: parseFloat(document.getElementById('rc-base-rate').value),
      excess_rate_per_kg: parseFloat(document.getElementById('rc-excess-rate').value),
    };

    try {
      await apiFetch('/api/rate-cards', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      document.getElementById('admin-ratecard-form').reset();
      toggleZoneSelectors();
      alert('Rate card configuration saved!');
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  });

  // Admin Surcharges Form
  document.getElementById('admin-settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const b2bValue = document.getElementById('set-cod-b2b').value;
    const b2cValue = document.getElementById('set-cod-b2c').value;

    try {
      await apiFetch('/api/rate-cards/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'cod_surcharge_B2B', value: b2bValue, description: 'Flat surcharge for COD B2B orders' })
      });
      await apiFetch('/api/rate-cards/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'cod_surcharge_B2C', value: b2cValue, description: 'Flat surcharge for COD B2C orders' })
      });
      alert('COD Surcharge parameters updated!');
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  });
}

// Pricing calculation trigger on form inputs
function triggerRateCalculation() {
  clearTimeout(calculationTimeout);
  
  const pickup = document.getElementById('order-pickup-postal').value;
  const drop = document.getElementById('order-drop-postal').value;
  const length = document.getElementById('order-length').value;
  const width = document.getElementById('order-width').value;
  const height = document.getElementById('order-height').value;
  const weight = document.getElementById('order-weight').value;
  const type = document.getElementById('order-type').value;
  const payment = document.getElementById('order-payment').value;

  if (!pickup || !drop || !length || !width || !height || !weight || !type || !payment) {
    document.getElementById('modal-pricing-breakdown').style.display = 'none';
    return;
  }

  // Debounce the preview API request to reduce DB workload
  calculationTimeout = setTimeout(async () => {
    try {
      const pricing = await apiFetch('/api/orders/calculate', {
        method: 'POST',
        body: JSON.stringify({
          pickup_postal_code: pickup,
          drop_postal_code: drop,
          length_cm: parseFloat(length),
          width_cm: parseFloat(width),
          height_cm: parseFloat(height),
          actual_weight_kg: parseFloat(weight),
          order_type: type,
          payment_type: payment
        })
      });

      const breakdownDiv = document.getElementById('modal-pricing-breakdown');
      breakdownDiv.innerHTML = `
        <h4 style="font-size: 0.85rem; margin-bottom: 8px; color: var(--primary);">Estimated Cost Breakdown:</h4>
        <div class="pricing-row"><span>Route Detected:</span><strong>${pricing.pickup_zone_name} → ${pricing.drop_zone_name} (${pricing.rate_type})</strong></div>
        <div class="pricing-row"><span>Volumetric Weight:</span><strong>${pricing.volumetric_weight_kg} kg</strong></div>
        <div class="pricing-row"><span>Billed Weight (higher):</span><strong>${pricing.chargeable_weight_kg} kg</strong></div>
        <div class="pricing-row"><span>Rate Card Applied:</span><strong>${pricing.rate_card_name}</strong></div>
        <div class="pricing-row"><span>Base Rate:</span><strong>${Number(pricing.base_charge).toFixed(2)} for first ${Number(pricing.base_weight_kg).toFixed(0)} kg</strong></div>
        <div class="pricing-row"><span>Excess Weight:</span><strong>${Number(pricing.excess_weight_kg).toFixed(0)} kg x ${Number(pricing.excess_rate_per_kg).toFixed(2)}/kg = ${Number(pricing.excess_charge_total).toFixed(2)}</strong></div>
        <div class="pricing-row"><span>Delivery Charge:</span><strong>${Number(pricing.delivery_charge).toFixed(2)}</strong></div>
        ${Number(pricing.cod_surcharge) > 0 ? `<div class="pricing-row text-warning"><span>COD Surcharge:</span><strong>${Number(pricing.cod_surcharge).toFixed(2)}</strong></div>` : ''}
        <div class="pricing-row"><span>Total Charges:</span><strong>${Number(pricing.total_charge).toFixed(2)}</strong></div>
      `;
      breakdownDiv.style.display = 'block';
    } catch (err) {
      const breakdownDiv = document.getElementById('modal-pricing-breakdown');
      breakdownDiv.innerHTML = `<span class="text-danger" style="font-size:0.8rem;">Pricing Preview Failed: ${err.message}</span>`;
      breakdownDiv.style.display = 'block';
    }
  }, 400);
}

// Modal Toggle Controllers
async function openOrderModal(role) {
  document.getElementById('order-creation-form').reset();
  document.getElementById('order-modal-creator-role').value = role;
  document.getElementById('modal-pricing-breakdown').style.display = 'none';

  // Load Zones & Areas to populate pincode auto-complete suggestions
  try {
    const zones = await apiFetch('/api/zones');
    zonesCache = zones;

    document.getElementById('order-pickup-postal').value = '';
    document.getElementById('order-drop-postal').value = '';

    const datalist = document.getElementById('pincodes-list');
    datalist.innerHTML = '';

    zones.forEach(zone => {
      if (zone.areas && zone.areas.length > 0) {
        zone.areas.forEach(area => {
          const opt = document.createElement('option');
          opt.value = area.postal_code || area.pincode;
          opt.textContent = `${area.name || area.place_name} (${zone.name})`;
          datalist.appendChild(opt);
        });
      }
    });

    const adminSelectGroup = document.getElementById('admin-customer-selector-group');
    const orderTypeSelect = document.getElementById('order-type');

    if (role === 'admin') {
      adminSelectGroup.style.display = 'block';
      orderTypeSelect.disabled = false;
      const customers = await apiFetch('/api/admin/customers');
      const custSelect = document.getElementById('order-customer-id');
      custSelect.innerHTML = '';
      customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.email})`;
        custSelect.appendChild(opt);
      });
    } else {
      adminSelectGroup.style.display = 'none';
      orderTypeSelect.value = currentUser.customer_type || 'B2C';
      orderTypeSelect.disabled = true;
    }

    triggerRateCalculation();
    document.getElementById('order-modal').showModal();
  } catch (err) {
    alert('Failed to load locations for order: ' + err.message);
  }
}

function closeOrderModal() {
  document.getElementById('order-modal').close();
}

function openStatusModal(orderId, currentStatus, userRole) {
  document.getElementById('status-modal-order-id').value = orderId;
  document.getElementById('status-modal-user-role').value = userRole;
  
  const select = document.getElementById('status-select');
  select.value = currentStatus || 'Picked Up';
  
  toggleFailedReasonGroup();
  document.getElementById('status-modal').showModal();
}

function closeStatusModal() {
  document.getElementById('status-modal').close();
}

function toggleFailedReasonGroup() {
  const status = document.getElementById('status-select').value;
  const reasonGroup = document.getElementById('failed-reason-group');
  if (status === 'Failed') {
    reasonGroup.style.display = 'block';
    document.getElementById('status-failed-reason').required = true;
  } else {
    reasonGroup.style.display = 'none';
    document.getElementById('status-failed-reason').required = false;
  }
}

async function openAssignModal(orderId, pickupZoneName, pickupZoneId) {
  document.getElementById('assign-modal-order-id').value = orderId;
  document.getElementById('assign-modal-route-info').innerHTML = `Pickup Zone: <strong>${pickupZoneName}</strong>`;
  
  document.getElementById('assign-select-mode').value = 'auto';
  document.getElementById('manual-agent-select-group').style.display = 'none';

  try {
    const agents = await apiFetch('/api/admin/agents');
    agentsCache = agents;
    const select = document.getElementById('assign-agent-select');
    select.innerHTML = '';

    agents.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      const zoneStr = a.currentZone ? `Zone: ${a.currentZone.name}` : 'No Zone';
      const availability = a.is_active && a.is_available ? 'Available' : 'Offline';
      opt.textContent = `${a.name} (${zoneStr}) [${availability}]`;
      opt.disabled = !(a.is_active && a.is_available);
      select.appendChild(opt);
    });

    document.getElementById('assign-modal').showModal();
  } catch (err) {
    alert('Failed to fetch agents: ' + err.message);
  }
}

function closeAssignModal() {
  document.getElementById('assign-modal').close();
}

function toggleAssignMode() {
  const mode = document.getElementById('assign-select-mode').value;
  const selectGroup = document.getElementById('manual-agent-select-group');
  if (mode === 'manual') {
    selectGroup.style.display = 'block';
  } else {
    selectGroup.style.display = 'none';
  }
}

function openRescheduleModal(orderId) {
  document.getElementById('reschedule-modal-order-id').value = orderId;
  document.getElementById('reschedule-date').value = '';
  document.getElementById('reschedule-modal').showModal();
}

function closeRescheduleModal() {
  document.getElementById('reschedule-modal').close();
}

function toggleZoneSelectors() {
  const rateType = document.getElementById('rc-rate-type').value;
  const hint = document.getElementById('rc-zone-hint');
  const fromLabel = document.querySelector('label[for="rc-zone-from"]');
  const toLabel = document.querySelector('label[for="rc-zone-to"]');

  if (rateType === 'inter') {
    fromLabel.textContent = 'From Zone';
    toLabel.textContent = 'To Zone';
    hint.textContent = 'Leave both zones empty to create a generic inter-zone fallback card. Choose two different zones for a route-specific override.';
    return;
  }

  fromLabel.textContent = 'Zone';
  toLabel.textContent = 'Same Zone';
  hint.textContent = 'Leave both zones empty to create a generic intra-zone fallback card. Choose the same zone in both fields for a zone-specific override.';
}

// ------------------------------------------------------------------
// DATA LOADING FOR DASHBOARDS
// ------------------------------------------------------------------

// A. CUSTOMER DASHBOARD
async function loadCustomerOrders() {
  try {
    const orders = await apiFetch('/api/orders');
    const tableBody = document.getElementById('customer-orders-table');
    tableBody.innerHTML = '';

    if (orders.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;" class="text-muted">No orders found.</td></tr>';
      return;
    }

    orders.forEach(order => {
      const row = document.createElement('tr');
      
      const badgeClass = `badge badge-${order.status.toLowerCase().replace(/\s+/g, '')}`;
      const rescheduleBtn = order.status === 'Failed' 
        ? `<button class="btn btn-seed active" onclick="openRescheduleModal('${order.id}')">Reschedule</button>` 
        : '';

      row.innerHTML = `
        <td>#${order.id}</td>
        <td>${order.pickup_address} (${order.pickup_postal_code})</td>
        <td>${order.drop_address} (${order.drop_postal_code})</td>
        <td style="font-weight:600;">${Number(order.total_charge).toFixed(2)}</td>
        <td><span class="${badgeClass}">${order.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-seed" onclick="viewOrderTracking('${order.id}')">Track</button>
          ${rescheduleBtn}
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    alert('Failed to load orders: ' + err.message);
  }
}

// B. AGENT CONSOLE
async function loadAgentConsole() {
  try {
    // Populate Agent Zone choices
    const zones = await apiFetch('/api/zones');
    const zoneSelect = document.getElementById('agent-zone');
    zoneSelect.innerHTML = '<option value="">No Zone / Offline</option>';
    zones.forEach(z => {
      const opt = document.createElement('option');
      opt.value = z.id;
      opt.textContent = z.name;
      zoneSelect.appendChild(opt);
    });

    // Populate Current Position Mock values
    if (currentUser) {
      document.getElementById('agent-lat').value = currentUser.latitude || 28.6304;
      document.getElementById('agent-lon').value = currentUser.longitude || 77.2177;
      document.getElementById('agent-zone').value = currentUser.current_zone_id || '';
    }

    const orders = await apiFetch('/api/orders');
    const tableBody = document.getElementById('agent-orders-table');
    tableBody.innerHTML = '';

    if (orders.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;" class="text-muted">No shipments currently assigned to you.</td></tr>';
      return;
    }

    orders.forEach(order => {
      const row = document.createElement('tr');
      const badgeClass = `badge badge-${order.status.toLowerCase().replace(/\s+/g, '')}`;
      
      row.innerHTML = `
        <td>#${order.id}</td>
        <td>${order.pickup_address}</td>
        <td>${order.drop_address}</td>
        <td><span style="font-size:0.8rem; font-weight:600;">${order.order_type}</span></td>
        <td>${order.payment_type}</td>
        <td style="font-weight:600;">${Number(order.total_charge).toFixed(2)}</td>
        <td><span class="${badgeClass}">${order.status}</span></td>
        <td>
          <button class="btn btn-secondary mr-2 btn-seed" onclick="viewOrderTracking('${order.id}')">History</button>
          <button class="btn btn-success btn-seed" onclick="openStatusModal('${order.id}', '${order.status}', 'delivery_agent')">Update</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    alert('Failed to load agent console: ' + err.message);
  }
}

// C. ADMIN CONTROL CENTER
function switchAdminTab(paneId, tabButton) {
  document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.admin-pane').forEach(pane => pane.classList.remove('active'));
  
  tabButton.classList.add('active');
  document.getElementById(paneId).classList.add('active');
}

async function loadAdminData() {
  loadAdminOrders();
  loadAuditLogs();
  
  // Populate dropdowns & lists
  try {
    const zones = await apiFetch('/api/zones');
    
    // Filter Zone Select
    const filterZone = document.getElementById('filter-zone');
    filterZone.innerHTML = '<option value="">All Zones</option>';
    
    // Assign Area Zone Select
    const areaZoneSelect = document.getElementById('area-zone-id');
    areaZoneSelect.innerHTML = '';
    
    // RateCard Zone from/to Selects
    const rcZoneFrom = document.getElementById('rc-zone-from');
    rcZoneFrom.innerHTML = '<option value="">Any Zone (Fallback)</option>';
    const rcZoneTo = document.getElementById('rc-zone-to');
    rcZoneTo.innerHTML = '<option value="">Any Zone (Fallback)</option>';

    zones.forEach(z => {
      const opt = document.createElement('option');
      opt.value = z.id;
      opt.textContent = z.name;
      filterZone.appendChild(opt);

      const opt2 = document.createElement('option');
      opt2.value = z.id;
      opt2.textContent = `${z.name} (${z.code})`;
      areaZoneSelect.appendChild(opt2);

      const opt3 = document.createElement('option');
      opt3.value = z.id;
      opt3.textContent = z.name;
      rcZoneFrom.appendChild(opt3);

      const opt4 = document.createElement('option');
      opt4.value = z.id;
      opt4.textContent = z.name;
      rcZoneTo.appendChild(opt4);
    });

    const agents = await apiFetch('/api/admin/agents');
    const filterAgent = document.getElementById('filter-agent');
    filterAgent.innerHTML = '<option value="">All Agents</option>';
    agents.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.name;
      filterAgent.appendChild(opt);
    });

    // Populate rate cards overview and COD inputs
    const rcData = await apiFetch('/api/rate-cards');
    
    // Setup COD Surcharge inputs
    const codB2BSetting = rcData.settings.find(s => s.key === 'cod_surcharge_B2B');
    const codB2CSetting = rcData.settings.find(s => s.key === 'cod_surcharge_B2C');
    document.getElementById('set-cod-b2b').value = codB2BSetting ? parseFloat(codB2BSetting.value) : 15.00;
    document.getElementById('set-cod-b2c').value = codB2CSetting ? parseFloat(codB2CSetting.value) : 10.00;

    // Build Rate Cards summary list
    const rcTable = document.getElementById('ratecards-list-table');
    rcTable.innerHTML = '';
    rcData.rateCards.forEach(rc => {
      const row = document.createElement('tr');
      const fromZone = rc.zoneFrom ? rc.zoneFrom.name : 'Any';
      const toZone = rc.zoneTo ? rc.zoneTo.name : 'Any';
      
      row.innerHTML = `
        <td style="font-weight:600;">${rc.name}</td>
        <td><span class="badge badge-assigned">${rc.order_type}</span></td>
        <td><span class="badge badge-pickedup">${rc.rate_type}</span></td>
        <td>${fromZone} → ${toZone}</td>
        <td>${rc.base_weight_kg} kg</td>
        <td>${Number(rc.base_rate).toFixed(2)}</td>
        <td>${Number(rc.excess_rate_per_kg).toFixed(2)}/kg</td>
      `;
      rcTable.appendChild(row);
    });

  } catch (err) {
    console.error('Failed to load admin metadata:', err);
  }
}

async function loadAdminOrders() {
  const status = document.getElementById('filter-status').value;
  const zoneId = document.getElementById('filter-zone').value;
  const agentId = document.getElementById('filter-agent').value;

  let query = '';
  const params = [];
  if (status) params.push(`status=${status}`);
  if (zoneId) params.push(`zone_id=${zoneId}`);
  if (agentId) params.push(`agent_id=${agentId}`);
  if (params.length > 0) query = `?${params.join('&')}`;

  try {
    const orders = await apiFetch(`/api/orders${query}`);
    const tableBody = document.getElementById('admin-orders-table');
    tableBody.innerHTML = '';

    // Calculate dynamic stats from orders
    updateAdminStats(orders);

    if (orders.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;" class="text-muted">No shipments match these filters.</td></tr>';
      return;
    }

    orders.forEach(order => {
      const row = document.createElement('tr');
      const badgeClass = `badge badge-${order.status.toLowerCase().replace(/\s+/g, '')}`;
      const agentCell = order.agent 
        ? `${order.agent.name} <span class="text-muted" style="font-size:0.75rem;">(ID: ${order.agent.id})</span>` 
        : '<span class="text-warning" style="font-weight:500;">Unassigned</span>';

      const pickupZoneName = order.pickupZone ? order.pickupZone.name : 'Unknown';

      row.innerHTML = `
        <td>#${order.id}</td>
        <td>${order.customer.name}</td>
        <td>${pickupZoneName} (${order.pickup_postal_code})</td>
        <td>${order.dropZone ? order.dropZone.name : 'Unknown'} (${order.drop_postal_code})</td>
        <td>${order.chargeable_weight_kg} kg</td>
        <td style="font-weight:600;">${Number(order.total_charge).toFixed(2)}</td>
        <td><span class="${badgeClass}">${order.status}</span></td>
        <td>${agentCell}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-seed" onclick="viewOrderTracking('${order.id}')" title="View Details">View</button>
            <button class="btn btn-secondary btn-seed" onclick="openAssignModal('${order.id}', '${pickupZoneName}', '${order.pickup_zone_id}')" title="Assign Agent">Assign</button>
            <button class="btn btn-success btn-seed" onclick="openStatusModal('${order.id}', '${order.status}', 'admin')" title="Force Status">Status</button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    alert('Failed to load admin orders: ' + err.message);
  }
}

function updateAdminStats(orders) {
  // Aggregate stats on current loaded set (or fetch complete set)
  document.getElementById('admin-stat-total').textContent = orders.length;
  document.getElementById('admin-stat-pending').textContent = orders.filter(o => o.status === 'Pending').length;
  document.getElementById('admin-stat-transit').textContent = orders.filter(o => ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(o.status)).length;
  document.getElementById('admin-stat-failed').textContent = orders.filter(o => o.status === 'Failed').length;
}

async function loadAuditLogs() {
  try {
    const logs = await apiFetch('/api/admin/audit-logs');
    const container = document.getElementById('audit-log-container');
    container.innerHTML = '';

    if (logs.length === 0) {
      container.innerHTML = '<div class="text-muted" style="text-align: center; padding: 20px;">No notification logs recorded yet.</div>';
      return;
    }

    logs.forEach(log => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      
      const isEmail = log.type === 'email';
      const typeBadge = `<span class="badge ${isEmail ? 'badge-assigned' : 'badge-intransit'}">${log.type}</span>`;
      const statusBadge = `<span class="badge ${log.status.includes('Failed') ? 'badge-failed' : 'badge-delivered'}">${log.status}</span>`;
      const dateStr = new Date(log.created_at).toLocaleString();

      entry.innerHTML = `
        <div class="log-entry-header">
          <div>${typeBadge} <strong>To:</strong> ${log.recipient}</div>
          <div>${statusBadge} <span class="text-muted" style="margin-left: 8px;">${dateStr}</span></div>
        </div>
        ${log.subject ? `<div style="font-weight: 500; margin-bottom:4px;">Subject: ${log.subject}</div>` : ''}
        <div class="log-entry-body">${log.body}</div>
      `;
      container.appendChild(entry);
    });
  } catch (err) {
    console.error('Failed to load audit logs:', err);
  }
}

// ------------------------------------------------------------------
// ORDER TRACKING DETAIL VIEWS
// ------------------------------------------------------------------
async function viewOrderTracking(orderId) {
  try {
    const order = await apiFetch(`/api/orders/${orderId}`);
    showSection('order-details-section');

    // 1. Render Order Details Card
    const detailsCard = document.getElementById('order-details-card');
    
    const rescheduleBtn = (order.status === 'Failed' && currentUser.role === 'customer')
      ? `<button class="btn btn-success mt-4" style="width: 100%;" onclick="openRescheduleModal('${order.id}')">Reschedule Shipment</button>`
      : '';

    const agentSection = order.agent 
      ? `<div class="pricing-row"><span>Assigned Agent:</span><strong>${order.agent.name} (${order.agent.phone || 'No phone'})</strong></div>
         ${order.agent.latitude ? `<div class="pricing-row text-muted" style="font-size:0.75rem;"><span>Last Coordinates:</span><strong>${Number(order.agent.latitude).toFixed(4)}, ${Number(order.agent.longitude).toFixed(4)}</strong></div>` : ''}`
      : `<div class="pricing-row text-warning"><span>Assigned Agent:</span><strong>Unassigned</strong></div>`;

    detailsCard.innerHTML = `
      <div class="flex-between mb-4">
        <h2 style="font-size:1.4rem;">Order #${order.id}</h2>
        <span class="badge badge-${order.status.toLowerCase().replace(/\s+/g, '')}">${order.status}</span>
      </div>
      
      <h3 style="font-size:0.95rem;" class="text-primary mb-4">Shipment Details:</h3>
      <div class="pricing-row"><span>Customer:</span><strong>${order.customer.name}</strong></div>
      <div class="pricing-row"><span>Pickup Address:</span><strong>${order.pickup_address}</strong></div>
      <div class="pricing-row"><span>Dropoff Address:</span><strong>${order.drop_address}</strong></div>
      <div class="pricing-row"><span>Route Type:</span><strong>${order.pickupZone ? order.pickupZone.name : 'Unknown'} → ${order.dropZone ? order.dropZone.name : 'Unknown'} (${order.order_type})</strong></div>
      
      <hr style="border:0; border-top:1px solid var(--border-color); margin:12px 0;" />
      
      <div class="pricing-row"><span>Dimensions:</span><strong>${order.length_cm} × ${order.width_cm} × ${order.height_cm} cm</strong></div>
      <div class="pricing-row"><span>Actual Weight:</span><strong>${order.actual_weight_kg} kg</strong></div>
      <div class="pricing-row"><span>Volumetric Weight:</span><strong>${order.volumetric_weight_kg} kg</strong></div>
      <div class="pricing-row"><span>Chargeable Weight:</span><strong>${order.chargeable_weight_kg} kg</strong></div>
      
      <hr style="border:0; border-top:1px solid var(--border-color); margin:12px 0;" />
      
      ${agentSection}
      ${order.reschedule_date ? `<div class="pricing-row text-success"><span>Rescheduled Date:</span><strong>${new Date(order.reschedule_date).toLocaleDateString()}</strong></div>` : ''}
      ${order.failed_reason ? `<div class="pricing-row text-danger"><span>Failure Reason:</span><strong>${order.failed_reason}</strong></div>` : ''}

      <div class="pricing-breakdown">
        <div class="pricing-row"><span>Delivery Fee:</span><strong>${Number(order.delivery_charge).toFixed(2)}</strong></div>
        ${Number(order.cod_surcharge) > 0 ? `<div class="pricing-row text-warning"><span>COD Surcharge:</span><strong>${Number(order.cod_surcharge).toFixed(2)}</strong></div>` : ''}
        <div class="pricing-row"><span>Total Charge (${order.payment_type}):</span><strong>${Number(order.total_charge).toFixed(2)}</strong></div>
      </div>
      
      ${rescheduleBtn}
    `;

    // 2. Render Vertical Status Timeline
    const timelineFlow = document.getElementById('order-timeline-flow');
    timelineFlow.innerHTML = '';

    if (!order.history || order.history.length === 0) {
      timelineFlow.innerHTML = '<div class="text-muted">No history logs recorded.</div>';
      return;
    }

    order.history.forEach((h, index) => {
      const isLast = index === order.history.length - 1;
      
      const itemDiv = document.createElement('div');
      itemDiv.className = 'timeline-item';
      if (isLast) {
        itemDiv.classList.add('active');
        if (h.status === 'Failed') itemDiv.classList.add('failed');
        if (h.status === 'Delivered') itemDiv.classList.add('success');
      }

      const dateStr = new Date(h.created_at).toLocaleString();
      const roleStr = h.actor ? h.actor.role.toUpperCase() : 'SYSTEM';
      const actorStr = h.actor ? `${h.actor.name} (${roleStr})` : 'System Automatic Process';

      itemDiv.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-title">${h.status}</span>
            <span class="timeline-time">${dateStr}</span>
          </div>
          <div class="timeline-actor">By: ${actorStr}</div>
          <div class="timeline-notes">${h.notes || 'No comments.'}</div>
        </div>
      `;
      timelineFlow.appendChild(itemDiv);
    });

  } catch (err) {
    alert('Failed to load tracking information: ' + err.message);
  }
}

function goBackToDashboard() {
  loadRoleDashboard();
}
