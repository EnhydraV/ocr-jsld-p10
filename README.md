# Preuve de concept : chat en temps réel

Your Car Your Way, projet de refonte de l'application client. Cette preuve de concept porte
sur la fonctionnalité de chat entre un client et un conseiller, la partie la plus risquée de
l'architecture proposée.

Elle démontre trois choses :

- un service de chat autonome, séparé du reste de l'application, qui tient des connexions
  WebSocket ;
- un ordre des messages stable dans une conversation, garanti par la base de données même
  quand plusieurs messages arrivent en même temps ;
- la resynchronisation après une coupure : un participant qui revient récupère ce qu'il a
  manqué, sans doublon.

## Prérequis

- Node.js 24 ou plus récent (`node --version`).
- Docker, pour la base PostgreSQL.

## Première mise en route

Du dépôt cloné au premier message échangé. Chaque étape est rejouable : la relancer ne casse
rien et ne crée pas de doublon, donc une étape qui a échoué se reprend telle quelle, et toute
la séquence se rejoue sur un dépôt déjà installé.

**1. Vérifier les prérequis.**

```bash
node --version      # v24 ou plus
docker --version
```

**2. Installer les dépendances.** Le client Prisma est généré au passage.

```bash
npm install
```

**3. Créer le fichier de configuration.** Le test évite d'écraser un `.env` déjà rempli.

```bash
[ -f .env ] || cp .env.example .env
```

**4. Démarrer PostgreSQL.** La commande rend la main quand la base accepte les connexions,
pas avant, donc l'étape suivante peut suivre immédiatement. Si le conteneur tourne déjà,
elle ne fait rien.

```bash
npm run db:up
```

**5. Créer les tables.** Seules les migrations absentes sont appliquées.

```bash
npm run db:migrate
```

Attendu la première fois : `The following migration(s) have been applied`. Ensuite :
`No pending migrations to apply.`

**6. Insérer la conversation de démonstration.**

```bash
npm run db:seed
```

Attendu : `Jeu de données en place : 1 message(s).` La conversation est identifiée, donc la
rejouer ne crée pas de seconde copie.

**7. Compiler, puis lancer.**

```bash
npm run build
npm start
```

Attendu, sur la dernière ligne : `Instance local a l'ecoute sur le port 3000`.

**8. Vérifier, dans un second terminal.**

```bash
curl http://localhost:3000/health
# {"status":"ok","instance":"local"}
```

Le service tourne. La section suivante montre comment échanger un message.

Pendant le développement, `npm run dev` remplace les étapes 7 et 8 : il compile, lance et
redémarre à chaque modification.

### Repartir de zéro

`npm run db:reset` arrête PostgreSQL et supprime son volume, donc toutes les données. Les
étapes 4 à 6 reconstruisent la base.

## Essayer le chat

La conversation de démonstration a pour identifiant
`11111111-1111-4111-8111-111111111111`. Elle contient déjà un message de Charlie.

### En HTTP

```bash
CONV=11111111-1111-4111-8111-111111111111

curl "http://localhost:3000/conversations/$CONV/messages"

curl -X POST "http://localhost:3000/conversations/$CONV/messages" \
  -H 'Content-Type: application/json' \
  -d '{"authorType":"advisor","authorId":"victor","body":"Bonjour, je regarde votre dossier."}'
```

### En WebSocket

Le service accepte les connexions WebSocket sur le même port que l'API. Les trames sont du
JSON de la forme `{ "event": ..., "data": ... }`.

Ce que le client envoie :

| `event` | `data` | Effet |
|---|---|---|
| `subscribe` | `conversationId`, `afterSeq` (facultatif) | S'abonne à la conversation et reçoit les messages qui suivent `afterSeq` |
| `send` | `conversationId`, `authorType`, `authorId`, `body` | Enregistre un message et le diffuse aux abonnés |

Ce que le service renvoie :

| `event` | Contenu | Quand |
|---|---|---|
| `welcome` | nom de l'instance | À la connexion |
| `synced` | la conversation et les messages manquants | Après `subscribe` |
| `sent` | le numéro d'ordre attribué | À l'auteur, une fois le message enregistré |
| `message` | le message complet | À tous les abonnés de la conversation |
| `error` | la raison du refus | Entrée invalide ou conversation inconnue |

Pour essayer sans écrire de client, depuis la racine du dépôt :

```bash
node -e '
const WebSocket = require("ws");
const CONV = "11111111-1111-4111-8111-111111111111";
const socket = new WebSocket("ws://127.0.0.1:3000");
socket.on("message", (raw) => console.log(raw.toString()));
socket.on("open", () => {
  socket.send(JSON.stringify({ event: "subscribe", data: { conversationId: CONV, afterSeq: 0 } }));
  setTimeout(() => socket.send(JSON.stringify({
    event: "send",
    data: { conversationId: CONV, authorType: "customer", authorId: "charlie", body: "Bonjour" },
  })), 500);
});'
```

Ouvrez deux terminaux avec cette commande : ce que l'un envoie s'affiche dans l'autre.

## Le client web

Deux fenêtres, une par rôle, dans `web/`. Elles se connectent à la passerelle du service.

```bash
cd web
npm install
npm run build
npm start          # http://localhost:3100
```

- `http://localhost:3100/client` : la vue de Charlie, qui a réservé.
- `http://localhost:3100/conseiller` : la vue de Victor, au service client.

La page d'accueil donne les deux liens.

![Page d'accueil : un titre et deux cartes cliquables, vers la vue client et vers la vue
conseiller.](screenshots/accueil.png)

Ouvrez les deux dans deux fenêtres côte à côte : ce que l'une envoie apparaît dans l'autre.

![La même conversation vue par le client, à gauche, et par le conseiller, à droite. Les
messages de chacun apparaissent à droite de sa propre fenêtre, en bleu, et ceux de son
interlocuteur à gauche, en gris.](screenshots/deux-fenetres.png)

Une fenêtre qui perd la connexion se reconnecte seule et rattrape les messages écrits pendant
la coupure, à partir du dernier numéro d'ordre qu'elle avait reçu, sans doublon. Pour le voir,
arrêtez le service pendant qu'une fenêtre est ouverte, écrivez par l'API depuis l'autre poste,
puis relancez-le.

## Le numéro d'ordre des messages

Chaque message porte un numéro d'ordre, `seq`, unique dans sa conversation et sans trou :
1, 2, 3. Ce numéro sert à deux choses : afficher les messages dans l'ordre où ils ont été
écrits, et permettre à un client revenant d'une coupure de demander "tout ce qui suit le
numéro 7".

Un identifiant auto-incrémenté de table ne conviendrait pas : il est commun à toutes les
conversations, donc il laisse des trous dans chacune, et "tout ce qui suit le 7" devient
impossible à formuler.

Le numéro est donc attribué par l'application, dans une transaction
(`src/chat/chat.repository.ts`) :

1. verrouiller la ligne de la conversation (`SELECT last_seq ... FOR UPDATE`) ;
2. lire le dernier numéro utilisé et l'incrémenter ;
3. écrire le message et mettre à jour la conversation ;
4. relâcher le verrou en validant la transaction.

Le verrou sérialise les écritures d'une même conversation. Deux messages envoyés à la même
milliseconde, même depuis deux instances différentes du service, obtiennent deux numéros
consécutifs. Les conversations sont indépendantes les unes des autres : le verrou porte sur
une ligne, pas sur la table.

Un trigger SQL ferait le même travail. Le choix de la transaction applicative garde la règle
lisible dans le code et dans le modèle Prisma, là où un trigger la rendrait invisible au
client généré.

## Structure

```
prisma/
  schema.prisma        modèle de données, source de vérité
  migrations/          SQL généré, plus les contraintes CHECK ajoutées à la main
  seed.ts              conversation de démonstration
src/
  main.ts              démarrage, adaptateur WebSocket
  config.ts            lecture de l'environnement
  chat/
    chat.controller.ts transport HTTP
    chat.gateway.ts    transport WebSocket
    chat.service.ts    règles du chat, sans HTTP ni SQL
    chat.repository.ts accès aux tables, attribution du numéro d'ordre
    chat.schemas.ts    validation des entrées (zod)
    chat.subscribers.ts registre des connexions ouvertes
  prisma/              client Prisma branché sur le cycle de vie de Nest
  health/              sonde de vie
web/                   client web Next.js, une vue par rôle
```

Les deux transports, HTTP et WebSocket, appellent le même `ChatService`, donc les règles du
chat sont écrites à un seul endroit.

## Configuration

| Variable | Défaut | Rôle |
|---|---|---|
| `DATABASE_URL` | aucun, obligatoire | Connexion PostgreSQL |
| `PORT` | `3000` | Port HTTP et WebSocket |
| `INSTANCE_NAME` | `local` | Nom affiché par la sonde de vie et annoncé à la connexion |

Une variable obligatoire manquante arrête le service au démarrage.

## Commandes

| Commande | Effet |
|---|---|
| `npm run build` | Compile vers `dist/` |
| `npm start` | Lance le service compilé |
| `npm run dev` | Lance en rechargement automatique |
| `npm run typecheck` | Génère le client Prisma et vérifie les types |
| `npm run db:up` / `db:down` | Démarre et arrête PostgreSQL |
| `npm run db:reset` | Arrête PostgreSQL et supprime ses données |
| `npm run db:migrate` | Applique les migrations |
| `npm run db:seed` | Insère le jeu de démonstration |
| `npm run db:studio` | Ouvre l'explorateur de base de Prisma |
