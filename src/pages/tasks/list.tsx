import { useState } from 'react'
import { MessageSquareMore, Check, Clock, AlertCircle, Minus, Filter } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type Status = 'done' | 'in-progress' | 'pending' | 'planned'
type DevStatus = 'done' | 'in-progress' | 'pending' | 'planned' | 'na'
type Lang = 'en' | 'tr'

interface Task {
  id: string
  name: string
  nameTr: string
  description: string
  descriptionTr: string
  status: Status
  category: string
  priority: 'high' | 'medium' | 'low'
  frontend: DevStatus
  backend: DevStatus
  assignedOn: string
}

// ─── Translations ───────────────────────────────────────────────────────────

const T: Record<string, Record<Lang, string>> = {
  projectTracker:  { en: 'Project Tracker',       tr: 'Proje Takip' },
  tasks:           { en: 'tasks',                  tr: 'görev' },
  totalTasks:      { en: 'Total Tasks',            tr: 'Toplam Görev' },
  completed:       { en: 'Completed',              tr: 'Tamamlanan' },
  inProgress:      { en: 'In Progress',            tr: 'Devam Eden' },
  planned:         { en: 'Planned',                tr: 'Planlanan' },
  searchTasks:     { en: 'Search tasks...',        tr: 'Görev ara...' },
  allStatus:       { en: 'All Status',             tr: 'Tüm Durumlar' },
  allCategories:   { en: 'All Categories',         tr: 'Tüm Kategoriler' },
  allPriority:     { en: 'All Priority',           tr: 'Tüm Öncelik' },
  clear:           { en: 'Clear',                  tr: 'Temizle' },
  of:              { en: 'of',                     tr: '/' },
  id:              { en: 'ID',                     tr: 'ID' },
  task:            { en: 'Task',                   tr: 'Görev' },
  category:        { en: 'Category',               tr: 'Kategori' },
  assignedOn:      { en: 'Assigned On',            tr: 'Atanma Tarihi' },
  frontendCol:     { en: 'Frontend',               tr: 'Ön Yüz' },
  backendCol:      { en: 'Backend',                tr: 'Arka Yüz' },
  priority:        { en: 'Priority',               tr: 'Öncelik' },
  statusCol:       { en: 'Status',                 tr: 'Durum' },
  noMatch:         { en: 'No tasks match your filters', tr: 'Filtrelere uygun görev bulunamadı' },
  // Status labels
  done:            { en: 'Done',                   tr: 'Tamamlandı' },
  inProgressS:     { en: 'In Progress',            tr: 'Devam Ediyor' },
  pending:         { en: 'Pending',                tr: 'Bekliyor' },
  plannedS:        { en: 'Planned',                tr: 'Planlandı' },
  // Priority labels
  high:            { en: 'High',                   tr: 'Yüksek' },
  medium:          { en: 'Medium',                 tr: 'Orta' },
  low:             { en: 'Low',                    tr: 'Düşük' },
  // Dev status
  devDone:         { en: '✓ Done',                 tr: '✓ Tamam' },
  devWip:          { en: '◐ WIP',                  tr: '◐ Devam' },
  devPending:      { en: '○ Pending',              tr: '○ Bekliyor' },
  devPlanned:      { en: '◇ Planned',              tr: '◇ Planlandı' },
  devNa:           { en: '—',                      tr: '—' },
}

// ─── Category translations ──────────────────────────────────────────────────

const CAT_TR: Record<string, string> = {
  'Auth & Security':     'Kimlik & Güvenlik',
  'Core Pages':          'Ana Sayfalar',
  'Operations':          'Operasyonlar',
  'Tools':               'Araçlar',
  'UI & Design':         'Arayüz & Tasarım',
  'DevOps':              'DevOps',
  'Backend Services':    'Arka Yüz Servisleri',
  'Testing & QA':        'Test & Kalite',
  'Critical — Go Live':  'Kritik — Canlıya Geçiş',
  'Future Enhancements': 'Gelecek Geliştirmeler',
}

// ─── All Tasks ──────────────────────────────────────────────────────────────

const TASKS: Task[] = [
  // Auth & Security
  { id: 'T001', name: 'Login + JWT Authentication', nameTr: 'Giriş + JWT Kimlik Doğrulama', description: 'Username/password login with JWT token generation and refresh', descriptionTr: 'Kullanıcı adı/şifre ile giriş, JWT token oluşturma ve yenileme', status: 'in-progress', category: 'Auth & Security', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T002', name: 'MFA (Google Authenticator)', nameTr: 'MFA (Google Authenticator)', description: 'Two-factor authentication via Google Auth, SMS, or Email', descriptionTr: 'Google Auth, SMS veya E-posta ile iki faktörlü kimlik doğrulama', status: 'in-progress', category: 'Auth & Security', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T003', name: 'Forgot Password', nameTr: 'Şifremi Unuttum', description: '2-step password reset flow with email OTP verification', descriptionTr: 'E-posta OTP doğrulaması ile 2 adımlı şifre sıfırlama', status: 'in-progress', category: 'Auth & Security', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T004', name: 'Role-Based Access Control (RBAC)', nameTr: 'Rol Tabanlı Erişim Kontrolü (RBAC)', description: 'Dynamic permissions per role — SuperAdmin, Admin, CompanyAdmin, CompanyUser', descriptionTr: 'Rol bazlı dinamik izinler — SuperAdmin, Admin, ŞirketAdmin, ŞirketKullanıcı', status: 'in-progress', category: 'Auth & Security', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T005', name: 'Token Refresh Mechanism', nameTr: 'Token Yenileme Mekanizması', description: 'Auto-refresh JWT tokens before expiry to maintain sessions', descriptionTr: 'Oturumları sürdürmek için JWT tokenların otomatik yenilenmesi', status: 'in-progress', category: 'Auth & Security', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T006', name: 'Session Management', nameTr: 'Oturum Yönetimi', description: 'Logout, session expiry, remember token invalidation', descriptionTr: 'Çıkış, oturum süresi dolumu, hatırlama token geçersiz kılma', status: 'in-progress', category: 'Auth & Security', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: ' ' },

  // Core Pages
  { id: 'T007', name: 'Dashboard', nameTr: 'Kontrol Paneli', description: 'Overview with total orders, today stats, delivery rate, credits, active companies', descriptionTr: 'Toplam sipariş, günlük istatistik, teslim oranı, kredi, aktif şirketler', status: 'in-progress', category: 'Core Pages', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T008', name: 'Orders List Page', nameTr: 'Sipariş Listesi Sayfası', description: 'Order management with filters, search, pagination, status tracking', descriptionTr: 'Filtre, arama, sayfalama, durum takibi ile sipariş yönetimi', status: 'in-progress', category: 'Core Pages', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T009', name: 'Order Detail Page', nameTr: 'Sipariş Detay Sayfası', description: 'View order details, message list, delivery status per recipient', descriptionTr: 'Sipariş detayları, mesaj listesi, alıcı bazlı teslim durumu', status: 'in-progress', category: 'Core Pages', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T010', name: 'New Order / Send SMS', nameTr: 'Yeni Sipariş / SMS Gönder', description: 'Create bulk SMS order with phonebook/manual entry, template selection', descriptionTr: 'Rehber/elle giriş, şablon seçimi ile toplu SMS siparişi oluşturma', status: 'in-progress', category: 'Core Pages', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T011', name: 'Companies (CRUD)', nameTr: 'Şirketler (CRUD)', description: 'Multi-tenant company management with pricing, credits, users, transactions', descriptionTr: 'Fiyatlandırma, kredi, kullanıcı, işlem ile çoklu şirket yönetimi', status: 'in-progress', category: 'Core Pages', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T012', name: 'Company Detail Page', nameTr: 'Şirket Detay Sayfası', description: 'Firm info, pricing, credit transactions, user list per company', descriptionTr: 'Firma bilgisi, fiyatlandırma, kredi işlemleri, şirket bazlı kullanıcı listesi', status: 'in-progress', category: 'Core Pages', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' 03-19' },
  { id: 'T013', name: 'Company Users', nameTr: 'Şirket Kullanıcıları', description: 'Manage users per company — CompanyAdmin and CompanyUser roles', descriptionTr: 'Şirket bazlı kullanıcı yönetimi — ŞirketAdmin ve ŞirketKullanıcı rolleri', status: 'in-progress', category: 'Core Pages', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T014', name: 'Users Management', nameTr: 'Kullanıcı Yönetimi', description: 'System-wide user list with create, edit, activate/deactivate', descriptionTr: 'Sistem genelinde kullanıcı listesi — oluşturma, düzenleme, aktif/pasif', status: 'in-progress', category: 'Core Pages', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T015', name: 'Roles & Permissions Grid', nameTr: 'Roller ve İzinler Tablosu', description: 'Dynamic role editor with per-resource CRUD permission grid', descriptionTr: 'Kaynak bazlı CRUD izin tablosu ile dinamik rol düzenleyici', status: 'in-progress', category: 'Core Pages', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T016', name: 'Settings / Profile Page', nameTr: 'Ayarlar / Profil Sayfası', description: 'Profile edit, MFA setup, Telegram link, password change, preferences', descriptionTr: 'Profil düzenleme, MFA kurulumu, Telegram bağlantısı, şifre değiştirme', status: 'in-progress', category: 'Core Pages', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: ' ' },

  // Operations
  { id: 'T017', name: 'Pricing (Standard + Special)', nameTr: 'Fiyatlandırma (Standart + Özel)', description: 'Global standard pricing + per-company special pricing with tier validation', descriptionTr: 'Global standart fiyat + şirket bazlı özel fiyat, kademe doğrulaması', status: 'in-progress', category: 'Operations', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T018', name: 'Pricing Tier Validation', nameTr: 'Fiyat Kademe Doğrulaması', description: 'Low ≤ Medium ≤ High numeric validation with decimal support', descriptionTr: 'Düşük ≤ Orta ≤ Yüksek sayısal doğrulama, ondalık desteği', status: 'in-progress', category: 'Operations', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T019', name: 'Credit Management', nameTr: 'Kredi Yönetimi', description: 'Add/remove credits, transaction history, balance inquiry per company', descriptionTr: 'Kredi ekleme/çıkarma, işlem geçmişi, şirket bazlı bakiye sorgulama', status: 'in-progress', category: 'Operations', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T020', name: 'Credit Uploads Report', nameTr: 'Kredi Yükleme Raporu', description: 'Track all credit upload transactions with date/type filters', descriptionTr: 'Tarih/tür filtresi ile tüm kredi yükleme işlemlerini takip', status: 'in-progress', category: 'Operations', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: ' ' },
  { id: 'T021', name: 'API Configuration', nameTr: 'API Yapılandırması', description: 'Manage gateway API credentials and settings per company', descriptionTr: 'Şirket bazlı SMS kapısı API kimlik bilgileri ve ayarları yönetimi', status: 'in-progress', category: 'Operations', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T022', name: 'Tickets / Support System', nameTr: 'Destek Talepleri Sistemi', description: 'Support ticket create, reply, status tracking, ticket disallow per company', descriptionTr: 'Destek talebi oluşturma, yanıtlama, durum takibi, şirket bazlı kısıtlama', status: 'in-progress', category: 'Operations', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T023', name: 'Activity Log / Reports', nameTr: 'Aktivite Günlüğü / Raporlar', description: 'View system activity, login history, actions with filters', descriptionTr: 'Sistem aktivitesi, giriş geçmişi, filtreli işlem görüntüleme', status: 'in-progress', category: 'Operations', priority: 'low', frontend: 'pending', backend: 'pending', assignedOn: '  ' },

  // Tools
  { id: 'T024', name: 'Short URL Creation', nameTr: 'Kısa URL Oluşturma', description: 'Create short URLs with custom codes, expiry, max clicks per company', descriptionTr: 'Özel kodlar, süre sonu, şirket bazlı maks tıklama ile kısa URL oluşturma', status: 'in-progress', category: 'Tools', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T025', name: 'Short URL Click Tracking', nameTr: 'Kısa URL Tıklama Takibi', description: 'Device detection, OS, browser, IP logging per click', descriptionTr: 'Tıklama başına cihaz algılama, işletim sistemi, tarayıcı, IP kaydı', status: 'in-progress', category: 'Tools', priority: 'high', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T026', name: 'Short URL Redirect Engine', nameTr: 'Kısa URL Yönlendirme Motoru', description: 'Root-level /{code} redirect with regex constraint and fallback', descriptionTr: 'Kök düzey /{code} yönlendirme, regex kısıtı ve yedek yönlendirme', status: 'in-progress', category: 'Tools', priority: 'high', frontend: 'na', backend: 'pending', assignedOn: '  ' },
  { id: 'T027', name: 'Phonebooks', nameTr: 'Rehberler', description: 'Contact phonebook management — create, bulk add contacts, search, delete', descriptionTr: 'Rehber yönetimi — oluşturma, toplu kişi ekleme, arama, silme', status: 'in-progress', category: 'Tools', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T028', name: 'Message Templates', nameTr: 'Mesaj Şablonları', description: 'SMS/Email templates with variables, character counter, SMS parts calc, live preview', descriptionTr: 'Değişkenli SMS/E-posta şablonları, karakter sayacı, SMS parça hesabı, canlı önizleme', status: 'in-progress', category: 'Tools', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T029', name: 'Blacklist (Global)', nameTr: 'Kara Liste (Global)', description: 'Global phone number blacklist — blocks across all companies', descriptionTr: 'Global telefon numarası kara listesi — tüm şirketlerde engeller', status: 'in-progress', category: 'Tools', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T030', name: 'Banlist (Per Company)', nameTr: 'Engel Listesi (Şirket Bazlı)', description: 'Per-company phone number banlist with company selector', descriptionTr: 'Şirket seçici ile şirket bazlı telefon numarası engel listesi', status: 'in-progress', category: 'Tools', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: '  ' },

  // UI & Design
  { id: 'T031', name: 'Landing Page + Embedded Login', nameTr: 'Ana Sayfa + Gömülü Giriş', description: 'Single-screen landing with features/platform tabs and integrated login card', descriptionTr: 'Özellikler/platform sekmeleri ve entegre giriş kartı ile tek ekran ana sayfa', status: 'in-progress', category: 'UI & Design', priority: 'high', frontend: 'pending', backend: 'na', assignedOn: '  ' },
  { id: 'T032', name: 'Theme System (Light/Dark)', nameTr: 'Tema Sistemi (Açık/Koyu)', description: 'Light/Dark/System mode toggle with persistent preference', descriptionTr: 'Kalıcı tercih ile Açık/Koyu/Sistem modu geçişi', status: 'in-progress', category: 'UI & Design', priority: 'low', frontend: 'pending', backend: 'na', assignedOn: ' ' },
  { id: 'T033', name: 'Accent Color Picker', nameTr: 'Vurgu Renk Seçici', description: 'Multiple brand color themes — teal, blue, purple, red, orange, etc.', descriptionTr: 'Çoklu marka renk temaları — turkuaz, mavi, mor, kırmızı, turuncu vb.', status: 'in-progress', category: 'UI & Design', priority: 'low', frontend: 'pending', backend: 'na', assignedOn: ' ' },
  { id: 'T034', name: 'Collapsible Sidebar', nameTr: 'Daraltılabilir Yan Menü', description: 'Sidebar with collapsible nav groups, chevron toggle, icon-only mode', descriptionTr: 'Daraltılabilir gezinme grupları, ok geçişi, yalnızca simge modu', status: 'in-progress', category: 'UI & Design', priority: 'medium', frontend: 'pending', backend: 'na', assignedOn: '  ' },
  { id: 'T035', name: 'Fixed Header + Footer', nameTr: 'Sabit Üst + Alt Bilgi', description: 'Sticky header with marquee, breadcrumbs; fixed footer with Telegram link', descriptionTr: 'Kayan yazı, içerik haritası ile sabit üst bilgi; Telegram bağlantılı alt bilgi', status: 'in-progress', category: 'UI & Design', priority: 'low', frontend: 'pending', backend: 'na', assignedOn: '  ' },
  { id: 'T036', name: 'Company Layout', nameTr: 'Şirket Düzeni', description: 'Separate horizontal nav layout for CompanyAdmin/CompanyUser roles', descriptionTr: 'ŞirketAdmin/ŞirketKullanıcı rolleri için ayrı yatay gezinme düzeni', status: 'in-progress', category: 'UI & Design', priority: 'medium', frontend: 'pending', backend: 'na', assignedOn: '  ' },
  { id: 'T037', name: 'Responsive Nav Bar Design', nameTr: 'Duyarlı Gezinme Çubuğu', description: 'Navigation adapts for company users vs admin users', descriptionTr: 'Şirket kullanıcıları ve admin kullanıcılar için uyarlanabilir gezinme', status: 'in-progress', category: 'UI & Design', priority: 'medium', frontend: 'pending', backend: 'na', assignedOn: '  ' },

  // DevOps
  { id: 'T038', name: 'CI/CD Pipeline Setup', nameTr: 'CI/CD Pipeline Kurulumu', description: 'GitHub Actions — separate frontend/backend workflows with manual trigger', descriptionTr: 'GitHub Actions — manuel tetiklemeli ayrı frontend/backend iş akışları', status: 'in-progress', category: 'DevOps', priority: 'high', frontend: 'na', backend: 'pending', assignedOn: '  ' },
  { id: 'T039', name: 'Azure App Service Deployment', nameTr: 'Azure App Service Dağıtımı', description: 'App Service with static file serving, Service Principal auth', descriptionTr: 'Statik dosya sunumu, Service Principal kimlik doğrulaması ile App Service', status: 'in-progress', category: 'DevOps', priority: 'high', frontend: 'na', backend: 'pending', assignedOn: '  ' },
  { id: 'T040', name: 'Azure Environment Variables', nameTr: 'Azure Ortam Değişkenleri', description: 'Connection strings, JWT keys, Blob storage, Short URL config', descriptionTr: 'Bağlantı dizeleri, JWT anahtarları, Blob depolama, Kısa URL yapılandırması', status: 'in-progress', category: 'DevOps', priority: 'high', frontend: 'na', backend: 'pending', assignedOn: '  ' },
  { id: 'T041', name: 'Database Schema Migration', nameTr: 'Veritabanı Şema Geçişi', description: 'Fresh schema on Azure SQL from local DB with seed data', descriptionTr: 'Yerel veritabanından Azure SQL üzerinde başlangıç verileriyle yeni şema', status: 'in-progress', category: 'DevOps', priority: 'high', frontend: 'na', backend: 'pending', assignedOn: '  ' },
  { id: 'T042', name: 'Azure Blob Storage Integration', nameTr: 'Azure Blob Depolama Entegrasyonu', description: 'File uploads via AzureBlobStorageService with container management', descriptionTr: 'Konteyner yönetimi ile AzureBlobStorageService üzerinden dosya yükleme', status: 'in-progress', category: 'DevOps', priority: 'high', frontend: 'na', backend: 'pending', assignedOn: '  ' },
  { id: 'T043', name: 'Deploy Script (Manual Fallback)', nameTr: 'Dağıtım Betiği (Manuel Yedek)', description: 'PowerShell deploy.ps1 with -Frontend, -Backend, -Full flags', descriptionTr: 'PowerShell deploy.ps1 — Frontend, Backend, Full bayrakları ile', status: 'in-progress', category: 'DevOps', priority: 'medium', frontend: 'na', backend: 'pending', assignedOn: '  ' },
  { id: 'T044', name: 'Custom Domain Configuration', nameTr: 'Özel Alan Adı Yapılandırması', description: 'kktcsms.net + s.go2s.me custom domains with SSL', descriptionTr: 'kktcsms.com + s.go2s.me özel alan adları ve SSL sertifikası', status: 'in-progress', category: 'DevOps', priority: 'high', frontend: 'na', backend: 'pending', assignedOn: '  ' },

  // Backend Services
  { id: 'T045', name: 'Gateway Abstraction (ISmsGateway)', nameTr: 'SMS Kapısı Soyutlaması (ISmsGateway)', description: 'Abstract interface for Turkcell, Yurtici, and future gateways', descriptionTr: 'Turkcell, Yurtiçi ve gelecek kapılar için soyut arayüz', status: 'in-progress', category: 'Backend Services', priority: 'high', frontend: 'na', backend: 'pending', assignedOn: ' ' },
  { id: 'T046', name: 'GatewayFactory', nameTr: 'Kapı Fabrikası', description: 'Factory pattern to resolve correct gateway per company config', descriptionTr: 'Şirket yapılandırmasına göre doğru kapıyı çözen fabrika deseni', status: 'in-progress', category: 'Backend Services', priority: 'high', frontend: 'na', backend: 'pending', assignedOn: ' ' },
  { id: 'T047', name: 'OrderService (Batch Processing)', nameTr: 'Sipariş Servisi (Toplu İşleme)', description: 'Split orders into 1000-batch jobs, deduct credits, queue for sending', descriptionTr: 'Siparişleri 1000\'lik gruplara böl, kredi düş, gönderim kuyruğuna ekle', status: 'in-progress', category: 'Backend Services', priority: 'high', frontend: 'na', backend: 'pending', assignedOn: ' ' },
  { id: 'T048', name: 'Telegram Bot Integration', nameTr: 'Telegram Bot Entegrasyonu', description: 'Link/unlink Telegram accounts, send alerts via bot', descriptionTr: 'Telegram hesaplarını bağla/çıkar, bot ile uyarı gönder', status: 'in-progress', category: 'Backend Services', priority: 'medium', frontend: 'pending', backend: 'pending', assignedOn: '  ' },
  { id: 'T049', name: 'Serilog + Application Insights', nameTr: 'Serilog + Application Insights', description: 'Structured logging with Serilog, telemetry via App Insights', descriptionTr: 'Serilog ile yapılandırılmış günlükleme, App Insights ile telemetri', status: 'in-progress', category: 'Backend Services', priority: 'medium', frontend: 'na', backend: 'pending', assignedOn: ' ' },
  { id: 'T050', name: 'Access Log Middleware', nameTr: 'Erişim Günlüğü Ara Yazılımı', description: 'Log user actions, login attempts, IP addresses automatically', descriptionTr: 'Kullanıcı işlemleri, giriş denemeleri, IP adreslerini otomatik kaydet', status: 'in-progress', category: 'Backend Services', priority: 'medium', frontend: 'na', backend: 'pending', assignedOn: '  ' },

  // Testing & QA
  { id: 'T051', name: 'API Endpoint Testing (Swagger)', nameTr: 'API Uç Nokta Testi (Swagger)', description: 'All API endpoints tested via Swagger UI in development', descriptionTr: 'Tüm API uç noktaları geliştirme ortamında Swagger UI ile test edildi', status: 'in-progress', category: 'Testing & QA', priority: 'medium', frontend: 'na', backend: 'pending', assignedOn: '  ' },
  { id: 'T052', name: 'Cross-Browser Testing', nameTr: 'Çapraz Tarayıcı Testi', description: 'Verify Chrome, Firefox, Edge compatibility for all pages', descriptionTr: 'Tüm sayfalar için Chrome, Firefox, Edge uyumluluğunu doğrula', status: 'in-progress', category: 'Testing & QA', priority: 'medium', frontend: 'in-progress', backend: 'na', assignedOn: '  ' },
  { id: 'T053', name: 'Company User Login Testing', nameTr: 'Şirket Kullanıcı Giriş Testi', description: 'Test CompanyAdmin/CompanyUser role permissions and layout', descriptionTr: 'ŞirketAdmin/ŞirketKullanıcı rol izinleri ve düzen testi', status: 'in-progress', category: 'Testing & QA', priority: 'high', frontend: 'in-progress', backend: 'pending', assignedOn: '  ' },
  { id: 'T054', name: 'Mobile Responsive Testing', nameTr: 'Mobil Duyarlılık Testi', description: 'Test all pages on mobile viewport sizes', descriptionTr: 'Tüm sayfaları mobil görünüm boyutlarında test et', status: 'planned', category: 'Testing & QA', priority: 'medium', frontend: 'planned', backend: 'na', assignedOn: '' },

  // Critical — Go Live
  { id: 'T055', name: 'SMS Worker (Gateway Sending)', nameTr: 'SMS Worker (Kapı Gönderimi)', description: 'Background service to send SMS via Turkcell/Yurtici gateways with 10 parallel threads', descriptionTr: '10 paralel iş parçacığı ile Turkcell/Yurtiçi kapıları üzerinden SMS gönderen arka plan servisi', status: 'planned', category: 'Critical — Go Live', priority: 'high', frontend: 'na', backend: 'planned', assignedOn: '' },
  { id: 'T056', name: 'Delivery Reports Polling', nameTr: 'Teslim Raporu Sorgulama', description: 'Background job to poll gateway for delivery status and update records', descriptionTr: 'Teslim durumu için kapıyı sorgulayan ve kayıtları güncelleyen arka plan görevi', status: 'planned', category: 'Critical — Go Live', priority: 'high', frontend: 'na', backend: 'planned', assignedOn: '' },
  { id: 'T057', name: 'Credit Deduction on Send', nameTr: 'Gönderimde Kredi Düşme', description: 'Verify credit deduction logic works correctly in production', descriptionTr: 'Üretimde kredi düşme mantığının doğru çalıştığını doğrula', status: 'planned', category: 'Critical — Go Live', priority: 'high', frontend: 'na', backend: 'planned', assignedOn: '' },
  { id: 'T058', name: 'Email Service (SMTP) Wiring', nameTr: 'E-posta Servisi (SMTP) Bağlantısı', description: 'Connect SmtpEmailService for password reset, MFA, and notifications', descriptionTr: 'Şifre sıfırlama, MFA ve bildirimler için SmtpEmailService bağlantısı', status: 'planned', category: 'Critical — Go Live', priority: 'medium', frontend: 'na', backend: 'planned', assignedOn: '' },
  { id: 'T059', name: 'Gateway Credentials Setup', nameTr: 'Kapı Kimlik Bilgileri Kurulumu', description: 'Configure Turkcell/Yurtici API keys and sender IDs in production', descriptionTr: 'Üretimde Turkcell/Yurtiçi API anahtarları ve gönderici kimliklerini yapılandır', status: 'planned', category: 'Critical — Go Live', priority: 'high', frontend: 'na', backend: 'planned', assignedOn: '' },
  { id: 'T060', name: 'Production Load Testing', nameTr: 'Üretim Yük Testi', description: 'Stress test with 100K+ messages to verify throughput and stability', descriptionTr: 'Verim ve kararlılığı doğrulamak için 100K+ mesajla stres testi', status: 'planned', category: 'Critical — Go Live', priority: 'high', frontend: 'na', backend: 'planned', assignedOn: '' },

  // Future Enhancements
  { id: 'T061', name: 'SignalR (Real-time Order Progress)', nameTr: 'SignalR (Gerçek Zamanlı Sipariş İlerlemesi)', description: 'Live order progress updates via WebSocket connection', descriptionTr: 'WebSocket bağlantısı ile canlı sipariş ilerleme güncellemeleri', status: 'planned', category: 'Future Enhancements', priority: 'low', frontend: 'planned', backend: 'planned', assignedOn: '' },
  { id: 'T062', name: 'i18n (EN/TR Translations)', nameTr: 'i18n (EN/TR Çeviriler)', description: 'Multi-language support for Turkish and English UI', descriptionTr: 'Türkçe ve İngilizce arayüz için çoklu dil desteği', status: 'planned', category: 'Future Enhancements', priority: 'low', frontend: 'planned', backend: 'na', assignedOn: '' },
  { id: 'T063', name: 'Data Export (CSV/Excel)', nameTr: 'Veri Dışa Aktarma (CSV/Excel)', description: 'Export orders, reports, transactions to CSV or Excel files', descriptionTr: 'Sipariş, rapor, işlemleri CSV veya Excel dosyalarına dışa aktar', status: 'planned', category: 'Future Enhancements', priority: 'low', frontend: 'planned', backend: 'planned', assignedOn: '' },
  { id: 'T064', name: 'Notification Center', nameTr: 'Bildirim Merkezi', description: 'In-app notifications for order completion, credit alerts, system updates', descriptionTr: 'Sipariş tamamlama, kredi uyarıları, sistem güncellemeleri için uygulama içi bildirimler', status: 'planned', category: 'Future Enhancements', priority: 'low', frontend: 'planned', backend: 'planned', assignedOn: '' },
  { id: 'T065', name: 'Scheduled SMS Campaigns', nameTr: 'Zamanlanmış SMS Kampanyaları', description: 'Schedule orders for future date/time with timezone support', descriptionTr: 'Saat dilimi desteği ile ileri tarih/saat için sipariş zamanlama', status: 'planned', category: 'Future Enhancements', priority: 'medium', frontend: 'planned', backend: 'planned', assignedOn: '' },
  { id: 'T066', name: 'SMS Worker Deployment (WebJob)', nameTr: 'SMS Worker Dağıtımı (WebJob)', description: 'Deploy Worker as Azure WebJob or separate App Service', descriptionTr: 'Worker\'ı Azure WebJob veya ayrı App Service olarak dağıt', status: 'planned', category: 'Future Enhancements', priority: 'medium', frontend: 'na', backend: 'planned', assignedOn: '' },
  { id: 'T067', name: 'CaddeSMS Data Migration', nameTr: 'CaddeSMS Veri Taşıma', description: 'Migrate historical data from old PHP CaddeSMS to new SMSCore', descriptionTr: 'Eski PHP CaddeSMS\'ten yeni SMSCore\'a geçmiş verileri taşı', status: 'planned', category: 'Future Enhancements', priority: 'low', frontend: 'na', backend: 'planned', assignedOn: '' },
]

// ─── Config ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: any }> = {
  'done':        { label: 'done',        color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: Check },
  'in-progress': { label: 'in-progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  'pending':     { label: 'pending',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: AlertCircle },
  'planned':     { label: 'planned',     color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: Minus },
}

const DEV_CONFIG: Record<DevStatus, { label: string; color: string; bg: string }> = {
  'done':        { label: 'devDone',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'in-progress': { label: 'devWip',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'pending':     { label: 'devPending', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  'planned':     { label: 'devPlanned', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  'na':          { label: 'devNa',      color: '#4b5563', bg: 'transparent' },
}

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  'high':   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  'medium': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'low':    { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TaskListPage() {
  const [lang, setLang] = useState<Lang>('en')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [search, setSearch] = useState('')

  const t = (key: string) => T[key]?.[lang] ?? key
  const catLabel = (cat: string) => lang === 'tr' ? (CAT_TR[cat] ?? cat) : cat

  const categories = [...new Set(TASKS.map(t => t.category))]

  const filtered = TASKS.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false
    if (filterCategory && task.category !== filterCategory) return false
    if (filterPriority && task.priority !== filterPriority) return false
    if (search) {
      const s = search.toLowerCase()
      const name = lang === 'tr' ? task.nameTr : task.name
      const desc = lang === 'tr' ? task.descriptionTr : task.description
      if (!name.toLowerCase().includes(s) && !desc.toLowerCase().includes(s) && !task.id.toLowerCase().includes(s)) return false
    }
    return true
  })

  const stats = {
    total: TASKS.length,
    done: TASKS.filter(t => t.status === 'done').length,
    inProgress: TASKS.filter(t => t.status === 'in-progress').length,
    planned: TASKS.filter(t => t.status === 'planned').length,
  }
  const progress = Math.round((stats.done / stats.total) * 100)
  const hasFilters = !!(filterStatus || filterCategory || filterPriority || search)

  const selStyle: React.CSSProperties = {
    height: 34, paddingInline: 10, borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: '#1a2332', color: '#e2e8f0',
    fontSize: 12, colorScheme: 'dark',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1a', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ═══ HEADER ═══ */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(10,15,26,0.95)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageSquareMore style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800 }}>
            KKTC<span style={{ color: '#0d9488' }}>SMS</span>
            <span style={{ opacity: 0.3, fontWeight: 400, marginLeft: 8 }}>{t('projectTracker')}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Lang toggle */}
          <div style={{ display: 'flex', gap: 2, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['en', 'tr'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{
                  padding: '4px 14px', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                  backgroundColor: lang === l ? '#0d9488' : 'rgba(255,255,255,0.04)',
                  color: lang === l ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.15s', textTransform: 'uppercase',
                }}>
                {l}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, opacity: 0.5 }}>{stats.done}/{stats.total} {t('tasks')}</span>
          <div style={{ width: 140, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div style={{ width: `${progress}%`, height: '100%', borderRadius: 3, backgroundColor: '#0d9488', transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0d9488' }}>{progress}%</span>
        </div>
      </header>

      {/* ═══ STATS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '20px 24px 0' }}>
        {[
          { label: t('totalTasks'), value: stats.total, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
          { label: t('completed'), value: stats.done, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: t('inProgress'), value: stats.inProgress, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: t('planned'), value: stats.planned, color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '16px 18px', borderRadius: 12, backgroundColor: s.bg, border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ═══ FILTERS ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 0 220px' }}>
          <Filter style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, opacity: 0.3, pointerEvents: 'none' }} />
          <input type="text" placeholder={t('searchTasks')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: 34, paddingLeft: 30, paddingRight: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#1a2332', color: '#e2e8f0', fontSize: 12, outline: 'none', colorScheme: 'dark' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selStyle}>
          <option value="">{t('allStatus')}</option>
          <option value="done">{t('done')}</option>
          <option value="in-progress">{t('inProgressS')}</option>
          <option value="pending">{t('pending')}</option>
          <option value="planned">{t('plannedS')}</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={selStyle}>
          <option value="">{t('allCategories')}</option>
          {categories.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={selStyle}>
          <option value="">{t('allPriority')}</option>
          <option value="high">{t('high')}</option>
          <option value="medium">{t('medium')}</option>
          <option value="low">{t('low')}</option>
        </select>
        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterCategory(''); setFilterPriority('') }}
            style={{ height: 34, padding: '0 12px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t('clear')}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, opacity: 0.35 }}>{filtered.length} {t('of')} {TASKS.length} {t('tasks')}</span>
      </div>

      {/* ═══ TABLE ═══ */}
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { label: t('id'), w: 60 },
                  { label: t('task'), w: undefined },
                  { label: t('category'), w: 150 },
                  { label: t('assignedOn'), w: 100 },
                  { label: t('frontendCol'), w: 90 },
                  { label: t('backendCol'), w: 90 },
                  { label: t('priority'), w: 80 },
                  { label: t('statusCol'), w: 110 },
                ].map(h => (
                  <th key={h.label} style={{
                    textAlign: 'left', padding: '12px 14px', fontSize: 10, fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    borderBottom: '2px solid rgba(13,148,136,0.3)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    color: 'rgba(255,255,255,0.4)', width: h.w,
                  }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 48, opacity: 0.3, fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {t('noMatch')}
                  </td>
                </tr>
              ) : filtered.map(task => {
                const sc = STATUS_CONFIG[task.status]
                const pc = PRIORITY_CONFIG[task.priority]
                const fc = DEV_CONFIG[task.frontend]
                const bc = DEV_CONFIG[task.backend]
                const Icon = sc.icon
                return (
                  <tr key={task.id}
                    style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, fontFamily: 'monospace', opacity: 0.35 }}>
                      {task.id}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'tr' ? task.nameTr : task.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.4, marginTop: 2, lineHeight: 1.4 }}>{lang === 'tr' ? task.descriptionTr : task.description}</div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, opacity: 0.5 }}>
                      {catLabel(task.category)}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, opacity: 0.4, whiteSpace: 'nowrap' }}>
                      {task.assignedOn ? new Date(task.assignedOn).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : <span style={{ opacity: 0.3 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: fc.bg, color: fc.color }}>
                        {t(fc.label)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: bc.bg, color: bc.color }}>
                        {t(bc.label)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, backgroundColor: pc.bg, color: pc.color, textTransform: 'uppercase' }}>
                        {t(task.priority)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, backgroundColor: sc.bg, color: sc.color }}>
                        <Icon style={{ width: 12, height: 12 }} />
                        {t(sc.label)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: 10, opacity: 0.3,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: 'linear-gradient(135deg, #0d9488, #0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquareMore style={{ width: 9, height: 9, color: '#fff' }} />
          </div>
          KKTC SMS — {t('projectTracker')}
        </div>
        <span>© {new Date().getFullYear()} KKTC SMS</span>
      </footer>
    </div>
  )
}
