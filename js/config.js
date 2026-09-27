// Public config. The anon key is a public, publishable key: the database tables
// are locked (RLS, no public policies); only the "submit" edge function can write.
window.KK_CONFIG = {
  submitUrl: "https://rekeliwflholllekqias.supabase.co/functions/v1/submit",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJla2VsaXdmbGhvbGxsZWtxaWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjYxODAsImV4cCI6MjEwNjEwMjE4MH0.3oHw55J9xctrvDmBw5lDFj4Klc2pRxQprJxztQRVjaA",
  // PLACEHOLDER: set to digits only, e.g. "91XXXXXXXXXX", once Varun confirms the WhatsApp number.
  whatsappNumber: "[WhatsApp number]"
};
