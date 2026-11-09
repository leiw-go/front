/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn, 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user/login',
        name: 'login',
        component: './user/login',
      },
      {
        path: '/user',
        redirect: '/user/login',
      },
      {
        name: '404',
        component: './exception/404',
        path: '/user/*',
      },
    ],
  },
  // 系统管理模块
  {
    name: 'system',
    icon: 'setting',
    path: '/system',
    access: 'canAdmin',
    routes: [
      {
        path: '/system',
        redirect: '/system/role-manage',
      },
      {
        name: 'role-manage',
        icon: 'safetyCertificate',
        path: '/system/role-manage',
        component: './system/role-manage',
      },
    ],
  },
  {
    name: 'account',
    icon: 'user',
    path: '/account',
    routes: [
      {
        path: '/account',
        redirect: '/account/center',
      },
      {
        name: 'center',
        icon: 'user',
        path: '/account/center',
        component: './account/center',
        access: 'canAdmin',
      },
      {
        name: 'settings',
        icon: 'setting',
        path: '/account/settings',
        component: './account/settings',
      },
      {
        name: 'user-manage',
        icon: 'team',
        path: '/account/user-manage',
        component: './account/user-manage',
        access: 'canAdmin',
      },
    ],
  },
  {
    path: '/chatbot',
    name: 'chatbot',
    icon: 'robot',
    component: './chatbot',
    access: 'canAdmin',
  },
  // 外贸 CRM 模块（对应后端 /api/crm/**）
  {
    path: '/crm',
    name: 'crm',
    icon: 'global',
    access: 'canAdmin',
    routes: [
      {
        path: '/crm',
        redirect: '/crm/dashboard',
      },
      {
        name: 'dashboard',
        icon: 'dashboard',
        path: '/crm/dashboard',
        component: './crm/dashboard',
      },
      {
        name: 'customer-manage',
        icon: 'team',
        path: '/crm/customer-manage',
        component: './crm/customer-manage',
      },
      {
        name: 'product-manage',
        icon: 'shopping',
        path: '/crm/product-manage',
        component: './crm/product-manage',
      },
      {
        name: 'opportunity-manage',
        icon: 'funnelPlot',
        path: '/crm/opportunity-manage',
        component: './crm/opportunity-manage',
      },
      {
        name: 'inquiry-manage',
        icon: 'inbox',
        path: '/crm/inquiry-manage',
        component: './crm/inquiry-manage',
      },
      {
        name: 'quotation-manage',
        icon: 'fileText',
        path: '/crm/quotation-manage',
        component: './crm/quotation-manage',
      },
      {
        name: 'order-manage',
        icon: 'reconciliation',
        path: '/crm/order-manage',
        component: './crm/order-manage',
      },
      {
        name: 'shipment-manage',
        icon: 'car',
        path: '/crm/shipment-manage',
        component: './crm/shipment-manage',
      },
      {
        name: 'email-manage',
        icon: 'mail',
        path: '/crm/email-manage',
        component: './crm/email-manage',
      },
      {
        name: 'currency-manage',
        icon: 'dollar',
        path: '/crm/currency-manage',
        component: './crm/currency-manage',
      },
      {
        name: 'message-center',
        icon: 'bell',
        path: '/crm/message-center',
        component: './crm/message-center',
      },
    ],
  },
  {
    path: '/',
    redirect: '/crm/dashboard',
  },
  {
    component: './exception/404',
    path: '/*',
  },
];
