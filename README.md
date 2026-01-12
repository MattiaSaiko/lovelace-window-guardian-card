<img width="1536" height="1024" alt="card" src="https://github.com/user-attachments/assets/260c77f7-ca12-444a-b97c-75b191256bce" />

# Window Guardian Card 🛡️🇮🇹
Una card Lovelace per Home Assistant che mostra quante porte/finestre sono aperte e, opzionalmente, l’elenco dettagliato di quali sensori sono aperti/chiusi.   Pensata per utilizzare solo componenti nativi (`ha-card`, `ha-icon`) e integrarsi con i temi light/dark di Home Assistant.

### Requisiti
- Home Assistant 2024.8.0 o superiore.  
- HACS installato per una gestione semplice degli aggiornamenti (opzionale ma raccomandato).  
- Dashboard Lovelace.

### Installazione tramite HACS (repository custom)
1. Apri **HACS** in Home Assistant.  
2. Vai su **Impostazioni HACS → Custom repositories**.  
3. Aggiungi il repository:
   - URL: `https://github.com/MattiaSaiko/lovelace-window-guardian-card`  
   - Tipo: `Frontend`
4. Salva.  
5. Torna alla sezione **Frontend** di HACS, cerca **Window Guardian Card** e clicca su **Installa**.  
6. Conferma l’installazione e riavvia l’interfaccia se richiesto.
> HACS registra automaticamente la risorsa come modulo JS. In caso contrario, vedi la sezione “Registrazione risorsa manuale”.

### Installazione manuale
1. Scarica il file `window-guardian-card.js` dall’ultima release del repository.  
2. Copialo in:
   ```text
   config/www/community/lovelace-window-guardian-card/window-guardian-card.js
   ```
3.	Riavvia Home Assistant.

### Aggiungere la card alla dashboard
1.	Vai sulla dashboard desiderata.
2.	Clicca su Modifica dashboard → Aggiungi scheda.
3.	Cerca “Custom: Window Guardian Card”.
4.	Compila i campi dell’editor visuale (o passa all’editor YAML) e salva.

# Configurazione YAML
La card supporta sia una configurazione semplice sia una configurazione personalizzata in modo da rinominare ogni entità.

## 📝 Configurazione

### Parametri Card Principali

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `type` | string | Tipo della card: `custom:window-guardian-card` |
| `title` | string | Titolo visualizzato nella card |
| `entities` | list | Lista di entità da monitorare (vedi configurazione sotto) |
| `compact` | boolean | Modalità visualizzazione compatta |
| `show_list` | boolean | Mostra lista dettagliata aperture |
| `show_closed` | boolean | Mostra anche sensori chiusi |
| `show_battery` | boolean | Mostra livello batteria sensori |
| `show_last_changed` | boolean | Mostra timestamp ultimo cambio stato |
| `attention_threshold` | number | Numero aperture per attivare alert visivo |
| `device_classes` | list | Classi dispositivi da filtrare: `door`, `window`, `opening` |
| `tap_action` | string | Azione al tap sulla card: `more-info` o `navigate` |
| `tap_action_path` | string | Path di navigazione (richiesto se `tap_action` è `navigate`) |
| `temperature_entity` | string | Sensore temperatura esterna per protezione antigelo |
| `temperature_threshold` | number | Soglia temperatura (°C) per attivare alert antigelo |

### Configurazione Entità

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `entity` | string | ID dell'entità da monitorare |
| `name` | string | Nome personalizzato da visualizzare |
| `icon` | string | Icona MDI personalizzata |
| `icon_color` | string | Colore icona (hex o nome CSS) |
| `battery_entity` | string | Sensore batteria specifico per entità |

# Window Guardian Card 🛡️🇬🇧
A Lovelace card for Home Assistant that displays how many doors/windows are open and, optionally, a detailed list of open/closed sensors. Designed to employ only native (`ha-card`, `ha-icon`) components and integrate with Home Assistant’s light/dark themes.

### Requirements
- Home Assistant 2024.8.0 or higher.  
- HACS installed for easy update management (optional but recommended).
- Dashboard Lovelace.

### Installation via HACS (custom repository)
1. Open **HACS** in Home Assistant.  
2. Go to **HACS Settings → Custom repositories**.  
3. Add the repository:
   - URL: `https://github.com/MattiaSaiko/lovelace-window-guardian-card`  
   - Type: `Frontend`
4. Save.  
5. Go back to the **Frontend** section in HACS, search for **Window Guardian Card** and click **Install**.  
6. Confirm the installation and restart the interface if requested.
>HACS automatically registers the resource as a JS module. If not, see the “Manual resource registration” section.

### Manual installation
1. Download the `window-guardian-card.js` file from the latest release of the repository.  
2. Copy it to:
   ```text
   config/www/community/lovelace-window-guardian-card/window-guardian-card.js
   ```
3.	Restart Home Assistant.

### Adding the card to the dashboard
1.	Go to the desired dashboard.
2.	Click Edit dashboard → Add card.
3.	Search for “Custom: Window Guardian Card”.
4.	Fill in the fields in the visual editor (or switch to the YAML editor) and save.

# YAML configuration
The card supports both a simple configuration and a customised configuration so that each entity can be renamed.

## 📝 Configuration

### Main card parameters.

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Card type: `custom:window-guardian-card` |
| `title` | string | Title displayed in the card |
| `entities` | list | List of entities to monitor (see configuration below) |
| `compact` | boolean | Compact display mode |
| `show_list` | boolean | Display detailed list of openings |
| `show_closed` | boolean | Also display closed sensors |
| `show_battery` | boolean | Display battery level sensors |
| `show_last_changed` | boolean | Display timestamp of last status change |
| `attention_threshold` | number | Number of openings required to trigger the visual alert |
| `device_classes` | list | Device classes to filter: `door`, `window`, `opening` |
| `tap_action` | string | Action on card tap: `more-info` o `navigate` |
| `tap_action_path` | string | Navigation path (required if `tap_action` è `navigate`) |
| `temperature_entity` | string | Outdoor temperature sensor for frost protection |
| `temperature_threshold` | number | Temperature threshold (°C) to trigger frost alert |

### Entity Configuration

| Parameter | Type | Description |
|-----------|------|-------------|
| `entity` | string | ID of the entity to be monitored |
| `name` | string | Custom name to display |
| `icon` | string | Custom MDI icon |
| `icon_color` | string | Icon colour (hex or CSS name) |
| `battery_entity` | string | Battery sensor specific to the entity |

## ☕ Support

If you enjoy using Window Guardian Card and want to support its development, you can:

<div align="center">

### Donate via PayPal 💙

[![PayPal](https://img.shields.io/badge/Donate-PayPal-00457C.svg?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/Saikoadv)

</div>

Your support helps me dedicate more time to improving this card and creating new features for the Home Assistant community. 

Thank you! 🙏
