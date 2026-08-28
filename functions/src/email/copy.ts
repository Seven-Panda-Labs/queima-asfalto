import type { AppLanguage } from '../shared/account/types.js'

type AdminNewUserCopy = {
  subject: string
  title: string
  body: (params: { name: string; email: string }) => string
  approveLabel: string
  rejectLabel: string
}

type UserDecisionCopy = {
  subject: string
  title: string
  body: string
  ctaLabel: string
}

const adminNewUser: Record<AppLanguage, AdminNewUserCopy> = {
  pt: {
    subject: 'Novo registo pendente de aprovação',
    title: 'Novo utilizador',
    body: ({ name, email }) =>
      `<p><strong>${escape(name || '-')}</strong> (${escape(email)}) pediu acesso à instância.</p><p>Aprova ou rejeita este registo:</p>`,
    approveLabel: 'Aprovar conta',
    rejectLabel: 'Rejeitar conta',
  },
  en: {
    subject: 'New sign-up pending approval',
    title: 'New user',
    body: ({ name, email }) =>
      `<p><strong>${escape(name || '-')}</strong> (${escape(email)}) requested access to this instance.</p><p>Approve or reject this registration:</p>`,
    approveLabel: 'Approve account',
    rejectLabel: 'Reject account',
  },
  es: {
    subject: 'Nuevo registro pendiente de aprobación',
    title: 'Nuevo usuario',
    body: ({ name, email }) =>
      `<p><strong>${escape(name || '-')}</strong> (${escape(email)}) solicitó acceso a la instancia.</p><p>Aprueba o rechaza este registro:</p>`,
    approveLabel: 'Aprobar cuenta',
    rejectLabel: 'Rechazar cuenta',
  },
  de: {
    subject: 'Neue Registrierung wartet auf Freigabe',
    title: 'Neuer Nutzer',
    body: ({ name, email }) =>
      `<p><strong>${escape(name || '-')}</strong> (${escape(email)}) hat Zugang zur Instanz angefordert.</p><p>Freigeben oder ablehnen:</p>`,
    approveLabel: 'Konto freigeben',
    rejectLabel: 'Konto ablehnen',
  },
  fr: {
    subject: 'Nouvelle inscription en attente d’approbation',
    title: 'Nouvel utilisateur',
    body: ({ name, email }) =>
      `<p><strong>${escape(name || '-')}</strong> (${escape(email)}) a demandé l’accès à cette instance.</p><p>Approuve ou refuse cette inscription :</p>`,
    approveLabel: 'Approuver le compte',
    rejectLabel: 'Refuser le compte',
  },
  ar: {
    subject: 'تسجيل جديد بانتظار الموافقة',
    title: 'مستخدم جديد',
    body: ({ name, email }) =>
      `<p><strong>${escape(name || '-')}</strong> (${escape(email)}) طلب الوصول إلى هذه النسخة.</p><p>اقبل هذا التسجيل أو ارفضه:</p>`,
    approveLabel: 'قبول الحساب',
    rejectLabel: 'رفض الحساب',
  },
}

const userApproved: Record<AppLanguage, UserDecisionCopy> = {
  pt: {
    subject: 'A tua conta foi aprovada',
    title: 'Conta aprovada',
    body: '<p>O administrador aprovou o teu registo. Já podes entrar e começar a usar a aplicação.</p>',
    ctaLabel: 'Entrar na aplicação',
  },
  en: {
    subject: 'Your account was approved',
    title: 'Account approved',
    body: '<p>An administrator approved your registration. You can sign in and start using the app.</p>',
    ctaLabel: 'Open the app',
  },
  es: {
    subject: 'Tu cuenta fue aprobada',
    title: 'Cuenta aprobada',
    body: '<p>Un administrador aprobó tu registro. Ya puedes iniciar sesión y usar la aplicación.</p>',
    ctaLabel: 'Abrir la aplicación',
  },
  de: {
    subject: 'Dein Konto wurde freigegeben',
    title: 'Konto freigegeben',
    body: '<p>Ein Administrator hat deine Registrierung freigegeben. Du kannst dich anmelden und die App nutzen.</p>',
    ctaLabel: 'App öffnen',
  },
  fr: {
    subject: 'Ton compte a été approuvé',
    title: 'Compte approuvé',
    body: '<p>Un administrateur a approuvé ton inscription. Tu peux te connecter et commencer à utiliser l’application.</p>',
    ctaLabel: 'Ouvrir l’application',
  },
  ar: {
    subject: 'تمت الموافقة على حسابك',
    title: 'تمت الموافقة على الحساب',
    body: '<p>وافق المسؤول على تسجيلك. يمكنك الآن تسجيل الدخول والبدء في استخدام التطبيق.</p>',
    ctaLabel: 'افتح التطبيق',
  },
}

const userRejected: Record<AppLanguage, UserDecisionCopy> = {
  pt: {
    subject: 'Registo não aprovado',
    title: 'Conta não aprovada',
    body: '<p>O administrador não aprovou o teu registo nesta instância. Se achares que é um engano, contacta o administrador do site.</p>',
    ctaLabel: 'Voltar ao início',
  },
  en: {
    subject: 'Registration not approved',
    title: 'Account not approved',
    body: '<p>An administrator did not approve your registration on this instance. Contact the site administrator if you believe this is a mistake.</p>',
    ctaLabel: 'Back to home',
  },
  es: {
    subject: 'Registro no aprobado',
    title: 'Cuenta no aprobada',
    body: '<p>Un administrador no aprobó tu registro en esta instancia. Contacta al administrador si crees que es un error.</p>',
    ctaLabel: 'Volver al inicio',
  },
  de: {
    subject: 'Registrierung nicht freigegeben',
    title: 'Konto nicht freigegeben',
    body: '<p>Ein Administrator hat deine Registrierung auf dieser Instanz nicht freigegeben. Wende dich an den Administrator, wenn du glaubst, dass es ein Fehler ist.</p>',
    ctaLabel: 'Zur Startseite',
  },
  fr: {
    subject: 'Inscription non approuvée',
    title: 'Compte non approuvé',
    body: '<p>Un administrateur n’a pas approuvé ton inscription sur cette instance. Contacte l’administrateur du site si tu penses qu’il s’agit d’une erreur.</p>',
    ctaLabel: 'Retour à l’accueil',
  },
  ar: {
    subject: 'لم تتم الموافقة على التسجيل',
    title: 'لم تتم الموافقة على الحساب',
    body: '<p>لم يوافق المسؤول على تسجيلك في هذه النسخة. إذا كنت تعتقد أن هذا خطأ، تواصل مع مسؤول الموقع.</p>',
    ctaLabel: 'العودة إلى الصفحة الرئيسية',
  },
}

function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function getAdminNewUserCopy(language: AppLanguage): AdminNewUserCopy {
  return adminNewUser[language]
}

export function getUserApprovedCopy(language: AppLanguage): UserDecisionCopy {
  return userApproved[language]
}

export function getUserRejectedCopy(language: AppLanguage): UserDecisionCopy {
  return userRejected[language]
}
