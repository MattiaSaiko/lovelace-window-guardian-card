# Window Guardian Card 🛡️🇮🇹
Una card Lovelace per Home Assistant che mostra quante porte/finestre sono aperte e, opzionalmente, l’elenco dettagliato di quali sensori sono aperti/chiusi.   Pensata per utilizzare solo componenti nativi (`ha-card`, `ha-icon`) e integrarsi con i temi light/dark di Home Assistant.
<img width="1001" height="614" alt="Screenshot 2026-01-08 alle 16 00 00" src="https://github.com/user-attachments/assets/33efc885-4447-4f82-9140-22a9d2ef9bb8" />
<img width="1001" height="614" alt="Screenshot 2026-01-08 alle 16 00 26" src="https://github.com/user-attachments/assets/d7d3a010-1b5d-4b94-817d-b8a57cfde534" />
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

