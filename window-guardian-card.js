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
    if (attention) {
      card.classList.add("attention");
    }
    if (config.compact) {
      card.classList.add("compact");
    }
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

        /* Modalità compact */
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
          color: ${allClosed
            ? "var(--success-color, var(--primary-color))"
            : "var(--error-color, #e53935)"};
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
          padding: 4px 0;
          font-size: 0.9rem;
        }
        .entity-name {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chip {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.8rem;
          background: rgba(0,0,0,0.05);
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
          <ha-icon icon="${allClosed ? "mdi:shield-check" : "mdi:door-open"}"></ha-icon>
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
      ${config.compact || !config.show_list ? "" : `
        <div class="list">
          ${openEntities
            .map(
              (p) => `
            <div class="entity-row">
              <div class="entity-name">
                <ha-icon icon="${this._getIconFor(p.state)}"></ha-icon>
                <span>${p.cfg.name || p.state.attributes.friendly_name || p.state.entity_id}</span>
              </div>
              <div class="chip open">Aperto</div>
            </div>
          `
            )
            .join("")}
          ${
            config.show_closed
              ? closedEntities
                  .map(
                    (p) => `
            <div class="entity-row">
              <div class="entity-name">
                <ha-icon icon="${this._getIconFor(p.state)}"></ha-icon>
                <span>${p.cfg.name || p.state.attributes.friendly_name || p.state.entity_id}</span>
              </div>
              <div class="chip closed">Chiuso</div>
            </div>
          `
                  )
                  .join("")
              : ""
          }
        </div>
      `}
    `;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(card);
  }

  _getIconFor(entity) {
    const dc = entity.attributes.device_class;
    if (dc === "door") return "mdi:door";
    if (dc === "window") return "mdi:window-closed-variant";
    if (dc === "opening") return "mdi:rectangle-outline";
    return "mdi:square-rounded";
  }

  static getConfigForm() {
    const SCHEMA = [
      {
        name: "title",
        selector: { text: {} },
      },
      {
        name: "entities",
        required: true,
        selector: {
          entity: {
            domain: "binary_sensor",
            multiple: true,
          },
        },
      },
      {
        name: "compact",
        selector: { boolean: {} },
      },
      {
        name: "show_list",
        selector: { boolean: {} },
      },
      {
        name: "show_closed",
        selector: { boolean: {} },
      },
      {
        name: "attention_threshold",
        selector: { number: { min: 1, max: 10 } },
      },
    ];

    const assertConfig = (config) => {
      if (!config.entities) {
        throw new Error('Devi definire almeno una entità in "entities"');
      }
    };

    const computeLabel = (schema, _localize) => {
      const labels = {
        title: "Title",
        entities: "Entities",
        compact: "Compact mode",
        show_list: "Show list",
        show_closed: "Show closed entities",
        attention_threshold: "Attention threshold",
      };
      return labels[schema.name] || schema.name;
    };

    return {
      schema: SCHEMA,
      assertConfig,
      computeLabel,
    };
  }

  static getStubConfig() {
    return {
      title: "Aperture",
      entities: ["binary_sensor.finestra_soggiorno"],
      compact: false,
      show_list: true,
    };
  }
}

customElements.define("window-guardian-card", WindowGuardianCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "window-guardian-card",
  name: "Window Guardian Card",
  description: "Mostra quante porte/finestre sono aperte e quali.",
});
