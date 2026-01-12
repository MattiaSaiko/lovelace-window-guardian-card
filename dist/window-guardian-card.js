class WindowGuardianCard extends HTMLElement {
  constructor() {
    super();
    this._translations = {};
  }

  async loadTranslations(lang) {
    const langCode = lang ? lang.split('-')[0] : 'en';
    
    try {
      const response = await fetch(
        `/local/community/lovelace-window-guardian-card/translations/${langCode}.json`
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      console.warn(`Window Guardian Card: Translation file for '${langCode}' not found, trying English fallback`);
      
      const fallbackResponse = await fetch(
        `/local/community/lovelace-window-guardian-card/translations/en.json`
      );
      
      if (fallbackResponse.ok) {
        return await fallbackResponse.json();
      }
      
      console.error('Window Guardian Card: No translation files found');
      return this._getEmergencyTranslations();
      
    } catch (error) {
      console.error('Window Guardian Card: Error loading translations', error);
      return this._getEmergencyTranslations();
    }
  }

  _getEmergencyTranslations() {
    return {
      common: { no_entities: 'Select entities to start' },
      card: {
        subtitle_all_closed: 'All closed',
        subtitle_open_singular: '1 opening detected',
        subtitle_open_plural: 'openings detected',
        temperature_alert: '⚠️ Frost protection',
        temperature_banner_prefix: '🌡️ Open with outside temperature:',
        chip_open: 'Open',
        chip_closed: 'Closed',
        time_now: 'Now',
        time_minutes_ago: 'm ago',
        time_hours_ago: 'h ago',
        time_yesterday: 'Yesterday',
        time_days_ago: 'd ago'
      }
    };
  }

  localize(key, fallback = '') {
    if (!this._translations) return fallback;
    const keys = key.split('.');
    let value = this._translations;
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return fallback;
      }
    }
    return value || fallback;
  }

  setConfig(config) {
    let entities = config.entities || [];
    if (!Array.isArray(entities)) {
      entities = [entities];
    }

    entities = entities
      .filter(e => {
        if (typeof e === 'string') return true;
        if (e && typeof e === 'object' && e.entity) return true;
        return false;
      })
      .map(e => typeof e === 'string' ? { entity: e } : e);

    this._config = {
      title: config.title ?? "Openings",
      show_closed: config.show_closed ?? false,
      compact: config.compact ?? false,
      attention_threshold: config.attention_threshold ?? 1,
      show_list: config.show_list ?? true,
      show_battery: config.show_battery ?? false,
      show_last_changed: config.show_last_changed ?? false,
      device_classes: config.device_classes ?? ["door", "window", "opening"],
      tap_action: config.tap_action ?? "more-info",
      temperature_threshold: config.temperature_threshold ?? null,
      temperature_entity: config.temperature_entity ?? null,
      entities: entities,
    };

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    if (!this._hass) {
      this.loadTranslations('en').then(translations => {
        this._translations = translations;
      });
    }
  }

  set hass(hass) {
    const oldLang = this._hass?.language;
    this._hass = hass;
    if (!this._config) return;

    if (hass.language && hass.language !== oldLang) {
      this.loadTranslations(hass.language).then(translations => {
        this._translations = translations;
        this._render();
      });
    } else if (!oldLang) {
      this.loadTranslations(hass.language).then(translations => {
        this._translations = translations;
        this._render();
      });
    } else {
      this._render();
    }
  }

  getCardSize() {
    return this._config.compact ? 1 : 2;
  }

  _isColdOutside() {
    if (!this._config.temperature_entity || !this._config.temperature_threshold) {
      return false;
    }
    
    const tempEntity = this._hass.states[this._config.temperature_entity];
    if (!tempEntity || tempEntity.state === 'unknown' || tempEntity.state === 'unavailable') {
      return false;
    }
    
    const currentTemp = parseFloat(tempEntity.state);
    return !isNaN(currentTemp) && currentTemp <= this._config.temperature_threshold;
  }

  _getCurrentTemperature() {
    if (!this._config.temperature_entity) return null;
    
    const tempEntity = this._hass.states[this._config.temperature_entity];
    if (!tempEntity || tempEntity.state === 'unknown' || tempEntity.state === 'unavailable') {
      return null;
    }
    
    return parseFloat(tempEntity.state);
  }

  _getOpenCount() {
    if (!this._config.entities || this._config.entities.length === 0) return 0;

    const entities = this._config.entities
      .map((e) => ({ cfg: e, state: this._hass.states[e.entity] }))
      .filter((p) => p.state);

    const filtered = entities.filter((p) =>
      this._config.device_classes.includes(p.state.attributes.device_class)
    );

    return filtered.filter((p) => p.state.state === "on").length;
  }

  _handleTap() {
    const action = this._config.tap_action;
    if (!action || !this._hass || !this._config.entities || this._config.entities.length === 0) return;

    if (action === "more-info") {
      const first = this._config.entities[0].entity;
      const event = new Event("hass-more-info", {
        bubbles: true,
        composed: true,
      });
      event.detail = { entityId: first };
      this.dispatchEvent(event);
    } else if (action === "navigate" && this._config.tap_action_path) {
      history.pushState(null, "", this._config.tap_action_path);
      const navEvent = new Event("location-changed", {
        bubbles: true,
        composed: true,
      });
      navEvent.detail = { replace: false };
      window.dispatchEvent(navEvent);
    }
  }

  _getBatteryLevel(entity, cfg) {
    if (cfg.battery_entity) {
      const be = this._hass.states[cfg.battery_entity];
      if (be && be.state !== "unknown" && be.state !== "unavailable") {
        return parseInt(be.state);
      }
    }

    if (entity.attributes.battery_level !== undefined) {
      return parseInt(entity.attributes.battery_level);
    }
    if (entity.attributes.battery !== undefined) {
      return parseInt(entity.attributes.battery);
    }

    const baseName = entity.entity_id
      .replace("binary_sensor.", "")
      .replace("_contact", "")
      .replace("_door", "")
      .replace("_window", "");

    const candidates = [
      `sensor.${baseName}_battery`,
      `sensor.${baseName}_battery_level`,
      entity.entity_id.replace("binary_sensor.", "sensor.").replace("_contact", "_battery"),
      entity.entity_id.replace("binary_sensor.", "sensor.").replace("_door", "_battery"),
      entity.entity_id.replace("binary_sensor.", "sensor.").replace("_window", "_battery"),
    ];

    for (const id of candidates) {
      const be = this._hass.states[id];
      if (be && be.state !== "unknown" && be.state !== "unavailable") {
        const level = parseInt(be.state);
        if (!isNaN(level) && level >= 0 && level <= 100) return level;
      }
    }

    if (entity.attributes.device_id || entity.device_id) {
      const deviceId = entity.attributes.device_id || entity.device_id;
      for (const id in this._hass.states) {
        const e = this._hass.states[id];
        if (
          (e.attributes.device_id === deviceId || e.device_id === deviceId) &&
          id.includes("battery") &&
          !id.includes("battery_low")
        ) {
          if (e.state !== "unknown" && e.state !== "unavailable") {
            const level = parseInt(e.state);
            if (!isNaN(level) && level >= 0 && level <= 100) return level;
          }
        }
      }
    }

    const pattern = entity.entity_id.replace("binary_sensor.", "").split("_")[0];

    for (const id in this._hass.states) {
      if (
        id.startsWith("sensor.") &&
        id.includes(pattern) &&
        id.includes("battery") &&
        !id.includes("battery_low")
      ) {
        const e = this._hass.states[id];
        if (e.state !== "unknown" && e.state !== "unavailable") {
          const level = parseInt(e.state);
          if (!isNaN(level) && level >= 0 && level <= 100) return level;
        }
      }
    }

    return null;
  }

  _getBatteryIcon(level) {
    if (level === null) return null;
    if (level > 80) return { icon: "mdi:battery", color: "var(--success-color, #4caf50)" };
    if (level > 50) return { icon: "mdi:battery-60", color: "var(--success-color, #4caf50)" };
    if (level > 30) return { icon: "mdi:battery-50", color: "var(--warning-color, #ff9800)" };
    if (level > 15) return { icon: "mdi:battery-20", color: "var(--warning-color, #ff9800)" };
    return { icon: "mdi:battery-alert", color: "var(--error-color, #e53935)" };
  }

  _formatLastChanged(timestamp) {
    if (!timestamp) return "";
    const now = new Date();
    const changed = new Date(timestamp);
    const diffMs = now - changed;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return this.localize('card.time_now', 'Now');
    if (diffMins < 60) return `${diffMins}${this.localize('card.time_minutes_ago', 'm ago')}`;
    if (diffHours < 24) return `${diffHours}${this.localize('card.time_hours_ago', 'h ago')}`;
    if (diffDays === 1) return this.localize('card.time_yesterday', 'Yesterday');
    if (diffDays < 7) return `${diffDays}${this.localize('card.time_days_ago', 'd ago')}`;
    
    const locale = this._hass?.language || 'en';
    return changed.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  }

  _getEntityIcon(entity, cfg) {
    if (cfg.icon) return cfg.icon;
    const dc = entity.attributes.device_class;
    if (dc === "door") return "mdi:door";
    if (dc === "window") return "mdi:window-closed-variant";
    if (dc === "opening") return "mdi:rectangle-outline";
    return "mdi:square-rounded";
  }

  _getEntityIconColor(entity, cfg, isOpen) {
    if (cfg.icon_color) return cfg.icon_color;
    return isOpen ? "var(--error-color, #e53935)" : "var(--success-color, #4caf50)";
  }

  _getEntityName(entity, cfg) {
    if (cfg.name) return cfg.name;
    if (entity.attributes.friendly_name) return entity.attributes.friendly_name;
    return entity.entity_id;
  }

  _render() {
    const hass = this._hass;
    const config = this._config;
    if (!hass || !config) return;

    if (!config.entities || config.entities.length === 0) {
      this._renderEmpty();
      return;
    }

    const entities = config.entities
      .map((e) => ({ cfg: e, state: hass.states[e.entity] }))
      .filter((p) => p.state);

    const filtered = entities.filter((p) =>
      config.device_classes.includes(p.state.attributes.device_class)
    );

    const openEntities = filtered.filter((p) => p.state.state === "on");
    const closedEntities = filtered.filter((p) => p.state.state === "off");

    const openCount = openEntities.length;
    const allClosed = openCount === 0;
    const attention = openCount >= config.attention_threshold;
    
    const isColdOutside = this._isColdOutside();
    const currentTemp = this._getCurrentTemperature();
    const hasTemperatureAlert = openCount > 0 && isColdOutside;

    const card = document.createElement("ha-card");
    if (attention || hasTemperatureAlert) card.classList.add("attention");
    if (config.compact) card.classList.add("compact");
    if (hasTemperatureAlert) card.classList.add("temperature-alert");
    card.addEventListener("click", () => this._handleTap());

    const temperatureBannerText = `${this.localize('card.temperature_banner_prefix', '🌡️ Open with outside temperature:')} ${currentTemp}°C`;

    card.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          cursor: pointer;
          background: var(--ha-card-background, var(--card-background-color));
          color: var(--primary-text-color);
          transition: box-shadow 0.3s ease, transform 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        ha-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transform: translateY(-1px);
        }
        ha-card.attention {
          border: 1px solid var(--error-color, #e53935);
          box-shadow: 0 0 12px rgba(229,57,53,0.5);
        }
        ha-card.temperature-alert {
          border: 2px solid var(--warning-color, #ff9800);
          box-shadow: 0 0 20px rgba(255,152,0,0.7);
          animation: temperature-pulse 2s infinite;
        }
        @keyframes temperature-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,152,0,0.7); }
          50% { box-shadow: 0 0 30px rgba(255,152,0,1); }
        }
        ha-card.compact {
          padding: 8px 10px;
        }
        ha-card.compact .header { margin-bottom: 0; }
        ha-card.compact .main { margin-top: 2px; margin-bottom: 0; }
        ha-card.compact .count { font-size: 1.6rem; }
        ha-card.compact .subtitle { display: none; }
        ha-card.compact .list { display: none; }
        ha-card.compact .temperature-banner { display: none; }
        .temperature-banner {
          background: linear-gradient(90deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.2) 50%, rgba(255,152,0,0.1) 100%);
          padding: 8px 12px;
          margin: -16px -16px 12px -16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--warning-color, #ff9800);
          border-bottom: 1px solid var(--warning-color, #ff9800);
        }
        .temperature-banner ha-icon {
          --mdc-icon-size: 20px;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .title { font-size: 1rem; font-weight: 500; }
        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--secondary-background-color);
          position: relative;
        }
        .icon-wrapper.attention {
          background: rgba(229,57,53,0.1);
          animation: pulse 1.5s infinite;
        }
        .icon-wrapper.temperature-alert { background: rgba(255,152,0,0.2); }
        ha-icon { --mdc-icon-size: 24px; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(229,57,53,0.5); }
          70% { box-shadow: 0 0 0 10px rgba(229,57,53,0); }
          100% { box-shadow: 0 0 0 0 rgba(229,57,53,0); }
        }
        .main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: ${config.compact ? "0" : "8px"};
        }
        .count { font-size: 2rem; font-weight: 600; }
        .subtitle { font-size: 0.9rem; opacity: 0.7; }
        .list { margin-top: 8px; }
        .entity-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 0.9rem;
          border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.05));
        }
        .entity-row:last-child { border-bottom: none; }
        .entity-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        .entity-icon {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .entity-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          flex: 1;
        }
        .entity-name {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .entity-details {
          display: flex;
          gap: 10px;
          font-size: 0.75rem;
          opacity: 0.6;
          align-items: center;
          flex-wrap: wrap;
        }
        .battery-info {
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        }
        .battery-icon { --mdc-icon-size: 14px; }
        .entity-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .chip {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          background: rgba(0,0,0,0.05);
          white-space: nowrap;
        }
        .chip.open {
          background: rgba(229,57,53,0.15);
          color: var(--error-color, #e53935);
        }
        .chip.closed {
          background: rgba(76,175,80,0.15);
          color: var(--success-color, #4caf50);
        }
      </style>
      
      ${hasTemperatureAlert ? `
        <div class="temperature-banner">
          <ha-icon icon="mdi:thermometer-alert"></ha-icon>
          <span>${temperatureBannerText}</span>
        </div>
      ` : ''}
      
      <div class="header">
        <div class="title">${config.title}</div>
        <div class="icon-wrapper ${attention || hasTemperatureAlert ? "attention" : ""} ${hasTemperatureAlert ? "temperature-alert" : ""}">
          <ha-icon style="color: ${
            hasTemperatureAlert ? "var(--warning-color, #ff9800)" :
            allClosed ? "var(--success-color, var(--primary-color))" :
            "var(--error-color, #e53935)"
          }" icon="${
            hasTemperatureAlert ? "mdi:thermometer-alert" :
            allClosed ? "mdi:shield-check" : "mdi:door-open"
          }"></ha-icon>
        </div>
      </div>
      
      <div class="main">
        <div>
          <div class="count">${openCount}</div>
          <div class="subtitle">
            ${hasTemperatureAlert ? this.localize('card.temperature_alert', '⚠️ Frost protection') :
              allClosed ? this.localize('card.subtitle_all_closed', 'All closed') :
              openCount === 1 ? this.localize('card.subtitle_open_singular', '1 opening detected') :
              `${openCount} ${this.localize('card.subtitle_open_plural', 'openings detected')}`}
          </div>
        </div>
      </div>
      
      ${config.compact || !config.show_list ? "" : `
        <div class="list">
          ${openEntities.map((p) => {
            const isOpen = true;
            const icon = this._getEntityIcon(p.state, p.cfg);
            const iconColor = this._getEntityIconColor(p.state, p.cfg, isOpen);
            const name = this._getEntityName(p.state, p.cfg);
            const batteryLevel = config.show_battery ? this._getBatteryLevel(p.state, p.cfg) : null;
            const batteryInfo = batteryLevel !== null ? this._getBatteryIcon(batteryLevel) : null;
            const lastChanged = config.show_last_changed ? this._formatLastChanged(p.state.last_changed) : null;

            return `
            <div class="entity-row">
              <div class="entity-left">
                <div class="entity-icon">
                  <ha-icon icon="${icon}" style="color:${iconColor};"></ha-icon>
                </div>
                <div class="entity-info">
                  <div class="entity-name">${name}</div>
                  ${batteryInfo || lastChanged ? `
                    <div class="entity-details">
                      ${batteryInfo ? `
                        <div class="battery-info">
                          <ha-icon class="battery-icon" icon="${batteryInfo.icon}" style="color: ${batteryInfo.color};"></ha-icon>
                          <span>${batteryLevel}%</span>
                        </div>
                      ` : ""}
                      ${lastChanged ? `<span>${lastChanged}</span>` : ""}
                    </div>
                  ` : ""}
                </div>
              </div>
              <div class="entity-right">
                <div class="chip open">${this.localize('card.chip_open', 'Open')}</div>
              </div>
            </div>
          `}).join("")}
          ${config.show_closed ? closedEntities.map((p) => {
            const isOpen = false;
            const icon = this._getEntityIcon(p.state, p.cfg);
            const iconColor = this._getEntityIconColor(p.state, p.cfg, isOpen);
            const name = this._getEntityName(p.state, p.cfg);
            const batteryLevel = config.show_battery ? this._getBatteryLevel(p.state, p.cfg) : null;
            const batteryInfo = batteryLevel !== null ? this._getBatteryIcon(batteryLevel) : null;
            const lastChanged = config.show_last_changed ? this._formatLastChanged(p.state.last_changed) : null;

            return `
            <div class="entity-row">
              <div class="entity-left">
                <div class="entity-icon">
                  <ha-icon icon="${icon}" style="color:${iconColor};"></ha-icon>
                </div>
                <div class="entity-info">
                  <div class="entity-name">${name}</div>
                  ${batteryInfo || lastChanged ? `
                    <div class="entity-details">
                      ${batteryInfo ? `
                        <div class="battery-info">
                          <ha-icon class="battery-icon" icon="${batteryInfo.icon}" style="color: ${batteryInfo.color};"></ha-icon>
                          <span>${batteryLevel}%</span>
                        </div>
                      ` : ""}
                      ${lastChanged ? `<span>${lastChanged}</span>` : ""}
                    </div>
                  ` : ""}
                </div>
              </div>
              <div class="entity-right">
                <div class="chip closed">${this.localize('card.chip_closed', 'Closed')}</div>
              </div>
            </div>
          `}).join("") : ""}
        </div>
      `}
    `;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(card);
  }

  _renderEmpty() {
    const card = document.createElement("ha-card");
    card.innerHTML = `
      <style>
        ha-card {
          padding: 24px;
          text-align: center;
          background: var(--ha-card-background, var(--card-background-color));
          color: var(--primary-text-color);
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .empty-icon {
          width: 80px;
          height: 80px;
          background: var(--secondary-background-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        ha-icon {
          --mdc-icon-size: 48px;
          color: var(--disabled-text-color);
        }
        .empty-title {
          font-size: 1.2rem;
          font-weight: 500;
          margin: 0;
        }
        .empty-subtitle {
          font-size: 0.9rem;
          opacity: 0.7;
          margin: 0;
        }
      </style>
      <div class="empty-state">
        <div class="empty-icon">
          <ha-icon icon="mdi:window-open"></ha-icon>
        </div>
        <h3 class="empty-title">Window Guardian</h3>
        <p class="empty-subtitle">${this.localize('common.no_entities', 'Select entities to start')}</p>
      </div>
    `;
    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(card);
  }

  static hasAdvancedConfig(config) {
    if (!config.entities || !Array.isArray(config.entities)) return false;
    
    return config.entities.some(e => {
      if (typeof e === 'string') return false;
      return e.name || e.icon || e.icon_color || e.battery_entity;
    });
  }

  static getConfigElement() {
    return document.createElement("window-guardian-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:window-guardian-card",
      title: "Openings",
      entities: [],
      compact: false,
      show_list: true,
      show_battery: false,
      show_last_changed: false,
      show_closed: false,
      attention_threshold: 1,
      temperature_threshold: null,
      temperature_entity: null,
    };
  }
}

class WindowGuardianCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...WindowGuardianCard.getStubConfig(), ...config };
    this._hasAdvancedConfig = WindowGuardianCard.hasAdvancedConfig(config);
    
    if (this._rendered) {
      this._updateValues();
    } else if (this._hass) {
      this._render();
      this._rendered = true;
    }
  }

  set hass(hass) {
    this._hass = hass;
    
    if (this._config && !this._rendered) {
      this._render();
      this._rendered = true;
    }
  }

  _updateValues() {
    if (!this._hasAdvancedConfig) {
      const title = this.querySelector('#title');
      if (title && title.value !== this._config.title) {
        title.value = this._config.title || '';
      }

      const attentionThreshold = this.querySelector('#attention_threshold');
      if (attentionThreshold && attentionThreshold.value !== String(this._config.attention_threshold)) {
        attentionThreshold.value = this._config.attention_threshold || 1;
      }

      const tempThreshold = this.querySelector('#temperature_threshold');
      if (tempThreshold && tempThreshold.value !== String(this._config.temperature_threshold || '')) {
        tempThreshold.value = this._config.temperature_threshold || '';
      }
    }
  }

  _render() {
    if (!this._hass || !this._config) return;

    if (this._hasAdvancedConfig) {
      this._renderYamlNotice();
      return;
    }

    this.innerHTML = `
      <style>
        .card-config {
          padding: 16px 0;
        }
        ha-formfield {
          display: block;
          padding: 8px 0;
        }
        ha-textfield, ha-entity-picker {
          display: block;
          width: 100%;
          margin-top: 4px;
        }
        .label {
          display: block;
          font-weight: 500;
          margin-bottom: 4px;
          font-size: 14px;
        }
        .helper {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 4px;
        }
        .entity-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          align-items: center;
        }
      </style>
      <div class="card-config">
        <div style="padding: 8px 0;">
          <label class="label">Title</label>
          <ha-textfield
            id="title"
            .value="${this._config.title || ''}"
          ></ha-textfield>
        </div>

        <div style="padding: 8px 0;">
          <label class="label">Entities (binary_sensor)</label>
          <div id="entities-container"></div>
          <div class="helper">Door/window sensors to monitor</div>
        </div>

        <ha-formfield label="Compact mode">
          <ha-switch id="compact" .checked="${this._config.compact}"></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show openings list">
          <ha-switch id="show_list" .checked="${this._config.show_list}"></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show also closed">
          <ha-switch id="show_closed" .checked="${this._config.show_closed}"></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show battery level">
          <ha-switch id="show_battery" .checked="${this._config.show_battery}"></ha-switch>
        </ha-formfield>

        <ha-formfield label="Show last changed">
          <ha-switch id="show_last_changed" .checked="${this._config.show_last_changed}"></ha-switch>
        </ha-formfield>

        <div style="padding: 8px 0;">
          <label class="label">Attention threshold</label>
          <ha-textfield
            id="attention_threshold"
            type="number"
            min="1"
            .value="${this._config.attention_threshold || 1}"
          ></ha-textfield>
          <div class="helper">Number of openings to trigger alert</div>
        </div>

        <div style="padding: 8px 0;">
          <label class="label">Outside temperature sensor</label>
          <ha-entity-picker
            id="temperature_entity"
            .hass="${this._hass}"
            .value="${this._config.temperature_entity || ''}"
            .includeDomains="${['sensor']}"
            allow-custom-entity
          ></ha-entity-picker>
          <div class="helper">For frost protection</div>
        </div>

        <div style="padding: 8px 0;">
          <label class="label">Temperature threshold (°C)</label>
          <ha-textfield
            id="temperature_threshold"
            type="number"
            step="0.5"
            .value="${this._config.temperature_threshold || ''}"
          ></ha-textfield>
          <div class="helper">Alert if open below this temperature</div>
        </div>
      </div>
    `;

    this._renderEntities();
    this._attachListeners();
  }

  _renderEntities() {
    const container = this.querySelector('#entities-container');
    if (!container || !this._hass) return;

    const entities = this._config.entities || [];
    
    container.innerHTML = '';
    
    entities.forEach((entity, index) => {
      this._addEntityRow(container, entity, index);
    });
    
    const addButton = document.createElement('mwc-button');
    addButton.id = 'add-entity';
    addButton.style.marginTop = '8px';
    addButton.innerHTML = '<ha-icon icon="mdi:plus" slot="icon"></ha-icon>Add entity';
    
    addButton.addEventListener('click', () => {
      this._addNewEntity();
    });
    
    container.appendChild(addButton);
  }

  _addEntityRow(container, entity, index) {
    const entityId = typeof entity === 'string' ? entity : entity.entity;
    
    const row = document.createElement('div');
    row.className = 'entity-row';
    row.setAttribute('data-index', index);
    
    const picker = document.createElement('ha-entity-picker');
    picker.className = 'entity-picker';
    picker.setAttribute('data-index', index);
    picker.hass = this._hass;
    picker.value = entityId;
    picker.includeDomains = ['binary_sensor'];
    picker.setAttribute('allow-custom-entity', '');
    picker.style.flex = '1';
    
    picker.addEventListener('value-changed', (e) => {
      const idx = parseInt(e.target.dataset.index);
      const newEntities = [...(this._config.entities || [])];
      newEntities[idx] = e.detail.value;
      this._config = { ...this._config, entities: newEntities };
      this._configChanged();
    });
    
    const removeBtn = document.createElement('ha-icon-button');
    removeBtn.className = 'remove-entity';
    removeBtn.setAttribute('data-index', index);
    removeBtn.innerHTML = '<ha-icon icon="mdi:delete"></ha-icon>';
    
    removeBtn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.closest('.remove-entity').dataset.index);
      this._removeEntity(idx);
    });
    
    row.appendChild(picker);
    row.appendChild(removeBtn);
    
    const addButton = container.querySelector('#add-entity');
    if (addButton) {
      container.insertBefore(row, addButton);
    } else {
      container.appendChild(row);
    }
  }

  _addNewEntity() {
    const container = this.querySelector('#entities-container');
    if (!container) return;
    
    const newEntities = [...(this._config.entities || []), ''];
    this._config = { ...this._config, entities: newEntities };
    
    const newIndex = newEntities.length - 1;
    this._addEntityRow(container, '', newIndex);
    
    this._configChanged();
  }

  _removeEntity(index) {
    const container = this.querySelector('#entities-container');
    if (!container) return;
    
    const rows = container.querySelectorAll('.entity-row');
    if (rows[index]) {
      rows[index].remove();
    }
    
    const newEntities = [...(this._config.entities || [])];
    newEntities.splice(index, 1);
    this._config = { ...this._config, entities: newEntities };
    
    const remainingRows = container.querySelectorAll('.entity-row');
    remainingRows.forEach((row, idx) => {
      row.setAttribute('data-index', idx);
      const picker = row.querySelector('.entity-picker');
      const removeBtn = row.querySelector('.remove-entity');
      if (picker) picker.setAttribute('data-index', idx);
      if (removeBtn) removeBtn.setAttribute('data-index', idx);
    });
    
    this._configChanged();
  }

  _renderYamlNotice() {
    this.innerHTML = `
      <style>
        .notice {
          padding: 16px;
          background: var(--secondary-background-color);
          border-radius: 8px;
          border-left: 4px solid var(--info-color);
        }
        .notice-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .notice-text {
          font-size: 14px;
          opacity: 0.8;
          line-height: 1.5;
        }
      </style>
      <div class="notice">
        <div class="notice-title">
          <ha-icon icon="mdi:information-outline"></ha-icon>
          Visual editor not supported
        </div>
        <div class="notice-text">
          The visual editor is not available for this configuration.
          You can still edit using YAML mode.
        </div>
      </div>
    `;
  }

  _attachListeners() {
    const title = this.querySelector('#title');
    if (title) {
      title.addEventListener('blur', (e) => {
        if (this._config.title !== e.target.value) {
          this._config = { ...this._config, title: e.target.value };
          this._configChanged();
        }
      });
    }

    const compact = this.querySelector('#compact');
    if (compact) {
      compact.addEventListener('change', (e) => {
        this._config = { ...this._config, compact: e.target.checked };
        this._configChanged();
      });
    }

    const showList = this.querySelector('#show_list');
    if (showList) {
      showList.addEventListener('change', (e) => {
        this._config = { ...this._config, show_list: e.target.checked };
        this._configChanged();
      });
    }

    const showClosed = this.querySelector('#show_closed');
    if (showClosed) {
      showClosed.addEventListener('change', (e) => {
        this._config = { ...this._config, show_closed: e.target.checked };
        this._configChanged();
      });
    }

    const showBattery = this.querySelector('#show_battery');
    if (showBattery) {
      showBattery.addEventListener('change', (e) => {
        this._config = { ...this._config, show_battery: e.target.checked };
        this._configChanged();
      });
    }

    const showLastChanged = this.querySelector('#show_last_changed');
    if (showLastChanged) {
      showLastChanged.addEventListener('change', (e) => {
        this._config = { ...this._config, show_last_changed: e.target.checked };
        this._configChanged();
      });
    }

    const attentionThreshold = this.querySelector('#attention_threshold');
    if (attentionThreshold) {
      attentionThreshold.addEventListener('blur', (e) => {
        const value = parseInt(e.target.value) || 1;
        if (this._config.attention_threshold !== value) {
          this._config = { ...this._config, attention_threshold: value };
          this._configChanged();
        }
      });
    }

    const tempEntity = this.querySelector('#temperature_entity');
    if (tempEntity) {
      tempEntity.hass = this._hass;
      tempEntity.addEventListener('value-changed', (e) => {
        this._config = { ...this._config, temperature_entity: e.detail.value || null };
        this._configChanged();
      });
    }

    const tempThreshold = this.querySelector('#temperature_threshold');
    if (tempThreshold) {
      tempThreshold.addEventListener('blur', (e) => {
        const value = e.target.value ? parseFloat(e.target.value) : null;
        if (this._config.temperature_threshold !== value) {
          this._config = { ...this._config, temperature_threshold: value };
          this._configChanged();
        }
      });
    }
  }

  _configChanged() {
    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

customElements.define("window-guardian-card", WindowGuardianCard);
customElements.define("window-guardian-card-editor", WindowGuardianCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "window-guardian-card",
  name: "Window Guardian Card",
  description: "Monitor doors and windows with frost protection",
  preview: true,
  documentationURL: "https://github.com/MattiaSaiko/lovelace-window-guardian-card"
});
