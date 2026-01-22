// ============================================================
// CONFIGURACIÓN DE SUPABASE PARA ZONAPANTYS
// ============================================================

const SUPABASE_URL = 'https://djycvnfdaugxmshbahzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWN2bmZkYXVneG1zaGJhaHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Nzk3NDgsImV4cCI6MjA4NDQ1NTc0OH0.YZsqWlub2ek3zNmVv2ETzwR_ptDdoFhNZm1u9c1vghI';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase configurado correctamente');
Copiar
