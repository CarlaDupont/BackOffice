import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '../pages/DashboardPage.vue';
import FavoritesPage from '../pages/FavoritesPage.vue';
import DestinationsPage from '../pages/DestinationsPage.vue';
import NotificationsPage from '../pages/NotificationsPage.vue';
import AuthPage from '../pages/AuthPage.vue';
import AccountPage from '../pages/AccountPage.vue';
import ReservationsPage from '../pages/ReservationsPage.vue';

let isAuthenticated = false;

function markAsAuthenticated() {
  isAuthenticated = true;
}

const routes = [
  {
    path: '/login',
    component: AuthPage,
    name: 'login'
  },
  {
    path: '/',
    component: DashboardPage,
    name: 'dashboard'
  },
  {
    path: '/favorites',
    component: FavoritesPage,
    name: 'favorites'
  },
  {
    path: '/destinations',
    component: DestinationsPage,
    name: 'destinations'
  },
  {
    path: '/reservations',
    component: ReservationsPage,
    name: 'reservations'
  },
  {
    path: '/notifications',
    component: NotificationsPage,
    name: 'notifications'
  },
  {
    path: '/account',
    component: AccountPage,
    name: 'account'
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.name !== 'login' && !isAuthenticated) {
    return next({ name: 'login' });
  }
  next();
});

export { markAsAuthenticated };
export default router;
