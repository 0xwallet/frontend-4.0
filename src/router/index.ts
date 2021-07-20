import { useTitle } from "@vueuse/core";
import { i18n } from "../main";
import { message } from "ant-design-vue";
import { PRODUCT_NAME } from "../constants/index";
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import { useUserStore } from "../store";
// vue 文件
import Login from "../pages/Login/index.vue";
import Dashboard from "../pages/Dashboard/index.vue";
import Account from "../pages/Account/index.vue";
import Security from "../pages/Security/index.vue";
//
import Layout from "../pages/Layout.vue";
import MetanetFile from "../pages/Metanet/File.vue";
import MetanetTransport from "../pages/Metanet/Transport/index.vue";
import MetanetShare from "../pages/Metanet/Share.vue";
import MetanetPublish from "../pages/Metanet/Publish.vue";
import MetanetCollect from "../pages/Metanet/Collect.vue";
import MetanetRecycle from "../pages/Metanet/Recycle.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    meta: {
      needAuth: false,
      title: "signIn",
    },
    component: Login,
  },
  {
    path: "/",
    component: Layout,
    redirect: "/metanet/file", // TODO change it
    // redirect: "/general/metanet", // TODO change it
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        meta: {
          needAuth: true,
          title: "common.dashboard",
        },
        component: Dashboard,
      },
      {
        path: "account",
        name: "Account",
        meta: {
          needAuth: true,
          title: "common.account",
        },
        component: Account,
      },
      {
        path: "security",
        name: "Security",
        meta: {
          needAuth: true,
          title: "common.security",
        },
        component: Security,
      },
      {
        path: "metanet/file",
        name: "MetanetFile",
        meta: {
          needAuth: true,
          title: "metanet.file",
        },
        component: MetanetFile,
      },
      {
        path: "metanet/transport",
        name: "MetanetTransport",
        meta: {
          needAuth: true,
          title: "metanet.transport",
        },
        component: MetanetTransport,
      },
      {
        path: "metanet/share",
        name: "MetanetShare",
        meta: {
          needAuth: true,
          title: "metanet.shareButton",
        },
        component: MetanetShare,
      },
      {
        path: "metanet/publish",
        name: "MetanetPublish",
        meta: {
          needAuth: true,
          title: "metanet.publish",
        },
        component: MetanetPublish,
      },
      {
        path: "metanet/collect",
        name: "MetanetCollect",
        meta: {
          needAuth: true,
          title: "metanet.collectionButton",
        },
        component: MetanetCollect,
      },
      {
        path: "metanet/recycle",
        name: "MetanetRecycle",
        meta: {
          needAuth: true,
          title: "metanet.recycle",
        },
        component: MetanetRecycle,
      },
      // {
      //   // GeneralAccount will be rendered inside Layout's <router-view>
      //   // when /general/account is matched
      //   // 如果 path 是 / 开头就是根路径
      //   path: "general/account",
      //   name: "GeneralAccount",
      //   meta: {
      //     needAuth: true,
      //     title: "account",
      //   },
      //   component: GeneralAccount,
      // },
      // {
      //   path: "general/metanet",
      //   name: "GeneralMetanet",
      //   meta: {
      //     needAuth: true,
      //     title: "metanet",
      //   },
      //   component: GeneralMetanet,
      // },
      // {
      //   path: "general/security",
      //   name: "GeneralSecurity",
      //   meta: {
      //     needAuth: true,
      //     title: "security",
      //   },
      //   component: GeneralSecurity,
      // },
    ],
  },
  {
    // TODO 4040 找不到叶妙
    // path: "*",
    path: "/:catchAll(.*)",
    redirect: "/metanet/file",
  },
  // {
  //   path: "/about",
  //   name: "About",
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () =>
  //     import(/* webpackChunkName: "about" */ "../pages/About.vue"),
  // },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 守卫-登录权限
router.beforeEach((to, from) => {
  // console.log("to.name", to.name);
  if (to.name !== "Login" && to.meta.needAuth && !useUserStore().isLoggedIn) {
    // TODO 路由跳转提示
    // message.error(i18n.global.t("pageLogin.pleaseSignInFirst"));
    return {
      path: "/login",
      replace: true,
      query: {
        redirect: to.path,
      },
    };
  }
});
// 守卫-浏览器标题
router.beforeEach((to, from) => {
  const textPath = `${to.meta.title}`;
  useTitle(`${i18n.global.t(textPath)} - ${PRODUCT_NAME}`);
});

export default router;
