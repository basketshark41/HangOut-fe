# HangOut - Social Events Web App

Una web app sociale dove gli utenti possono creare eventi (uscite), partecipare, gestire amicizie e chattare privatamente.

## Funzionalità Principali

### ✅ Implementate
- **Dashboard/Home**: Overview degli eventi e attività
- **Gestione Eventi**: 
  - Lista eventi con filtri avanzati (data, tipo, località, costo, solo amici)
  - Dettaglio evento con gestione partecipazione
  - Partecipazione, conferma, rifiuto eventi
- **Gestione Amici**: 
  - Lista amici con stato online/offline
  - Gestione richieste di amicizia (in arrivo/inviate)
  - Accettare/rifiutare/bloccare utenti
- **Chat/Messaggi**: 
  - Lista conversazioni con preview
  - Messaggi non letti
- **Navigazione**: 
  - Navbar responsive con notifiche
  - Menu mobile
  - Routing configurato

### 🚧 Da Implementare
- **Creazione/Modifica Eventi**
- **Ricerca Amici** 
- **Chat Dettaglio** (conversazione singola)
- **Centro Notifiche**
- **Profilo Utente**
- **Impostazioni**

## Struttura del Progetto

```
src/app/
├── api/
│   └── client.ts                 # Client API generato
├── components/
│   └── navigation/
│       └── navbar/              # Barra di navigazione
├── pages/
│   ├── home/                    # Dashboard principale
│   ├── events/
│   │   ├── events-list/         # Lista eventi
│   │   └── event-detail/        # Dettaglio evento
│   ├── friends/
│   │   └── friends-list/        # Gestione amici
│   └── chat/
│       └── conversations-list/  # Lista conversazioni
├── services/                    # Servizi (da implementare)
├── app.routes.ts               # Configurazione routing
└── styles.css                 # Stili globali
```

## Tecnologie Utilizzate

- **Angular 18+** (Standalone Components)
- **TypeScript**
- **Responsive CSS** (Mobile-first)
- **HTTP Client** per chiamate API
- **Routing** con lazy loading

## API Integration

Il progetto è configurato per utilizzare un client API generato (`src/app/api/client.ts`) che fornisce:

- **Conversazioni**: CRUD, partecipanti, messaggi
- **Eventi**: CRUD, filtri, partecipazione, tipi evento
- **Amicizie**: richieste, gestione, status
- **Messaggi**: CRUD, ricerca, lettura
- **Notifiche**: gestione, summary, tipi
- **Utenti**: profili, ricerca, impostazioni

## Installazione e Avvio

### Prerequisiti
- Node.js 18+
- npm o yarn

### Installazione
```bash
# Clona il repository
git clone <url-repository>
cd HangOut-fe

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm start
```

L'applicazione sarà disponibile su `http://localhost:4200`

### Build per Produzione
```bash
npm run build
```

## Configurazione API

⚠️ **Importante**: Aggiorna la configurazione dell'API base URL nel file `src/app/api/client.ts` o configura tramite dependency injection.

```typescript
// Esempio configurazione base URL
const API_BASE_URL = 'https://your-api-url.com';
```

## Design e UX

### Caratteristiche del Design
- **Responsive**: Mobile-first approach
- **Modern UI**: Card-based layout, shadows, rounded corners
- **Color Scheme**: 
  - Primary: #007bff (Blue)
  - Success: #28a745 (Green)
  - Danger: #dc3545 (Red)
  - Background: #f8f9fa (Light Gray)
- **Typography**: System fonts stack
- **Icons**: Emoji placeholders (sostituire con icon font)

### Componenti UI
- **Buttons**: Primary, Secondary, Success, Danger, Outline
- **Forms**: Input, Textarea, Select con validazione
- **Cards**: Header, Body, Footer
- **Modals**: Overlay con backdrop
- **Dropdown**: Hover/click interactions
- **Navigation**: Fixed navbar con mobile menu

## Autenticazione

🔧 **Da Implementare**: Il sistema attualmente usa un `currentUserId` hardcoded. Implementare:
- Servizio di autenticazione
- Login/Logout
- Guard per route protette
- Token management

## Prossimi Step

1. **Implementare componenti mancanti**:
   - Creazione/modifica eventi
   - Chat dettaglio
   - Ricerca amici
   - Profilo utente

2. **Servizi**:
   - Servizio di autenticazione
   - Servizi per gestire le chiamate API
   - State management (opzionale)

3. **Miglioramenti UX**:
   - Loading states
   - Error handling
   - Notifiche toast
   - Infinite scroll per liste

4. **Features Avanzate**:
   - Real-time notifications (WebSocket)
   - Geolocalizzazione per eventi
   - Upload immagini
   - Push notifications

## Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/nuova-feature`)
3. Commit delle modifiche (`git commit -am 'Aggiunge nuova feature'`)
4. Push del branch (`git push origin feature/nuova-feature`)
5. Apri una Pull Request

## License

MIT License - vedi [LICENSE](LICENSE) file per i dettagli.
