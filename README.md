# Window Guardian Card 🛡️🇮🇹
Una card Lovelace per Home Assistant che mostra quante porte/finestre sono aperte e, opzionalmente, l’elenco dettagliato di quali sensori sono aperti/chiusi.   Pensata per utilizzare solo componenti nativi (`ha-card`, `ha-icon`) e integrarsi con i temi light/dark di Home Assistant.
<img width="1013" height="438" alt="Screenshot 2" src="https://github.com/user-attachments/assets/32a28379-a3bc-47bf-8057-1ba13336004b" />
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
    icon: mdi:window-open-variant
    color: red
  - entity: binary_sensor.finestra_bagno
    name: Bagno
    icon: mdi:window-open-variant
    color: '#ff9800'
  - entity: binary_sensor.porta_ingresso
    name: Porta
compact: false             # true = versione compatta/minimale
show_list: true            # mostra l'elenco dei sensori
show_closed: false         # mostra solo quelli aperti
show_battery: false        # mostra il livello della batteria dei sensori
show_last_changed: false   # mostra quando il sensore ha cambiato stato l'ultima volta.
attention_threshold: 1     # da quante aperture scatta la grafica di “attenzione”
device_classes:
  - door
  - window
  - opening
tap_action: more-info      # azione al click sulla card (es. more-info)
hold_action: navigate      # azione al long-press (opzionale)
hold_action_path: /lovelace/security
```
