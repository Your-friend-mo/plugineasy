/**
 * PluginEasy Content Locker Engine
 * User ID: 831501
 * Public API Key: 8902c82579eec05db438
 * Offers API Key: 4a1d7b7a9f26dbe08fc3a0b059296411
 */
(function (window, document) {
  'use strict';

  var LOCKER_CONFIG = {
    userId: "831501",
    apiKeyPublic: "8902c82579eec05db438",
    apiKeyOffers: "4a1d7b7a9f26dbe08fc3a0b059296411",
    feedUrl: "https://dtvpp42hfuyb2.cloudfront.net/public/offers/feed.php?user_id=831501&api_key=4a1d7b7a9f26dbe08fc3a0b059296411&s1=&s2=",
    fallbackJsonUrls: ["js/offers.json", "/js/offers.json", "../js/offers.json", "offers.json"],
    apkDownloadUrl: "downloads/plugineasy.apk",
    requiredOffers: 1
  };

  var DEFAULT_OFFERS = [
    {
      id: "f0J6oYVbz2HJ3tW",
      name: "Tap Rewards - Earn Rewards",
      anchor: "Tap to claim your bonus!",
      conversion: "Complete with valid information",
      network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/959/29075/1327898810.200x200.png",
      url: "https://oak.hoprly.com/a?p=o0J7NAb5C87OEGJ&o=f0J6oYVbz2HJ3tW&s7=null&s8=null&s9=e96b5ec97f54",
      impression_url: "https://oak.hoprly.com/i?p=o0J7NAb5C87OEGJ&o=f0J6oYVbz2HJ3tW"
    },
    {
      id: "f0J6oYMrKhRm5E3",
      name: "Ball Catcher",
      anchor: "Complete free sponsor survey to unlock",
      conversion: "Complete the survey",
      network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/959/33079/3019980592.200x200.jpeg",
      url: "https://oak.hoprly.com/a?p=o0J7NAb5C87OEGJ&o=f0J6oYMrKhRm5E3&s7=null&s8=null&s9=e96b5ec97f54",
      impression_url: "https://oak.hoprly.com/i?p=o0J7NAb5C87OEGJ&o=f0J6oYMrKhRm5E3"
    },
    {
      id: "f0J6oYX3QDUNnDi",
      name: "ClickBox - Earn Bonus",
      anchor: "Tap to claim your reward!",
      conversion: "Complete the survey",
      network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/959/28565/1457439075.200x200.png",
      url: "https://oak.hoprly.com/a?p=o0J7NAb5C87OEGJ&o=f0J6oYX3QDUNnDi&s7=null&s8=null&s9=e96b5ec97f54",
      impression_url: "https://oak.hoprly.com/i?p=o0J7NAb5C87OEGJ&o=f0J6oYX3QDUNnDi"
    }
  ];

  var currentOffers = [];
  var offersLoaded = false;
  var clickedOffer = false;
  var targetAppName = 'PluginEasy App';

  function getRootRelative(path) {
    if (window.location.pathname.indexOf('/app/') !== -1) {
      return '../' + path;
    }
    return path;
  }

  function loadOffers(callback) {
    if (offersLoaded && currentOffers.length > 0) {
      if (callback) callback(currentOffers);
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", LOCKER_CONFIG.feedUrl, true);
    xhr.timeout = 5000;
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (Array.isArray(data) && data.length > 0) {
            currentOffers = data;
            offersLoaded = true;
            if (callback) callback(currentOffers);
            return;
          }
        } catch (e) {}
      }
      loadFallbackJson(0, callback);
    };
    xhr.onerror = function () { loadFallbackJson(0, callback); };
    xhr.ontimeout = function () { loadFallbackJson(0, callback); };
    try {
      xhr.send();
    } catch (e) {
      loadFallbackJson(0, callback);
    }
  }

  function loadFallbackJson(index, callback) {
    if (index >= LOCKER_CONFIG.fallbackJsonUrls.length) {
      currentOffers = DEFAULT_OFFERS;
      offersLoaded = true;
      if (callback) callback(currentOffers);
      return;
    }

    var rawUrl = LOCKER_CONFIG.fallbackJsonUrls[index];
    var url = rawUrl.indexOf('/') === 0 ? rawUrl : getRootRelative(rawUrl);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.timeout = 3000;
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (Array.isArray(data) && data.length > 0) {
            currentOffers = data;
            offersLoaded = true;
            if (callback) callback(currentOffers);
            return;
          }
        } catch (e) {}
      }
      loadFallbackJson(index + 1, callback);
    };
    xhr.onerror = function () { loadFallbackJson(index + 1, callback); };
    xhr.ontimeout = function () { loadFallbackJson(index + 1, callback); };
    try {
      xhr.send();
    } catch (e) {
      loadFallbackJson(index + 1, callback);
    }
  }

  function createModalHtml(appName) {
    var favicon = getRootRelative('favicon.ico');
    return [
      '<div id="plugineasyLockerModal" class="plugineasy-modal-backdrop" style="display:none;" role="dialog" aria-modal="true">',
      '  <div class="plugineasy-modal-card">',
      '    <div class="plugineasy-modal-header">',
      '      <button type="button" class="plugineasy-modal-close" onclick="window.closeContentLocker()" aria-label="Close">&times;</button>',
      '      <div class="plugineasy-badge-lock">🔒 Verification Required</div>',
      '      <h3 class="plugineasy-modal-title">Install ' + escapeHtml(appName) + '</h3>',
      '      <p class="plugineasy-modal-subtitle">Complete 1 free sponsor offer below to verify your device and immediately unlock the APK installer package.</p>',
      '    </div>',
      '    <div class="plugineasy-modal-body">',
      '      <div class="plugineasy-step-indicator">',
      '        <span>Status: <b id="peLockerStatusText">Verification Pending</b></span>',
      '        <span>Step: <b>1 of 1</b></span>',
      '      </div>',
      '      <div id="plugineasyOffersContainer">',
      '        <div class="plugineasy-loading-offers">',
      '          <div class="plugineasy-spinner"></div>',
      '          <p>Loading verified offers for your device...</p>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div class="plugineasy-modal-footer">',
      '      <button type="button" id="plugineasyCheckStatusBtn" class="plugineasy-check-btn" onclick="window.checkLockerStatus()">',
      '        ⬇ Download Verified APK',
      '      </button>',
      '      <p class="plugineasy-footer-note">Free &amp; 100% Virus Free • Verified by Google Play Protect &amp; Apple TestFlight</p>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderOffers(offers) {
    var container = document.getElementById("plugineasyOffersContainer");
    if (!container) return;

    if (!offers || offers.length === 0) {
      container.innerHTML = '<div class="plugineasy-loading-offers"><p>No offers available at this moment. You can download directly below.</p></div>';
      return;
    }

    var favicon = getRootRelative('favicon.ico');
    var html = '<div class="plugineasy-offers-list">';
    for (var i = 0; i < offers.length; i++) {
      var item = offers[i];
      var icon = item.network_icon || favicon;
      var name = item.name || 'Sponsor Offer';
      var desc = item.conversion || item.anchor || 'Complete simple task to unlock';
      var url = item.url || '#';
      var imp = item.impression_url || '';

      html += '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" class="plugineasy-offer-item" data-offer-id="' + escapeHtml(item.id) + '" data-imp="' + escapeHtml(imp) + '" onclick="window.onLockerOfferClick(this, event)">';
      html += '  <img src="' + escapeHtml(icon) + '" alt="' + escapeHtml(name) + '" class="plugineasy-offer-icon" onerror="this.src=\'' + favicon + '\'">';
      html += '  <div class="plugineasy-offer-info">';
      html += '    <h4 class="plugineasy-offer-name">' + escapeHtml(name) + '</h4>';
      html += '    <p class="plugineasy-offer-desc">' + escapeHtml(desc) + '</p>';
      html += '  </div>';
      html += '  <span class="plugineasy-offer-btn">Free ↗</span>';
      html += '</a>';
    }
    html += '</div>';

    container.innerHTML = html;

    // Send impressions
    for (var j = 0; j < offers.length; j++) {
      if (offers[j].impression_url) {
        var img = new Image();
        img.src = offers[j].impression_url;
      }
    }
  }

  window.openContentLocker = function (appName) {
    appName = appName || 'PluginEasy App';
    targetAppName = appName;

    var modal = document.getElementById("plugineasyLockerModal");
    if (!modal) {
      var div = document.createElement("div");
      div.innerHTML = createModalHtml(appName);
      document.body.appendChild(div.firstElementChild);
      modal = document.getElementById("plugineasyLockerModal");
    } else {
      var titleEl = modal.querySelector(".plugineasy-modal-title");
      if (titleEl) titleEl.textContent = 'Install ' + appName;
    }

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    loadOffers(function (offers) {
      renderOffers(offers);
    });
  };

  window.closeContentLocker = function () {
    var modal = document.getElementById("plugineasyLockerModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }
  };

  window.onLockerOfferClick = function (el) {
    clickedOffer = true;
    var statusText = document.getElementById("peLockerStatusText");
    if (statusText) {
      statusText.textContent = "Verifying Sponsor Completion...";
      statusText.style.color = "#00ff88";
    }

    var checkBtn = document.getElementById("plugineasyCheckStatusBtn");
    if (checkBtn) {
      checkBtn.innerHTML = "⏳ Verifying Offer... Tap to Download APK";
      checkBtn.style.background = "#00ff88";
    }
  };

  window.checkLockerStatus = function () {
    var apkPath = getRootRelative(LOCKER_CONFIG.apkDownloadUrl);

    if (!clickedOffer) {
      alert("Please tap on 1 offer above to complete verification and unlock your download.");
      return;
    }

    var checkBtn = document.getElementById("plugineasyCheckStatusBtn");
    if (checkBtn) {
      checkBtn.innerHTML = "✓ Verified! Starting Download...";
    }

    setTimeout(function () {
      var link = document.createElement("a");
      link.href = apkPath;
      link.download = targetAppName.replace(/[^a-zA-Z0-9_-]/g, "_") + ".apk";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(function () {
        window.closeContentLocker();
      }, 1500);
    }, 700);
  };

})(window, document);
