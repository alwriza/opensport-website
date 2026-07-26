import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// EN
import commonEN from './locales/en/common.json';
import teamEN from './locales/en/team.json';
import navbarEN from './locales/en/navbar.json';
import footerEN from './locales/en/footer.json';
import homeEN from './locales/en/home.json';
import aboutEN from './locales/en/about.json';
import authEN from './locales/en/auth.json';
import dashboardEN from './locales/en/dashboard.json';
import playerEN from './locales/en/player.json';
import trainingEN from './locales/en/training.json';
import termsEN from './locales/en/terms.json';
import privacyEN from './locales/en/privacy.json';
import rankingEN from './locales/en/ranking.json';

// RU
import commonRU from './locales/ru/common.json';
import teamRU from './locales/ru/team.json';
import navbarRU from './locales/ru/navbar.json';
import footerRU from './locales/ru/footer.json';
import homeRU from './locales/ru/home.json';
import aboutRU from './locales/ru/about.json';
import authRU from './locales/ru/auth.json';
import dashboardRU from './locales/ru/dashboard.json';
import playerRU from './locales/ru/player.json';
import trainingRU from './locales/ru/training.json';
import termsRU from './locales/ru/terms.json';
import privacyRU from './locales/ru/privacy.json';
import rankingRU from './locales/ru/ranking.json';

// KK
import commonKK from './locales/kk/common.json';
import teamKK from './locales/kk/team.json';
import navbarKK from './locales/kk/navbar.json';
import footerKK from './locales/kk/footer.json';
import homeKK from './locales/kk/home.json';
import aboutKK from './locales/kk/about.json';
import authKK from './locales/kk/auth.json';
import dashboardKK from './locales/kk/dashboard.json';
import playerKK from './locales/kk/player.json';
import trainingKK from './locales/kk/training.json';
import termsKK from './locales/kk/terms.json';
import privacyKK from './locales/kk/privacy.json';
import rankingKK from './locales/kk/ranking.json';

export const defaultNS = 'common';
export const resources = {
    en: {
        common: commonEN,
        team: teamEN,
        navbar: navbarEN,
        footer: footerEN,
        home: homeEN,
        about: aboutEN,
        auth: authEN,
        dashboard: dashboardEN,
        player: playerEN,
        training: trainingEN,
        terms: termsEN,
        privacy: privacyEN,
        ranking: rankingEN,
    },
    ru: {
        common: commonRU,
        team: teamRU,
        navbar: navbarRU,
        footer: footerRU,
        home: homeRU,
        about: aboutRU,
        auth: authRU,
        dashboard: dashboardRU,
        player: playerRU,
        training: trainingRU,
        terms: termsRU,
        privacy: privacyRU,
        ranking: rankingRU,
    },
    kk: {
        common: commonKK,
        team: teamKK,
        navbar: navbarKK,
        footer: footerKK,
        home: homeKK,
        about: aboutKK,
        auth: authKK,
        dashboard: dashboardKK,
        player: playerKK,
        training: trainingKK,
        terms: termsKK,
        privacy: privacyKK,
        ranking: rankingKK,
    },
} as const;

i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        debug: true,
        fallbackLng: 'ru',
        supportedLngs: ['en', 'ru', 'kk'],
        defaultNS,
        resources,

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng'
        }
    });

export default i18n;
