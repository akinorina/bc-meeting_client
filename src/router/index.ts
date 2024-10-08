import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '../views/IndexView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'index',
      component: IndexView
    },
    {
      path: '/samples',
      name: 'samples',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/samples/IndexView.vue')
    },
    {
      path: '/samples/generalmodal',
      name: 'samples_generalmodal',
      component: () => import('../views/samples/ModalGeneralView.vue')
    },
    {
      path: '/signin',
      name: 'sign-in',
      component: () => import('../views/auth/SigninView.vue')
    },
    {
      path: '/signin-google-redirect',
      name: 'sign-in-google-redirect',
      component: () => import('../views/auth/SigninGoogleView.vue')
    },
    {
      path: '/signout',
      name: 'sign-out',
      component: () => import('../views/auth/SignOutView.vue')
    },
    {
      path: '/signup',
      name: 'sign-up',
      component: () => import('../views/auth/SignUpView.vue')
    },
    {
      path: '/signup-sent-email',
      name: 'sign-up-sent-email',
      component: () => import('../views/auth/SignUpSentEmailView.vue')
    },
    {
      path: '/signup-register-info',
      name: 'sign-up-register-info',
      component: () => import('../views/auth/SignUpRegisterInfoView.vue'),
      props: true
    },
    {
      path: '/signup-completion',
      name: 'sign-up-completion',
      component: () => import('../views/auth/SignUpCompletionView.vue')
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/auth/ResetPassword.vue')
    },
    {
      path: '/reset-password-sent-email',
      name: 'reset-password-sent-email',
      component: () => import('../views/auth/ResetPasswordSentEmailView.vue')
    },
    {
      path: '/reset-password-input',
      name: 'reset-password-input',
      component: () => import('../views/auth/ResetPasswordInputView.vue'),
      props: true
    },
    {
      path: '/reset-password-completion',
      name: 'reset-password-completion',
      component: () => import('../views/auth/ResetPasswordCompletionView.vue')
    },
    {
      path: '/mypage',
      name: 'mypage',
      component: () => import('../views/mypage/IndexView.vue')
    },
    {
      path: '/mypage/change-password',
      name: 'mypage_change-password',
      component: () => import('../views/mypage/ChangePasswordView.vue')
    },
    {
      path: '/mypage/users',
      name: 'mypage_users',
      component: () => import('../views/mypage/users/IndexUsers.vue')
    },
    {
      path: '/mypage/users/:id/edit',
      name: 'mypage_users_edit',
      component: () => import('../views/mypage/users/EditUsers.vue'),
      props: true
    },
    {
      path: '/mypage/users/new',
      name: 'mypage_users_new',
      component: () => import('../views/mypage/users/NewUsers.vue')
    },
    {
      path: '/mypage/images',
      name: 'mypage_images',
      component: () => import('../views/mypage/images/IndexImages.vue')
    },
    {
      path: '/mypage/images/:id/edit',
      name: 'mypage_images_edit',
      component: () => import('../views/mypage/images/EditImages.vue'),
      props: true
    },
    {
      path: '/mypage/images/new',
      name: 'mypage_images_new',
      component: () => import('../views/mypage/images/NewImages.vue'),
      props: true
    },
    {
      path: '/mypage/blogs',
      name: 'mypage_blogs',
      component: () => import('../views/mypage/blogs/IndexBlogs.vue')
    },
    {
      path: '/mypage/blogs/:id/edit',
      name: 'mypage_blogs_edit',
      component: () => import('../views/mypage/blogs/EditBlogs.vue'),
      props: true
    },
    {
      path: '/mypage/blogs/new',
      name: 'mypage_blogs_new',
      component: () => import('../views/mypage/blogs/NewBlogs.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 行き先ページが管理者用ページである判定
  const isMyPage = String(to.name).match(/^mypage/) !== null

  if (isMyPage && !authStore.isAuthenticated()) {
    // 管理者用ページへ未認証状態で遷移の場合、ログイン画面へ遷移
    next({ name: 'sign-in' })
  } else {
    // 通常
    next()
  }
})

export default router
