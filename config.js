
// === Configuration du site ===
// Renseigne ces variables avant de mettre en ligne

// Lien iCal public de ton annonce Airbnb (fichier .ics) — à récupérer dans Airbnb > Calendrier > Exporter le calendrier.
export const AIRBNB_ICAL_URL = "https://www.airbnb.com/calendar/ical/46642295.ics?s=a5e03028c3f458d024826733c282655c&locale=fr"; 

// Prix par nuit en euros (utilisé pour le calcul estimatif)
export const NIGHTLY_PRICE = 180;

// Frais de ménage (euros)
export const CLEANING_FEE = 60;

// Nombre de nuits minimum
export const MIN_NIGHTS = 2;

// Option A — lien de paiement Stripe prêt à l’emploi (aucun backend)
export const STRIPE_PAYMENT_LINK = ""; 

// Option B — fonction serverless (Vercel/Netlify) qui crée un Checkout dynamique
export const SERVERLESS_ENDPOINT = "/api/create-checkout-session"; 
