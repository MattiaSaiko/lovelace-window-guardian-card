class WindowGuardianCard extends HTMLElement {
  setConfig(config) {
    let entities = config.entities || [];
    if (!Array.isArray(entities)) {
      entities = [entities];
    }
    if (entities.length === 0) {
      throw new Error("Devi definire almeno una entità in 'entities'");
    }

    this._config = {
      title: config.title ?? "Aperture",
      show_closed: config.show_closed ?? false,
      compact: config.compact ?? false,
      attention_threshold: config.attention_threshold ?? 1,
      show_list: config.show_list ?? true,
      show_battery: config.show_battery ?? false,
      show_last_changed: config.show_last_changed ?? false,
      device_classes: config.device_classes ?? ["door", "window", "opening"],
      tap_action: config.tap_action ?? "more-info",
      hold_action: config.hold_action ?? null,
      hold_action_path: config.hold_action_path ?? null,
      ...config,
      entities,
    };

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    this._render();
  }

  getCardSize() {
    return this._config.compact ? 1 : 4;
  }

  _handleTap() {
    const action = this._config.tap_action;
    if (!action || !this._hass) return;

    if (action === "more-info") {
      const first =
        typeof this._config.entities[0] === "string"
          ? this._config.entities[0]
          : this._config.entities[0].entity;
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
      entity.entity_id
        .replace("binary_sensor.", "sensor.")
        .replace("_contact", "_battery"),
      entity.entity_id
        .replace("binary_sensor.", "sensor.")
        .replace("_door", "_battery"),
      entity.entity_id
        .replace("binary_sensor.", "sensor.")
        .replace("_window", "_battery"),
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

    const pattern = entity.entity_id
      .replace("binary_sensor.", "")
      .split("_")[0];

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
    if (level > 80)
      return { icon: "mdi:battery", color: "var(--success-color, #4caf50)" };
    if (level > 50)
      return {
        icon: "mdi:battery-60",
        color: "var(--success-color, #4caf50)",
      };
    if (level > 30)
      return {
        icon: "mdi:battery-50",
        color: "var(--warning-color, #ff9800)",
      };
    if (level > 15)
      return {
        icon: "mdi:battery-20",
        color: "var(--warning-color, #ff9800)",
      };
    return {
      icon: "mdi:battery-alert",
      color: "var(--error-color, #e53935)",
    };
  }

  _formatLastChanged(timestamp) {
    if (!timestamp) return "";
    const now = new Date();
    const changed = new Date(timestamp);
    const diffMs = now - changed;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ora";
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays === 1) return "Ieri";
    if (diffDays < 7) return `${diffDays}gg fa`;
    return changed.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  _getEntityIcon(entity, cfg) {
    if (cfg.icon) return cfg.icon;
    const dc = entity.attributes.device_class;
    if (dc === "door") return "mdi:door";
    if (dc === "window") return "mdi:window-closed-variant";
    if (dc === "opening") return "mdi:rectangle-outline";
    return "mdi:square-rounded";
  }

  _getEntityIconColor(entity, cfg, defaultColor) {
    if (cfg.icon_color) return cfg.icon_color;
    return defaultColor;
  }

  _render() {
    const hass = this._hass;
    const config = this._config;
    if (!hass || !config) return;

    const entityConfigs = config.entities.map((item) =>
      typeof item === "string" ? { entity: item } : item
    );

    const entities = entityConfigs
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

    const card = document.createElement("ha-card");
    if (attention) card.classList.add("attention");
    if (config.compact) card.classList.add("compact");
    card.addEventListener("click", () => this._handleTap());

    card.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          cursor: pointer;
          background: var(--ha-card-background, var(--card-background-color));
          color: var(--primary-text-color);
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        ha-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transform: translateY(-1px);
        }
        ha-card.attention {
          border: 1px solid var(--error-color, #e53935);
          box-shadow: 0 0 12px rgba(229,57,53,0.5);
        }
        ha-card.compact {
          padding: 8px 10px;
        }
        ha-card.compact .header {
          margin-bottom: 0;
        }
        ha-card.compact .main {
          margin-top: 2px;
          margin-bottom: 0;
        }
        ha-card.compact .count {
          font-size: 1.6rem;
        }
        ha-card.compact .subtitle {
          display: none;
        }
        ha-card.compact .list {
          display: none;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .title {
          font-size: 1rem;
          font-weight: 500;
        }
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
        ha-icon {
          --mdc-icon-size: 24px;
        }
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
        .count {
          font-size: 2rem;
          font-weight: 600;
        }
        .subtitle {
          font-size: 0.9rem;
          opacity: 0.7;
        }
        .list {
          margin-top: 8px;
        }
        .entity-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 0.9rem;
          border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.05));
        }
        .entity-row:last-child {
          border-bottom: none;
        }
        .entity-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .entity-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .entity-name {
          font-weight: 500;
        }
        .entity-details {
          display: flex;
          gap: 8px;
          font-size: 0.75rem;
          opacity: 0.6;
          align-items: center;
        }
        .battery-info {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .battery-icon {
          --mdc-icon-size: 14px;
        }
        .entity-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chip {
          padding: 3px 10px;
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
      <div class="header">
        <div class="title">${config.title}</div>
        <div class="icon-wrapper ${attention ? "attention" : ""}">
          <ha-icon style="color: ${
            allClosed
              ? "var(--success-color, var(--primary-color))"
              : "var(--error-color, #e53935)"
          }" icon="${allClosed ? "mdi:shield-check" : "mdi:door-open"}"></ha-icon>
        </div>
      </div>
      <div class="main">
        <div>
          <div class="count">${openCount}</div>
          <div class="subtitle">
            ${
              allClosed
                ? "Tutte chiuse"
                : openCount === 1
                ? "1 apertura rilevata"
                : `${openCount} aperture rilevate`
            }
          </div>
        </div>
      </div>
      ${
        config.compact || !config.show_list
          ? ""
          : `
        <div class="list">
          ${openEntities
            .map((p) => {
              const icon = this._getEntityIcon(p.state, p.cfg);
              const iconColor = this._getEntityIconColor(
                p.state,
                p.cfg,
                "var(--error-color, #e53935)"
              );
              const batteryLevel = config.show_battery
                ? this._getBatteryLevel(p.state, p.cfg)
                : null;
              const batteryInfo =
                batteryLevel !== null
                  ? this._getBatteryIcon(batteryLevel)
                  : null;
              const lastChanged = config.show_last_changed
                ? this._formatLastChanged(p.state.last_changed)
                : null;

              return `
            <div class="entity-row">
              <div class="entity-left">
                <ha-icon icon="${icon}" style="color:${iconColor};"></ha-icon>
                <div class="entity-info">
                  <div class="entity-name">${
                    p.cfg.name ||
                    p.state.attributes.friendly_name ||
                    p.state.entity_id
                  }</div>
                  ${
                    batteryInfo || lastChanged
                      ? `
                    <div class="entity-details">
                      ${
                        batteryInfo
                          ? `
                        <div class="battery-info">
                          <ha-icon class="battery-icon" icon="${batteryInfo.icon}" style="color: ${batteryInfo.color};"></ha-icon>
                          <span>${batteryLevel}%</span>
                        </div>
                      `
                          : ""
                      }
                      ${lastChanged ? `<span>${lastChanged}</span>` : ""}
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>
              <div class="entity-right">
                <div class="chip open">Aperto</div>
              </div>
            </div>
          `;
            })
            .join("")}
          ${
            config.show_closed
              ? closedEntities
                  .map((p) => {
                    const icon = this._getEntityIcon(p.state, p.cfg);
                    const iconColor = this._getEntityIconColor(
                      p.state,
                      p.cfg,
                      "var(--success-color, #4caf50)"
                    );
                    const batteryLevel = config.show_battery
                      ? this._getBatteryLevel(p.state, p.cfg)
                      : null;
                    const batteryInfo =
                      batteryLevel !== null
                        ? this._getBatteryIcon(batteryLevel)
                        : null;
                    const lastChanged = config.show_last_changed
                      ? this._formatLastChanged(p.state.last_changed)
                      : null;

                    return `
            <div class="entity-row">
              <div class="entity-left">
                <ha-icon icon="${icon}" style="color:${iconColor};"></ha-icon>
                <div class="entity-info">
                  <div class="entity-name">${
                    p.cfg.name ||
                    p.state.attributes.friendly_name ||
                    p.state.entity_id
                  }</div>
                  ${
                    batteryInfo || lastChanged
                      ? `
                    <div class="entity-details">
                      ${
                        batteryInfo
                          ? `
                        <div class="battery-info">
                          <ha-icon class="battery-icon" icon="${batteryInfo.icon}" style="color: ${batteryInfo.color};"></ha-icon>
                          <span>${batteryLevel}%</span>
                        </div>
                      `
                          : ""
                      }
                      ${lastChanged ? `<span>${lastChanged}</span>` : ""}
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>
              <div class="entity-right">
                <div class="chip closed">Chiuso</div>
              </div>
            </div>
          `;
                  })
                  .join("")
              : ""
          }
        </div>
      `
      }
    `;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(card);
  }

  static getConfigForm() {
    const SCHEMA = [
      { name: "title", selector: { text: {} } },
      {
        name: "entities",
        required: true,
        selector: { entity: { domain: "binary_sensor", multiple: true } },
      },
      { name: "compact", selector: { boolean: {} } },
      { name: "show_list", selector: { boolean: {} } },
      { name: "show_closed", selector: { boolean: {} } },
      { name: "show_battery", selector: { boolean: {} } },
      { name: "show_last_changed", selector: { boolean: {} } },
      { name: "attention_threshold", selector: { number: { min: 1, max: 10 } } },
    ];

    const assertConfig = (config) => {
      if (!config.entities) {
        throw new Error('Devi definire almeno una entità in "entities"');
      }
    };

    const computeLabel = (schema) => {
      const labels = {
        title: "Title",
        entities: "Entities",
        compact: "Compact mode",
        show_list: "Show list",
        show_closed: "Show closed entities",
        show_battery: "Show battery level",
        show_last_changed: "Show last changed",
        attention_threshold: "Attention threshold",
      };
      return labels[schema.name] || schema.name;
    };

    return { schema: SCHEMA, assertConfig, computeLabel };
  }

  static getStubConfig() {
    return {
      title: "Aperture",
      entities: ["binary_sensor.finestra_soggiorno"],
      compact: false,
      show_list: true,
      show_battery: false,
      show_last_changed: false,
    };
  }
}

customElements.define("window-guardian-card", WindowGuardianCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "window-guardian-card",
  name: "Window Guardian Card",
  description:
    "Mostra quante porte/finestre sono aperte, quali, batteria e ultimo cambio, con icone personalizzabili.",
});
