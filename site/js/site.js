(function () {
  "use strict";
  var C = window.KK_CONFIG || {};
  var PRODUCTS = [
    { code: "original-6", name: "Original, box of 6", price: 399, img: "core-range" },
    { code: "original-12", name: "Original, box of 12", price: 749, img: "core-open-12" },
    { code: "original-24", name: "Original, box of 24", price: 1399, img: "hero-cover" },
    { code: "single", name: "Single piece", price: 79, img: "wrapped-single" },
    { code: "kokum-12", name: "Kokum Koi, box of 12 (summer)", price: 799, img: "kokum-box" },
    { code: "bebinca-12", name: "Bebinca Koi, box of 12 (Christmas)", price: 849, img: "bebinca-box" },
    { code: "mixed-12", name: "Mixed box, 6 + 6", price: 799, img: "mixed-box" }
  ];
  var inr = function (n) { return "₹" + n.toLocaleString("en-IN"); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Mobile nav
  var t = $(".nav-toggle"), nav = $("#nav");
  if (t && nav) t.addEventListener("click", function () {
    var o = nav.classList.toggle("open"); t.setAttribute("aria-expanded", o ? "true" : "false");
  });

  function waReady() { return /^\d{10,15}$/.test(String(C.whatsappNumber || "")); }

  function post(payload) {
    return fetch(C.submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + C.anonKey, "apikey": C.anonKey },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); });
  }
  function showErrors(el, res) {
    el.className = "form-status err";
    el.textContent = (res && res.errors && res.errors.join(" ")) || (res && res.error) || "Something went wrong. Please try again.";
  }
  function markInvalid(form) {
    var bad = $$("[required]", form).filter(function (i) { return !i.checkValidity(); });
    $$("[aria-invalid]", form).forEach(function (i) { i.removeAttribute("aria-invalid"); });
    bad.forEach(function (i) { i.setAttribute("aria-invalid", "true"); });
    if (bad.length) bad[0].focus();
    return bad.length === 0;
  }
  function minDate(input, days) {
    if (!input) return;
    var d = new Date(Date.now() + days * 864e5);
    input.min = d.toISOString().slice(0, 10);
  }

  // ORDER PAGE
  var of = $("#order-form");
  if (of) {
    var pick = $("#pick"), qty = {};
    var pre = new URLSearchParams(location.search).get("box");
    PRODUCTS.forEach(function (p) {
      qty[p.code] = p.code === pre ? 1 : 0;
      var li = document.createElement("li");
      li.innerHTML = '<img src="img/' + p.img + '-720.webp" alt="" width="64" height="48" loading="lazy">' +
        '<div><div class="nm" id="nm-' + p.code + '">' + p.name + '</div><div class="pr">' + inr(p.price) + '<span class="mrp"> · MRP incl. taxes</span></div></div>' +
        '<div class="qty" role="group" aria-labelledby="nm-' + p.code + '">' +
        '<button type="button" data-d="-1" aria-label="Fewer ' + p.name + '">−</button>' +
        '<input type="number" min="0" max="200" inputmode="numeric" value="' + qty[p.code] + '" aria-label="Quantity of ' + p.name + '">' +
        '<button type="button" data-d="1" aria-label="More ' + p.name + '">+</button></div>';
      var input = $("input", li);
      $$("button", li).forEach(function (b) {
        b.addEventListener("click", function () {
          qty[p.code] = Math.max(0, Math.min(200, (qty[p.code] || 0) + Number(b.dataset.d)));
          input.value = qty[p.code]; render();
        });
      });
      input.addEventListener("input", function () {
        var v = Math.floor(Number(input.value)); qty[p.code] = isFinite(v) ? Math.max(0, Math.min(200, v)) : 0; render();
      });
      pick.appendChild(li);
    });
    function lines() { return PRODUCTS.filter(function (p) { return qty[p.code] > 0; }); }
    function total() { return lines().reduce(function (s, p) { return s + p.price * qty[p.code]; }, 0); }
    function render() {
      var tb = $("#sum-lines"), ls = lines();
      tb.innerHTML = ls.length ? ls.map(function (p) {
        return "<tr><td>" + qty[p.code] + " × " + p.name + "</td><td>" + inr(p.price * qty[p.code]) + "</td></tr>";
      }).join("") : '<tr><td class="empty" colspan="2">No boxes chosen yet.</td></tr>';
      $("#sum-total").textContent = inr(total());
      var mb = $("#mbar-total"); if (mb) mb.textContent = inr(total());
      var wa = $("#wa-btn");
      var msg = "Hello Kaju Koi, I would like to pre-order: " + (ls.map(function (p) { return qty[p.code] + " x " + p.name; }).join(", ") || "(boxes)") + ". Total " + inr(total()) + ".";
      wa.href = "https://wa.me/" + (waReady() ? C.whatsappNumber : "[WhatsApp number]") + "?text=" + encodeURIComponent(msg);
    }
    render();
    document.body.classList.add("has-mbar");
    minDate($("#o-date"), 3);
    $("#wa-btn").addEventListener("click", function (e) {
      if (!waReady()) { e.preventDefault(); var s = $("#o-status"); s.className = "form-status"; s.textContent = "WhatsApp ordering is coming soon. For now, please send the pre-order request form."; }
    });
    var gc = $("#o-giftcard"), gw = $("#gift-wrap"), gm = $("#o-gift");
    gc.addEventListener("change", function () { gw.hidden = !gc.checked; if (gc.checked) gm.focus(); });
    gm.addEventListener("input", function () { $("#gift-count").textContent = gm.value.length; });

    of.addEventListener("submit", function (e) {
      e.preventDefault();
      var st = $("#o-status"); st.className = "form-status"; st.textContent = "";
      if (!lines().length) { st.className = "form-status err"; st.textContent = "Choose at least one box."; $("#pick button[data-d='1']").focus(); return; }
      if (!markInvalid(of)) { st.className = "form-status err"; st.textContent = "Please fill in the highlighted fields."; return; }
      var fd = new FormData(of), btn = $("#o-submit");
      var payload = {
        type: "order",
        items: lines().map(function (p) { return { code: p.code, qty: qty[p.code] }; }),
        address: fd.get("address"), city: fd.get("city"), pincode: fd.get("pincode"), preferred_date: fd.get("preferred_date"),
        name: fd.get("name"), phone: fd.get("phone"), email: fd.get("email"),
        gift_card: gc.checked, gift_message: gc.checked ? fd.get("gift_message") : "", notes: fd.get("notes"), website: fd.get("website")
      };
      btn.disabled = true; btn.textContent = "Sending…";
      post(payload).then(function (res) {
        if (res && res.ok) {
          of.hidden = true; var mbar = $("#mbar"); if (mbar) mbar.hidden = true;
          $("#done-ref").textContent = res.reference;
          $("#done-total").textContent = inr(res.total_inr != null ? res.total_inr : total());
          var d = $("#order-done"); d.hidden = false; d.focus(); window.scrollTo(0, d.getBoundingClientRect().top + scrollY - 100);
        } else { showErrors(st, res); }
      }).catch(function () { showErrors(st); })
        .then(function () { btn.disabled = false; btn.textContent = "Send pre-order request"; });
    });
  }

  // ENQUIRY PAGE
  var ef = $("#enq-form");
  if (ef) {
    minDate($("#e-date"), 1);
    $$("[data-occasion]").forEach(function (a) {
      a.addEventListener("click", function () { $("#e-occasion").value = a.dataset.occasion; });
    });
    ef.addEventListener("submit", function (e) {
      e.preventDefault();
      var st = $("#e-status"); st.className = "form-status"; st.textContent = "";
      if (!markInvalid(ef)) { st.className = "form-status err"; st.textContent = "Please fill in the highlighted fields."; return; }
      var fd = new FormData(ef), btn = $("#e-submit");
      var payload = {
        type: "enquiry", occasion: fd.get("occasion"), event_date: fd.get("event_date"), gift_count: fd.get("gift_count"),
        budget_per_gift: fd.get("budget_per_gift"), city: fd.get("city"), personalisation: fd.getAll("personalisation"),
        name: fd.get("name"), company: fd.get("company"), phone: fd.get("phone"), email: fd.get("email"), notes: fd.get("notes"), website: fd.get("website")
      };
      btn.disabled = true; btn.textContent = "Sending…";
      post(payload).then(function (res) {
        if (res && res.ok) {
          ef.hidden = true; $("#enq-ref").textContent = res.reference;
          var d = $("#enq-done"); d.hidden = false; d.focus();
        } else { showErrors(st, res); }
      }).catch(function () { showErrors(st); })
        .then(function () { btn.disabled = false; btn.textContent = "Send enquiry"; });
    });
  }
})();
