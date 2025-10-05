/**
 * 路由配置
 */

import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/Register.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../views/ResetPassword.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/universe',
      name: 'Universe',
      component: () => import('../views/Universe.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/planet/:id',
      name: 'Planet',
      component: () => import('../views/Planet.vue'),
      meta: { requiresAuth: true }
    }
  ]
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const requiresAuth = to.meta.requiresAuth;
  
  if (requiresAuth && !userStore.isAuthenticated) {
    // 需要认证但未登录，跳转到登录页
    next('/login');
  } else if (!requiresAuth && userStore.isAuthenticated && to.path !== '/universe') {
    // 已登录且访问登录/注册页，跳转到宇宙界面
    next('/universe');
  } else {
    next();
  }
});

export default router;
