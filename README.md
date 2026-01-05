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
### Configurazione Semplice
```text
type: custom:window-guardian-card
title: Aperture
entities:
  - binary_sensor.finestra_soggiorno
  - binary_sensor.porta_ingresso
  - binary_sensor.finestra_camera

```
### Configurazione Personalizzata
```text
type: custom:window-guardian-card
title: Stato aperture
entities:
  - entity: binary_sensor.finestra_camera
    name: Camera
  - entity: binary_sensor.finestra_bagno
    name: Bagno
  - entity: binary_sensor.porta_ingresso
    name: Porta
compact: false          # true = versione compatta/minimale
show_list: true         # mostra l'elenco dei sensori
show_closed: false      # mostra solo quelli aperti
attention_threshold: 1  # da quante aperture scatta la grafica di “attenzione”
device_classes:
  - door
  - window
  - opening
tap_action: more-info   # azione al click sulla card (es. more-info)
hold_action: navigate   # azione al long-press (opzionale)
hold_action_path: /lovelace/security
```










# Window Guardian Card 🛡️🇬🇧
A Lovelace card for Home Assistant that shows how many doors/windows are open and, optionally, the detailed list of which sensors are open/closed.
Designed to use only native components (`ha-card`, `ha-icon`) and to integrate with Home Assistant light/dark themes.
### Requirements
- Home Assistant 2024.8.0 or higher. 
- HACS installed for easy update management (optional but recommended).
- Dashboard Lovelace.
### Installation via HACS (custom repository)
1. Open **HACS** in Home Assistant.
2. Go to **Impostazioni HACS → Custom repositories**.  
3. Add the repository:
   - URL: `https://github.com/MattiaSaiko/lovelace-window-guardian-card`  
   - Type: `Frontend`
4. Save.  
5. Go back to the **Frontend** section in HACS, search for **Window Guardian Card** and click **Install**. 
6. Confirm the installation and restart the UI if requested.
> HACS automatically registers the resource as a JS module. If it does not, see the “Manual resource registration” section in the main README.
### Manual installation
1. Download the `window-guardian-card.js` file from the latest release of the repository.
2. Copy to:
   ```text
   config/www/community/lovelace-window-guardian-card/window-guardian-card.js
   ```
3.	Restart Home Assistant.
### Add card to a dashboard
1.	Go to the desired dashboard.
2.	Click on Edit dashboard → Add card.
3.	Look for “Custom: Window Guardian Card”.
4.	Fill in the visual editor fields (or switch to the YAML editor) and save.
# Configuration YAML
The card supports both a simple configuration and an advanced one where each entity can have a custom display name.
### Simple Configuration
```text
type: custom:window-guardian-card
title: Openings
entities:
  - binary_sensor.window_livingroom
  - binary_sensor.door_entrance
  - binary_sensor.window_room

```
### Advanced configuration
```text
type: custom:window-guardian-card
title: Openings
entities:
  - entity: binary_sensor.window_livingroom
    name: Living Room
  - entity: binary_sensor.door_entrance
    name: Entrance Door
  - entity: binary_sensor.window_room
    name: Room
compact: false          # true = compact / minimal version
show_list: true         # show the list of sensors
show_closed: false      # show only open ones
attention_threshold: 1  # how many openings trigger the “attention” style
device_classes:
  - door
  - window
  - opening
tap_action: more-info   # action on card tap (e.g. more-info)
hold_action: navigate   # action on long-press (optional)
hold_action_path: /lovelace/security
```

