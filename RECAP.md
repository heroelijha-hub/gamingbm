# Récapitulatif du Projet : Top Kaminbrennstoffe

Ce document liste toutes les fonctionnalités et configurations qui ont été mises en place jusqu'à présent sur la boutique E-commerce **Top Kaminbrennstoffe**.

## 🛠 Stack Technique
- **Framework** : Next.js 16.3.1 (App Router)
- **Base de données** : PostgreSQL (hébergé sur Supabase)
- **ORM** : Prisma
- **Style** : Tailwind CSS (Responsive Mobile-First)
- **Internationalisation** : `next-intl` (Français, Anglais, Espagnol)
- **Génération PDF** : `pdfkit`

---

## 🛒 Côté Utilisateur (Storefront)

### 1. Navigation et Layout (Header & Footer)
- **En-tête dynamique** : 
  - Affichage intelligent des liens **New**, **Hot**, et **Sale** uniquement lorsque des produits correspondant à ces critères existent dans la base de données.
  - Espacement ajusté entre le logo et la barre de recherche pour un meilleur rendu visuel.
  - Correction de la taille du logo pour éviter qu'il ne masque la barre d'annonce.
- **Responsive Design** : 
  - Menu hamburger fonctionnel sur mobile.
  - Typographie adaptative via des variables CSS (`--sz-*`).
- **Footer optimisé** :
  - Design premium avec colonnes qui se transforment en accordéons (collapsibles) sur mobile.
  - Bouton dynamique "Back to top" (jaune, orange au survol) intégré avec le style du thème.
  - Rendu dynamique et sécurisé des liens et colonnes (évitant la duplication des menus par défaut).

### 2. Pages de Produits Spécifiques
- **Page `/sale` (Promotions)** : N'affiche que les produits possédant un *prix de comparaison* renseigné.
- **Page `/hot` (Populaires)** : Filtre automatique affichant uniquement les produits les plus commandés par les clients (basé sur le nombre réel d'achats).
- **Page `/new` (Nouveautés)** : Affiche strictement les 12 derniers produits ajoutés au catalogue.

### 3. Panier et Paiement (Checkout)
- **Panier tiroir** : S'ouvre sur le côté (pleine largeur sur mobile).
- **Moyens de paiement dynamiques** : Le client ne voit que les moyens de paiement activés par l'administrateur (Stripe, PayPal, ou Virement Bancaire).
- **Virement Bancaire** : Affichage d'un message dynamique (configuré depuis l'admin) contenant les instructions bancaires (IBAN, etc.) lors du passage à la caisse.
- **Gestion des Zones d'Expédition** : Prise en compte de l'adresse de facturation/livraison pour le calcul des frais de livraison dynamiques.
- **Gestion fine du Stock** : Décrémentation automatique du stock (global ou par déclinaison) lors du passage de commande.

### 4. Landing Page / Accueil
- **Section BestSeller & Promo** : 
  - Grille de produits dynamique avec fonctionnalités d'**Auto-Slider** si le nombre de produits défini dépasse une limite (1 sur Mobile, 3 sur Tablette, 5 sur Desktop).
  - Navigation améliorée avec les flèches directionnelles sur les grilles de produits.
  - Cartes produits premium avec couleurs de bordures configurables depuis l'admin.
- **Section BestDeals (Bannières promotionnelles)** : 
  - Images, textes d'accroche et boutons d'action (Call-to-Action) 100% éditables depuis le dashboard.
- **Section Avis Clients (Testimonials)** :
  - Alimentée dynamiquement depuis la base de données avec de vrais avis approuvés, remplaçant les placeholders par défaut.

### 5. Internationalisation (i18n)
- **Multilingue complet** : L'ensemble de l'interface du Storefront, de l'espace Administrateur, et des Emails ont été intégralement traduits via un système de dictionnaires JSON (Français, Anglais, Espagnol, Allemand).
- **Synchronisation Parfaite** : Les fichiers de traduction sont garantis alignés à 100% entre toutes les langues pour éviter tout affichage de clés brutes ou décalage de contenu.

---

## ⚙️ Côté Administrateur (Dashboard)

### 1. Gestion des Paramètres (Settings)
- **Sauvegarde ultra-rapide** : Le formulaire des paramètres (qui contient plus de 50 champs) sauvegarde toutes les modifications en moins d'une seconde grâce à une mise à jour groupée (Batch Update avec transaction Prisma).
- **Personnalisation de la boutique** :
  - Couleurs (Thème, Top Bar, Bouton de recherche, Footer, etc.).
  - Textes et Liens (Annonces, Réseaux Sociaux, Menus de navigation, Textes d'authentification "Login", "My Account").
  - Logos et Images (Logo principal, Icône de chat, Image de maintenance).
  - Footer Avancé (Activation/désactivation et personnalisation de l'adresse, l'email et le téléphone depuis le panel).
- **Modes de paiement (Toggles)** : Activation à la volée de Stripe, PayPal, et Virement Bancaire.

### 2. Gestion des Produits & Import WooCommerce
- **Éditeur Riche** : Intégration d'un éditeur basé sur `react-quill` pour faciliter la rédaction des descriptions de produits.
- **Importation WooCommerce Intelligente** : Limitation de la taille des lots (batch sizing) et exécution parallélisée asynchrone pour importer massivement des centaines de produits et d'images de manière stable (protection contre les timeouts 503 Vercel).

### 3. Gestion des Médias & Corbeille (Soft Delete)
- **Médiathèque (Media Library) améliorée** :
  - Possibilité de sélectionner plusieurs images pour une suppression groupée.
  - Encadrements visuels clairs (bordures noires) autour des images sélectionnées.
- **Corbeille (Trash) & Soft Delete** :
  - Suppression douce ("soft delete") pour les Produits et Médias. Rien n'est supprimé définitivement par erreur. 
  - L'administrateur dispose d'une page de Corbeille complète pour restaurer les éléments ou les supprimer de manière irréversible.
- **Sidebar Admin** : Menu de navigation clair, récemment enrichi d'icônes contextuelles pour chaque onglet.

### 4. Landing Page Builder (Éditeur)
- **Constructeur visuel (Drag & Drop / Reorder)** : Les sections peuvent être remontées ou descendues avec des flèches directionnelles.
- **Duplication** : Clonage d'une section en un clic.
- **Configuration Responsive** : Paramètres d'affichage spécifiques (Mobile, Tablette, Desktop) avec ajustement automatique de la taille des polices (Typographie Responsive intelligente).
- **Prévisualisation en Temps Réel (Live Preview)** : Système robuste via API interne et base de données (Drafts) permettant de contourner les limites strictes de taille des cookies HTTP.
- **Personnalisation fine des blocs Hero** : 
  - Possibilité d'ajouter des liens personnalisés (URL) sur chaque bouton Call-To-Action.
  - Filtres d'assombrissement (Overlays) dynamiques configurables (Léger, Moyen, Sombre) sur les images de fond pour garantir un contraste optimal et une parfaite lisibilité du texte.

### 5. SEO & OpenGraph (Optimisation pour le référencement)
- **Paramètres Globaux** : Nouvelle page dédiée dans les réglages pour définir le Meta Titre, la Meta Description globale et l'image de partage (og:image) par défaut (idéalement en 1200x630 pour un affichage optimal sur les réseaux sociaux).
- **SEO Granulaire** : Les champs SEO personnalisés (Meta Titre, Meta Description, Mots-clés) ont été ajoutés aux formulaires de :
  - **Articles de Blog**
  - **Pages personnalisées**
  - **Catégories de produits**
- **Traductions intégrées** : Les labels et descriptions des champs SEO dans l'espace Administrateur sont 100% traduits dans toutes les langues supportées (via `next-intl`).
- **Google Search Console** : Ajout d'un champ dynamique dans les paramètres SEO pour renseigner la clé de vérification du site, injectée automatiquement via la balise meta correspondante dans le `<head>`.
- **Titres dynamiques et propres** : Suppression complète des titres suffixés en dur (ex: "My Store"). Le système priorise désormais strictement le champ `metaTitle` défini en base de données, avec un fallback pertinent ("Top Kaminbrennstoffe").

---

## 📩 Emails Transactionnels & Automatisations (Cron)

### 1. Communications Clients
- **Confirmation de commande & Facture PDF** : Le client reçoit sa confirmation avec une Facture PDF professionnelle générée dynamiquement (avec logo, liste détaillée des articles et prix).
- **Suivi des statuts** : Notifications automatiques lors du changement de statut de la commande (Expédiée, Livrée, Annulée).
- **Panier Abandonné** : Relance automatisée contenant un résumé visuel clair des articles délaissés, avec un lien pour reprendre l'achat.
- **Demande d'avis (Review Request)** :
  - Tâche CRON (via Vercel) exécutée quotidiennement pour détecter les commandes marquées "Livrées" depuis exactement 7 jours.
  - Le client reçoit un email l'invitant à noter les produits commandés.

### 2. Alertes Administrateur
- **Message du Support Chat** : Dès qu'un visiteur écrit un message dans le Live Chat, un email contenant son message complet est expédié à l'administrateur avec un raccourci direct vers le dashboard.
- **Alerte de Stock Faible** : Dès qu'un produit (ou sa déclinaison) franchit à la baisse le seuil d'alerte défini dans les Settings, un email rouge urgent prévient le gérant pour organiser le réassort.

---

## 🛡 Sécurité et Performances

### 1. Protection Anti-DDoS et Rate Limiting
- **Edge Middleware** : Mise en place d'un intercepteur de requêtes Next.js tournant à l'Edge (Cloudflare/Vercel).
- **Redis (Upstash)** : Limiteur de débit (`Ratelimit.slidingWindow`) configuré pour bloquer les tentatives de hacking (Brute force) ou envois massifs de requêtes.
- Retourne dynamiquement un écran HTML de blocage ("429 Too Many Requests") en cas d'abus.

### 2. DevOps et Déploiement
- Déploiement automatisé sur **Vercel** (avec résolution des soucis liés à l'architecture Turbopack / Next.js pour l'installation serveur de `pdfkit`).
- Nettoyage préventif des scripts via des opérations correctives Node.js (`\0` sanitization).
- Synchronisation continue avec **GitHub**.
